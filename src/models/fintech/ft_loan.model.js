const mongoose = require("mongoose");

const ftLoanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtUser",
            required: true,
        },

        loanType: {
            type: String,
            enum: ["personal", "home", "business", "education", "vehicle"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1000,
        },

        // Tenure in months
        tenure: {
            type: Number,
            required: true,
            min: 1,
        },

        // Annual interest rate (%)
        interestRate: {
            type: Number,
            required: true,
        },

        // Monthly EMI (auto-calculated)
        emi: {
            type: Number,
            default: 0,
        },

        // Total repayment amount
        totalRepayable: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["applied", "under_review", "approved", "disbursed", "rejected", "closed"],
            default: "applied",
        },

        purpose: {
            type: String,
            default: "",
        },

        disbursedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
        },

        // Admin remarks / rejection reason
        remarks: {
            type: String,
            default: "",
        },

        // Linked bank account for disbursement
        disbursementAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FtAccount",
            default: null,
        },
    },
    { timestamps: true, collection: "ft_loans" }
);

// Auto-calculate EMI before saving
ftLoanSchema.pre("save", function (next) {
    if (this.isModified("amount") || this.isModified("tenure") || this.isModified("interestRate")) {
        const P = this.amount;
        const r = this.interestRate / 12 / 100;
        const n = this.tenure;
        if (r === 0) {
            this.emi = P / n;
        } else {
            this.emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
        }
        this.totalRepayable = Math.round(this.emi * n);
    }
    next();
});

module.exports = mongoose.model("FtLoan", ftLoanSchema);
