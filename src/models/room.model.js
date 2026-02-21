const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: "",
        },

        // "direct" for 1-on-1, "group" for group chats
        type: {
            type: String,
            enum: ["direct", "group"],
            default: "direct",
        },

        // Array of user IDs who are part of this room
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // Last message preview for room listing
        lastMessage: {
            text: { type: String, default: "" },
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            timestamp: { type: Date, default: Date.now },
        },

        // Track who created the room
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Index for fast participant lookups
roomSchema.index({ participants: 1 });

module.exports = mongoose.model("Room", roomSchema);
