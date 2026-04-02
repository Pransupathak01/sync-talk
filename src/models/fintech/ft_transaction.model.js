const mongoose = require("mongoose");

const ftTransactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            default: null,
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            default: null,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        currency: {
            type: String,
            default: "INR",
        },

        type: {
            type: String,
            enum: ["credit", "debit", "transfer", "refund", "withdrawal", "deposit"],
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "success", "failed", "reversed"],
            default: "pending",
        },

        category: {
            type: String,
            enum: [
                "transfer",
                "bill_payment",
                "recharge",
                "shopping",
                "food",
                "transport",
                "entertainment",
                "loan_repayment",
                "other",
            ],
            default: "other",
        },

        description: {
            type: String,
            default: "",
        },

        note: {
            type: String,
            default: "",
        },

        // External payment reference (Razorpay, UPI, etc.)
        reference: {
            type: String,
            default: "",
        },

        // Extra data (gateway response, etc.)
        metadata: {
            type: Object,
            default: {},
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, collection: "ft_transactions" }
);

// Index for fast user-based queries
ftTransactionSchema.index({ senderId: 1, createdAt: -1 });
ftTransactionSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model("FtTransaction", ftTransactionSchema);
