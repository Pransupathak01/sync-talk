const path = require("path");
const Message = require("../models/message.model");
const Room = require("../models/room.model");
const User = require("../models/user.model");

// ─────────────────────────────────────────────────
// GET /api/chat/rooms — Get all rooms for logged-in user
// ─────────────────────────────────────────────────
const getRooms = async (req, res) => {
    try {
        const userId = req.user._id;

        const rooms = await Room.find({ participants: userId })
            .populate("participants", "username avatar status lastSeen")
            .populate("lastMessage.sender", "username")
            .sort({ "lastMessage.timestamp": -1 })
            .lean();

        // Add unread count for each room
        const roomsWithUnread = await Promise.all(
            rooms.map(async (room) => {
                const unreadCount = await Message.countDocuments({
                    roomId: room._id,
                    sender: { $ne: userId },
                    readBy: { $nin: [userId] },
                });

                return {
                    ...room,
                    unreadCount,
                };
            })
        );

        res.json({
            success: true,
            rooms: roomsWithUnread,
        });
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ success: false, message: "Failed to fetch rooms" });
    }
};

// ─────────────────────────────────────────────────
// GET /api/chat/rooms/:roomId/messages — Get messages for a room
// ─────────────────────────────────────────────────
const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user._id;

        // Verify user is a participant
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        if (!room.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: "Not a participant" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find({ roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("sender", "username avatar")
            .lean();

        const totalMessages = await Message.countDocuments({ roomId });

        res.json({
            success: true,
            messages: messages.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalMessages,
                hasMore: skip + messages.length < totalMessages,
            },
        });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
};

// ─────────────────────────────────────────────────
// POST /api/chat/rooms — Create a new room (REST alternative)
// ─────────────────────────────────────────────────
const createRoom = async (req, res) => {
    try {
        const userId = req.user._id;
        const { participantId, participantIds, name, type = "direct" } = req.body;

        if (type === "direct") {
            if (!participantId) {
                return res.status(400).json({ success: false, message: "participantId is required" });
            }

            // Check if direct room already exists
            const existingRoom = await Room.findOne({
                type: "direct",
                participants: { $all: [userId, participantId], $size: 2 },
            }).populate("participants", "username avatar status");

            if (existingRoom) {
                return res.json({ success: true, room: existingRoom, isExisting: true });
            }

            const room = new Room({
                type: "direct",
                participants: [userId, participantId],
                createdBy: userId,
            });
            await room.save();

            const populatedRoom = await Room.findById(room._id)
                .populate("participants", "username avatar status");

            return res.status(201).json({ success: true, room: populatedRoom, isExisting: false });
        }

        // Group room
        if (!participantIds || participantIds.length === 0) {
            return res.status(400).json({ success: false, message: "participantIds are required for group chats" });
        }

        const room = new Room({
            name: name || "Group Chat",
            type: "group",
            participants: [userId, ...participantIds],
            createdBy: userId,
        });
        await room.save();

        const populatedRoom = await Room.findById(room._id)
            .populate("participants", "username avatar status");

        res.status(201).json({ success: true, room: populatedRoom, isExisting: false });
    } catch (err) {
        console.error("Error creating room:", err);
        res.status(500).json({ success: false, message: "Failed to create room" });
    }
};

// ─────────────────────────────────────────────────
// GET /api/chat/rooms/:roomId — Get room details
// ─────────────────────────────────────────────────
const getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await Room.findById(roomId)
            .populate("participants", "username avatar status lastSeen")
            .populate("lastMessage.sender", "username")
            .lean();

        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        if (!room.participants.some((p) => p._id.toString() === userId.toString())) {
            return res.status(403).json({ success: false, message: "Not a participant" });
        }

        res.json({ success: true, room });
    } catch (err) {
        console.error("Error fetching room details:", err);
        res.status(500).json({ success: false, message: "Failed to fetch room details" });
    }
};

// ─────────────────────────────────────────────────
// GET /api/chat/users — Get available users to chat with
// ─────────────────────────────────────────────────
const getChatUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const { search } = req.query;

        const query = { _id: { $ne: userId } };
        if (search) {
            query.username = { $regex: search, $options: "i" };
        }

        const users = await User.find(query)
            .select("username avatar status lastSeen")
            .limit(20)
            .lean();

        res.json({ success: true, users });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

