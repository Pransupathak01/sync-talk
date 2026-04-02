const mongoose = require("mongoose");

const ftAccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
        },

        accountHolderName: {
            type: String,
            required: true,
            trim: true,
        },

        bankName: {
            type: String,
            required: true,
        },

        accountNumber: {
            type: String,
            required: true,
        },

        ifscCode: {
            type: String,
            required: true,
            uppercase: true,
        },

        accountType: {
            type: String,
            enum: ["savings", "current", "salary"],
            default: "savings",
        },

        isPrimary: {
            type: Boolean,
            default: false,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        // Masked account number for display (last 4 digits)
        maskedAccount: {
            type: String,
            default: "",
        },
    },
    { timestamps: true, collection: "ft_accounts" }
);

// Ensure only one primary account per user
ftAccountSchema.index({ userId: 1, isPrimary: 1 });

module.exports = mongoose.model("FtAccount", ftAccountSchema);
