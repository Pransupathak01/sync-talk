const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        roomId: { type: String, index: true },
        sender: String,
        receiver: String,
        text: String,
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
