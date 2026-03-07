const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");
const Message = require("../models/message.model");
const Room = require("../models/room.model");
const { sendPushNotification } = require("../services/notification.service");

// Track online users: { userId: { socketId, username, avatar } }
const onlineUsers = new Map();

module.exports = (io) => {
    // ─────────────────────────────────────────────────
    // STEP 1: WebSocket Handshake — JWT Authentication
    // ─────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            // Attach user data to socket
            socket.user = user;
            next();
        } catch (err) {
            console.error("Socket auth error:", err.message);
            next(new Error("Authentication error: Invalid token"));
        }
    });

    // ─────────────────────────────────────────────────
    // STEP 2: Connection — Server assigns socket ID
    // ─────────────────────────────────────────────────
    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();
        const username = socket.user.username;

        console.log(`✅ User connected: ${username} (${userId}) → Socket: ${socket.id}`);

        // Track online user
        onlineUsers.set(userId, {
            socketId: socket.id,
            username: socket.user.username,
            avatar: socket.user.avatar,
        });

        // Update user status in DB
        await User.findByIdAndUpdate(userId, { status: "online" });

        // Emit socket ID back to client
        socket.emit("connected", {
            socketId: socket.id,
            userId: userId,
            username: username,
            message: "Connected successfully",
        });

        // Broadcast updated online users list
        io.emit("online_users", Array.from(onlineUsers.entries()).map(([id, data]) => ({
            userId: id,
            ...data,
        })));

        // ─────────────────────────────────────────────────
        // STEP 3: User joins a room
        // ─────────────────────────────────────────────────
        socket.on("join_room", async (data) => {
            try {
                const { roomId } = typeof data === "string" ? { roomId: data } : data;

                if (!roomId) {
                    return socket.emit("error", { message: "roomId is required" });
                }

                // Verify room exists and user is a participant
                const room = await Room.findById(roomId);
                if (!room) {
                    return socket.emit("error", { message: "Room not found" });
                }

                if (!room.participants.includes(userId)) {
                    return socket.emit("error", { message: "You are not a participant of this room" });
                }

                // Join the socket room
                socket.join(roomId);
                console.log(`📌 ${username} joined room: ${roomId}`);

                // Load previous messages (paginated — last 50)
                const messages = await Message.find({ roomId })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate("sender", "username avatar")
                    .lean();

                // Send messages in chronological order
                socket.emit("load_messages", {
                    roomId,
                    messages: messages.reverse(),
                    hasMore: messages.length === 50,
                });

                // Notify room that user joined
                socket.to(roomId).emit("user_joined", {
                    userId,
                    username,
                    roomId,
                    timestamp: new Date(),
                });
            } catch (err) {
                console.error("Error joining room:", err);
                socket.emit("error", { message: "Failed to join room" });
            }
        });

        // ─────────────────────────────────────────────────
        // STEP 4 & 7: User sends a TEXT message → Saved to DB
        // ─────────────────────────────────────────────────
        socket.on("send_message", async (data) => {
            try {
                console.log(`📥 [Socket Receive] send_message:`, JSON.stringify(data, null, 2));
                const { roomId, text, messageType = "text" } = data;

                // Validation: text is only strictly required for "text" message type
                if (!roomId || (messageType === "text" && !text)) {
                    console.error(`❌ Validation failed for send_message: roomId=${roomId}, text=${text}, type=${messageType}`);
                    return socket.emit("error", { message: "roomId and text (for text messages) are required" });
                }

                // Verify room exists
                const room = await Room.findById(roomId);
                if (!room) {
                    return socket.emit("error", { message: "Room not found" });
                }

                // Save message to database
                const newMessage = new Message({
                    roomId,
                    sender: userId,
                    text: text.trim(),
                    messageType,
                    readBy: [userId], // Sender has read it
                });

                // Handle base64 audio if it's a voice message
                if (messageType === "voice" && data.audio) {
                    try {
                        const fileName = `voice_${Date.now()}.m4a`;
                        const uploadDir = path.join(__dirname, "../../uploads/voice");
                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }
                        const filePath = path.join(uploadDir, fileName);
                        const base64Data = data.audio.includes(";base64,") ? data.audio.split(";base64,")[1] : data.audio;
                        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
                        newMessage.voiceUrl = `/uploads/voice/${fileName}`;
                    } catch (err) {
                        console.error("Error saving voice message file:", err);
                    }
                }

                await newMessage.save();

                // Populate sender info for broadcast
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate("sender", "username avatar")
                    .lean();

                // Update room's last message
                await Room.findByIdAndUpdate(roomId, {
                    lastMessage: {
                        text: messageType === "voice" ? "🎤 Voice message" : text.trim(),
                        sender: userId,
                        timestamp: new Date(),
                    },
                });

                // ─────────────────────────────────────────────────
                // STEP 5 & 6: Broadcast to room → Clients receive
                // ─────────────────────────────────────────────────
                io.to(roomId).emit("receive_message", populatedMessage);

                // ─────────────────────────────────────────────────
                // STEP 8: Send Push Notifications to other participants
                // ─────────────────────────────────────────────────
                const recipients = room.participants.filter(p => p.toString() !== userId);

                recipients.forEach(async (recipientId) => {
                    if (!onlineUsers.has(recipientId.toString())) {
                        await sendPushNotification(recipientId, {
                            title: `New Message from ${username}`,
                            body: text.length > 50 ? text.substring(0, 47) + "..." : text,
                            data: {
                                roomId: roomId.toString(),
                                type: "CHAT_MESSAGE",
                                senderId: userId,
                            }
                        });
                    }
                });

                console.log(`💬 ${username} → Room ${roomId}: ${text.substring(0, 50)}`);
            } catch (err) {
                console.error("Error sending message:", err);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // ─────────────────────────────────────────────────
        // VOICE MESSAGE: Broadcast after REST upload
        // Client calls POST /api/chat/upload/voice first, then emits this
        // event with the returned message object so all room members get it.
        // ─────────────────────────────────────────────────
        socket.on("broadcast_voice_message", async (data) => {
            try {
                // data = { roomId, message } — message is the populated doc returned by REST upload
                const { roomId, message } = data;

                if (!roomId || !message) {
                    return socket.emit("error", { message: "roomId and message are required" });
                }

                // Verify room exists and sender is a participant
                const room = await Room.findById(roomId);
                if (!room) {
                    return socket.emit("error", { message: "Room not found" });
                }

                // Broadcast to all room members (including sender, for multi-device)
                io.to(roomId).emit("receive_message", message);

                // Push notification for offline participants
                const recipients = room.participants.filter(p => p.toString() !== userId);
                recipients.forEach(async (recipientId) => {
                    if (!onlineUsers.has(recipientId.toString())) {
                        await sendPushNotification(recipientId, {
                            title: `🎤 Voice message from ${username}`,
                            body: "Sent you a voice message",
                            data: {
                                roomId: roomId.toString(),
                                type: "CHAT_VOICE_MESSAGE",
                                senderId: userId,
                            }
                        });
                    }
                });

                console.log(`🎤 ${username} → Room ${roomId}: voice message broadcast`);
            } catch (err) {
                console.error("Error broadcasting voice message:", err);
                socket.emit("error", { message: "Failed to broadcast voice message" });
            }
        });

        // ─────────────────────────────────────────────────
        // Load older messages (pagination)
        // ─────────────────────────────────────────────────
        socket.on("load_more_messages", async (data) => {
            try {
                const { roomId, before } = data; // `before` is a message timestamp or ID

                const query = { roomId };
                if (before) {
                    query.createdAt = { $lt: new Date(before) };
                }

                const messages = await Message.find(query)
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate("sender", "username avatar")
                    .lean();

                socket.emit("older_messages", {
                    roomId,
                    messages: messages.reverse(),
                    hasMore: messages.length === 50,
                });
            } catch (err) {
                console.error("Error loading more messages:", err);
                socket.emit("error", { message: "Failed to load messages" });
            }
        });

        // ─────────────────────────────────────────────────
        // Mark messages as read
        // ─────────────────────────────────────────────────
        socket.on("mark_read", async (data) => {
            try {
                const { roomId } = data;

                await Message.updateMany(
                    { roomId, sender: { $ne: userId }, readBy: { $nin: [userId] } },
                    { $addToSet: { readBy: userId } }
                );

                socket.to(roomId).emit("messages_read", {
                    roomId,
                    userId,
                    username,
                    timestamp: new Date(),
                });
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        });

        // ─────────────────────────────────────────────────
        // Typing indicators
        // ─────────────────────────────────────────────────
        socket.on("typing", (data) => {
            const { roomId } = typeof data === "string" ? { roomId: data } : data;
            socket.to(roomId).emit("user_typing", {
                userId,
                username,
                roomId,
            });
        });

        socket.on("stop_typing", (data) => {
            const { roomId } = typeof data === "string" ? { roomId: data } : data;
            socket.to(roomId).emit("user_stop_typing", {
                userId,
                username,
                roomId,
            });
        });

        // ─────────────────────────────────────────────────
        // Leave room
        // ─────────────────────────────────────────────────
        socket.on("leave_room", (data) => {
            const { roomId } = typeof data === "string" ? { roomId: data } : data;
            socket.leave(roomId);
            console.log(`🚪 ${username} left room: ${roomId}`);

            socket.to(roomId).emit("user_left", {
                userId,
                username,
                roomId,
                timestamp: new Date(),
            });
        });

        // ─────────────────────────────────────────────────
        // Create / Get Direct Chat Room
        // ─────────────────────────────────────────────────
        socket.on("create_room", async (data) => {
            try {
                const { participantId, name, type = "direct" } = data;

                if (type === "direct") {
                    // Check if a direct room already exists between these two users
                    const existingRoom = await Room.findOne({
                        type: "direct",
                        participants: { $all: [userId, participantId], $size: 2 },
                    }).populate("participants", "username avatar status");

                    if (existingRoom) {
                        return socket.emit("room_created", existingRoom);
                    }
                }

                // Create new room
                const participants = type === "direct"
                    ? [userId, participantId]
                    : [userId, ...(data.participantIds || [])];

                const room = new Room({
                    name: name || "",
                    type,
                    participants,
                    createdBy: userId,
                });
                await room.save();

                const populatedRoom = await Room.findById(room._id)
                    .populate("participants", "username avatar status");

                // Notify all participants
                participants.forEach((pId) => {
                    const pIdStr = pId.toString();
                    const onlineUser = onlineUsers.get(pIdStr);
                    if (onlineUser) {
                        io.to(onlineUser.socketId).emit("room_created", populatedRoom);
                    }
                });

                console.log(`🏠 Room created by ${username}: ${room._id}`);
            } catch (err) {
                console.error("Error creating room:", err);
                socket.emit("error", { message: "Failed to create room" });
            }
        });

        // ─────────────────────────────────────────────────
        // Get API List (for debugging)
        // ─────────────────────────────────────────────────
        socket.on("get_api_list", () => {
            const apiList = [
                {
                    event: "join_room",
                    args: "{ roomId }",
                    description: "Join a chat room. Loads last 50 messages.",
                },
                {
                    event: "send_message",
                    args: '{ roomId, text, messageType? ("text"|"image"|"file") }',
                    description: "Send a text message to a room. Saved to DB & broadcast to all room members.",
                },
                {
                    event: "broadcast_voice_message",
                    args: "{ roomId, message }",
                    description: "Broadcast a voice message to all room members AFTER uploading via POST /api/chat/upload/voice. 'message' is the object returned by the REST endpoint.",
                },
                {
                    event: "load_more_messages",
                    args: "{ roomId, before (ISO timestamp) }",
                    description: "Load older messages before a given timestamp.",
                },
                {
                    event: "mark_read",
                    args: "{ roomId }",
                    description: "Mark all unread messages in a room as read.",
                },
                {
                    event: "typing",
                    args: "{ roomId }",
                    description: "Notify room that user is typing.",
                },
                {
                    event: "stop_typing",
                    args: "{ roomId }",
                    description: "Notify room that user stopped typing.",
                },
                {
                    event: "leave_room",
                    args: "{ roomId }",
                    description: "Leave a chat room.",
                },
                {
                    event: "create_room",
                    args: '{ participantId, name?, type? ("direct"|"group"), participantIds? (for group) }',
                    description: "Create a new room or get existing direct room.",
                },
                {
                    event: "get_api_list",
                    args: "none",
                    description: "Get this API event list.",
                },
            ];
            socket.emit("api_list", apiList);
        });

        // ─────────────────────────────────────────────────
        // Disconnect
        // ─────────────────────────────────────────────────
        socket.on("disconnect", async () => {
            console.log(`❌ User disconnected: ${username} (${userId})`);

            onlineUsers.delete(userId);

            // Update user status in DB
            await User.findByIdAndUpdate(userId, {
                status: "offline",
                lastSeen: new Date(),
            });

            // Broadcast updated online users list
            io.emit("online_users", Array.from(onlineUsers.entries()).map(([id, data]) => ({
                userId: id,
                ...data,
            })));
        });
    });
};
