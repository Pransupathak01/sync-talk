const mongoose = require("mongoose");

const ftReconciliationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
        },
        // Internal Transaction Link (Optional, if it exists)
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtTransaction",
            default: null,
        },
        txTitle: {
            type: String,
            required: true,
        },
        txAmount: {
            type: Number,
            required: true,
        },
        txDate: {
            type: Date,
            required: true,
        },
        source: {
            type: String,
            required: true, // e.g., "ICICI Current A/c", "HDFC Statement #12"
        },
        bankAmount: {
            type: Number,
            required: true,
        },
        bankDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["matched", "unmatched", "disputed"],
            default: "unmatched",
        },
        mismatchReason: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, collection: "ft_reconciliations" }
);

// Index for performance
ftReconciliationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("FtReconciliation", ftReconciliationSchema);
