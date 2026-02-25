const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        data: {
            type: Map,
            of: String,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: [
                "ORDER_PLACED",
                "ORDER_STATUS_UPDATE",
                "AREA_ORDER_RECEIVED",
                "REFERRAL_EARNING",
                "TEST",
                "GENERAL",
            ],
            default: "GENERAL",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
