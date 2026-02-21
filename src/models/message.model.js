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

        text: {
            type: String,
            required: true,
            trim: true,
        },

        // Message type: text, image, file, system
        messageType: {
            type: String,
            enum: ["text", "image", "file", "system"],
            default: "text",
        },

        isRead: {
            type: Boolean,
            default: false,
        },

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
