const mongoose = require("mongoose");

const ftKycSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
            unique: true,
        },

        // PAN Card
        panNumber: {
            type: String,
            default: "",
            uppercase: true,
        },

        panDocUrl: {
            type: String,
            default: "",
        },

        // Aadhaar Card
        aadhaarNumber: {
            type: String,
            default: "",
        },

        aadhaarFrontUrl: {
            type: String,
            default: "",
        },

        aadhaarBackUrl: {
            type: String,
            default: "",
        },

        // Selfie
        selfieUrl: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["not_submitted", "pending", "approved", "rejected"],
            default: "not_submitted",
        },

        rejectionReason: {
            type: String,
            default: "",
        },

        verifiedAt: {
            type: Date,
            default: null,
        },

        // Admin who verified
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            default: null,
        },
    },
    { timestamps: true, collection: "ft_kyc" }
);

module.exports = mongoose.model("FtKyc", ftKycSchema);
