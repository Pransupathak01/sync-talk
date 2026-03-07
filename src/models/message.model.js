const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Text content — optional for voice messages
        text: {
            type: String,
            trim: true,
            default: "",
        },

        // Message type: text, image, file, voice, system
        messageType: {
            type: String,
            enum: ["text", "image", "file", "voice", "system"],
            default: "text",
        },

        // ─── Voice Message Fields ───────────────────────
        // URL path to the stored audio file (e.g. /uploads/voice/filename.m4a)
        voiceUrl: {
            type: String,
            default: null,
        },

        // Duration of the voice note in seconds
        voiceDuration: {
            type: Number,
            default: null,
        },
        // ────────────────────────────────────────────────

        isRead: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },

        deliveredBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

// Compound index for efficient room message queries
messageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
