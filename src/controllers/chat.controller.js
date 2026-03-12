const path = require("path");
const Message = require("../models/message.model");
const Room = require("../models/room.model");
const User = require("../models/user.model");

// io instance injected at app startup — used for REST-triggered socket broadcasts
let _io = null;
const setIo = (io) => { _io = io; };

// ─────────────────────────────────────────────────
// GET /api/chat/rooms — Get all rooms for logged-in user
// ─────────────────────────────────────────────────
const getRooms = async (req, res) => {
    try {
        const userId = req.user._id;

        const rooms = await Room.find({ participants: userId })
            .populate("participants", "username avatar status lastSeen")
            .populate("lastMessage.sender", "username avatar status")
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

        // Mark messages as delivered for the current user
        const messageIds = messages
            .filter(m => m.sender?._id.toString() !== userId.toString() && !m.deliveredBy?.some(id => id.toString() === userId.toString()))
            .map(m => m._id);

        if (messageIds.length > 0) {
            await Message.updateMany(
                { _id: { $in: messageIds } },
                {
                    $addToSet: { deliveredBy: userId },
                    $set: { status: "delivered" }
                }
            );
        }

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
            .populate("lastMessage.sender", "username avatar status")
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
                    .populate("lastMessage.sender", "username avatar status")
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

        // Cloudinary returns the full HTTPS URL in req.file.path
        // e.g. https://res.cloudinary.com/yourapp/video/upload/synctalk/voice/voice_xxx.m4a
        const voiceUrl = req.file.path;
        const voiceDuration = duration ? parseFloat(duration) : null;

        // Save message to DB
        const newMessage = new Message({
            roomId,
            sender: userId,
            text: "",                   // no text for voice messages
            messageType: "voice",
            voiceUrl,
            voiceDuration,
            status: "sent",
            readBy: [userId],           // sender has already "heard" it
            deliveredBy: [userId],
        });
        await newMessage.save();

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "username avatar status")
            .lean();

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, {
            lastMessage: {
                text: "🎤 Voice message",
                sender: userId,
                status: "sent",
                timestamp: new Date(),
            },
        });

        return res.status(201).json({
            success: true,
            message: populatedMessage,
        });
    } catch (err) {
        console.error("Error uploading voice message:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to upload voice message" });
    }
};

// ─────────────────────────────────────────────────
// DELETE /api/chat/messages/:messageId/delete-for-me
// Hides the message only for the requesting user
// ─────────────────────────────────────────────────
const deleteMessageForMe = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Verify the user is a participant of the room
        const room = await Room.findById(message.roomId);
        if (!room || !room.participants.map(String).includes(String(userId))) {
            return res.status(403).json({ success: false, message: "Not a participant of this room" });
        }

        // Add userId to deletedFor array (if not already there)
        await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: userId },
        });

        return res.json({
            success: true,
            message: "Message deleted for you",
            messageId,
            deleteType: "for_me",
        });
    } catch (err) {
        console.error("Error deleting message for me:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to delete message" });
    }
};

// ─────────────────────────────────────────────────
// DELETE /api/chat/messages/:messageId/delete-for-everyone
// Deletes the message for ALL participants in the room
// Only the original sender can do this (within 60 mins)
// ─────────────────────────────────────────────────
const deleteMessageForEveryone = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Only the original sender can delete for everyone
        if (String(message.sender) !== String(userId)) {
            return res.status(403).json({ success: false, message: "Only the sender can delete this message for everyone" });
        }

        // Time-limited: within 60 minutes of sending (WhatsApp-style)
        const minutesSinceSent = (Date.now() - new Date(message.createdAt).getTime()) / 1000 / 60;
        if (minutesSinceSent > 60) {
            return res.status(400).json({ success: false, message: "You can only delete messages within 60 minutes of sending" });
        }

        const roomId = message.roomId.toString();

        // Wipe content and flag as deleted for everyone
        await Message.findByIdAndUpdate(messageId, {
            $set: {
                isDeletedForEveryone: true,
                text: "",
                voiceUrl: null,
            },
        });

        // Real-time broadcast so all room members update their UI instantly
        if (_io) {
            _io.to(roomId).emit("message_deleted_for_everyone", { messageId, roomId });
        }

        console.log(`[REST] Message ${messageId} deleted for everyone in room ${roomId}`);

        return res.json({
            success: true,
            messageId,
            roomId,
            message: "Message deleted for everyone",
        });
    } catch (err) {
        console.error("Error in deleteMessageForEveryone:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to delete message for everyone" });
    }
};

module.exports = {
    setIo,
    getRooms,
    getMessages,
    createRoom,
    getRoomDetails,
    getChatUsers,
    getReferralContacts,
    uploadVoiceMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
};
