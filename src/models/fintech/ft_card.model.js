const mongoose = require("mongoose");

const ftCardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
        },

        // Tokenized / masked card number (never store raw)
        cardToken: {
            type: String,
            required: true,
        },

        cardHolderName: {
            type: String,
            required: true,
        },

        lastFourDigits: {
            type: String,
            required: true,
            length: 4,
        },

        expiryMonth: {
            type: String,
            required: true,
        },

        expiryYear: {
            type: String,
            required: true,
        },

        cardType: {
            type: String,
            enum: ["visa", "mastercard", "rupay", "amex"],
            required: true,
        },

        variant: {
            type: String,
            enum: ["debit", "credit", "prepaid"],
            required: true,
        },

        bankName: {
            type: String,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isDefault: {
            type: Boolean,
            default: false,
        },

        // Card UI color for display
        color: {
            type: String,
            default: "#6C63FF",
        },
    },
    { timestamps: true, collection: "ft_cards" }
);

module.exports = mongoose.model("FtCard", ftCardSchema);