// ─────────────────────────────────────────────────
// GET /api/chat/referral-contacts — Get referred people as chat contacts
// Auto-creates direct rooms for each referral
// ─────────────────────────────────────────────────
const getReferralContacts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get the current user's referral code
        const currentUser = await User.findById(userId).select("referralCode referredBy").lean();

        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find all users referred BY the current user (they used current user's referralCode)
        const referredUsers = await User.find({
            referredBy: currentUser.referralCode,
        })
            .select("username avatar status lastSeen email storeName role")
            .lean();

        // Also find the user who REFERRED the current user (the person whose code they used)
        let referrer = null;
        if (currentUser.referredBy) {
            referrer = await User.findOne({
                referralCode: currentUser.referredBy,
            })
                .select("username avatar status lastSeen email storeName role")
                .lean();
        }

        // Combine: referrer (if exists) + all referred people
        const allContacts = [];
        if (referrer) {
            allContacts.push({ ...referrer, relationship: "referrer" });
        }
        referredUsers.forEach((user) => {
            allContacts.push({ ...user, relationship: "referred" });
        });

        // For each contact, find or create a direct chat room
        const contactsWithRooms = await Promise.all(
            allContacts.map(async (contact) => {
                const contactId = contact._id;

                // Check if a direct room already exists
                let room = await Room.findOne({
                    type: "direct",
                    participants: { $all: [userId, contactId], $size: 2 },
                })
                    .populate("lastMessage.sender", "username")
                    .lean();

                // Auto-create room if it doesn't exist
                if (!room) {
                    const newRoom = new Room({
                        type: "direct",
                        participants: [userId, contactId],
                        createdBy: userId,
                    });
                    await newRoom.save();
                    room = newRoom.toObject();
                }

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    roomId: room._id,
                    sender: { $ne: userId },
                    readBy: { $nin: [userId] },
                });

                return {
                    user: contact,
                    room: {
                        _id: room._id,
                        lastMessage: room.lastMessage || null,
                        updatedAt: room.updatedAt,
                    },
                    unreadCount,
                };
            })
        );

        // Sort: unread messages first, then by last message time
        contactsWithRooms.sort((a, b) => {
            if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
            const timeA = a.room.lastMessage?.timestamp || a.room.updatedAt || 0;
            const timeB = b.room.lastMessage?.timestamp || b.room.updatedAt || 0;
            return new Date(timeB) - new Date(timeA);
        });

        res.json({
            success: true,
            referralCode: currentUser.referralCode,
            totalContacts: contactsWithRooms.length,
            contacts: contactsWithRooms,
        });
    } catch (err) {
        console.error("Error fetching referral contacts:", err);
        res.status(500).json({ success: false, message: "Failed to fetch referral contacts" });
    }
};

// ─────────────────────────────────────────────────
// POST /api/chat/upload/voice — Upload a voice message audio file
// Body: multipart/form-data  { audio: <file>, roomId: string, duration?: number }
// ─────────────────────────────────────────────────
const uploadVoiceMessage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No audio file uploaded" });
        }

        const { roomId, duration } = req.body;
        const userId = req.user._id;

        if (!roomId) {
            return res.status(400).json({ success: false, message: "roomId is required" });
        }

        // Verify room exists and user is a participant
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        if (!room.participants.map(String).includes(String(userId))) {
            return res.status(403).json({ success: false, message: "Not a participant of this room" });
        }

        // Build the public URL for the voice file
        // Files are served as /uploads/voice/<filename> via static middleware
        const voiceUrl = `/uploads/voice/${req.file.filename}`;
        const voiceDuration = duration ? parseFloat(duration) : null;

        // Save message to DB
        const newMessage = new Message({
            roomId,
            sender: userId,
            text: "",                   // no text for voice messages
            messageType: "voice",
            voiceUrl,
            voiceDuration,
            readBy: [userId],           // sender has already "heard" it
        });
        await newMessage.save();

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "username avatar")
            .lean();

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, {
            lastMessage: {
                text: "🎤 Voice message",
                sender: userId,
                timestamp: new Date(),
            },
        });

        return res.status(201).json({
            success: true,
            message: populatedMessage,
        });
    } catch (err) {
        console.error("Error uploading voice message:", err);
        res.status(500).json({ success: false, message: "Failed to upload voice message" });
    }
};

module.exports = {
    getRooms,
    getMessages,
    createRoom,
    getRoomDetails,
    getChatUsers,
    getReferralContacts,
    uploadVoiceMessage,
};
