const mongoose = require("mongoose");

const ftWalletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
            unique: true,
        },

        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        totalCredited: {
            type: Number,
            default: 0,
        },

        totalDebited: {
            type: Number,
            default: 0,
        },

        // Daily spend limit
        dailyLimit: {
            type: Number,
            default: 50000,
        },

        // Monthly spend limit
        monthlyLimit: {
            type: Number,
            default: 200000,
        },
    },
    { timestamps: true, collection: "ft_wallets" }
);

module.exports = mongoose.model("FtWallet", ftWalletSchema);
