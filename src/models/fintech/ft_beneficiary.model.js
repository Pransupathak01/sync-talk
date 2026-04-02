const mongoose = require("mongoose");

const ftBeneficiarySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        // Bank transfer details
        accountNumber: {
            type: String,
            default: "",
        },

        ifscCode: {
            type: String,
            default: "",
        },

        bankName: {
            type: String,
            default: "",
        },

        // UPI / wallet
        upiId: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        type: {
            type: String,
            enum: ["bank", "upi", "wallet"],
            required: true,
        },

        isFavorite: {
            type: Boolean,
            default: false,
        },

        // Avatar/icon for display
        avatar: {
            type: String,
            default: "",
        },
    },
    { timestamps: true, collection: "ft_beneficiaries" }
);

module.exports = mongoose.model("FtBeneficiary", ftBeneficiarySchema);
