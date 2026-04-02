const FtLoan = require("../../models/fintech/ft_loan.model");

/**
 * @route  GET /api/ft/loans/emi-calculator
 * @access Private
 * Query: amount, tenure (months), interestRate
 */
exports.emiCalculator = (req, res) => {
    try {
        const { amount, tenure, interestRate } = req.query;

        if (!amount || !tenure || !interestRate) {
            return res.status(400).json({ success: false, message: "amount, tenure, and interestRate are required" });
        }

        const P = Number(amount);
        const r = Number(interestRate) / 12 / 100;
        const n = Number(tenure);

        if (P <= 0 || n <= 0 || Number(interestRate) < 0) {
            return res.status(400).json({ success: false, message: "Invalid loan parameters" });
        }

        let emi;
        if (r === 0) {
            emi = P / n;
        } else {
            emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }

        const totalRepayable = Math.round(emi * n);
        const totalInterest = Math.round(totalRepayable - P);
        emi = Math.round(emi);

        return res.status(200).json({
            success: true,
            result: {
                principal: P,
                tenure: n,
                interestRate: Number(interestRate),
                emi,
                totalRepayable,
                totalInterest,
            },
        });
    } catch (err) {
        console.error("[FT Loan] EMI Calculator error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/loans/apply
 * @access Private
 */
exports.applyForLoan = async (req, res) => {
    try {
        const { loanType, amount, tenure, interestRate, purpose, disbursementAccountId } = req.body;

        if (!loanType || !amount || !tenure || !interestRate) {
            return res.status(400).json({ success: false, message: "Loan type, amount, tenure, and interest rate are required" });
        }

        // Check for existing pending/active loan of same type
        const activeLoan = await FtLoan.findOne({
            userId: req.ftUser._id,
            loanType,
            status: { $in: ["applied", "under_review", "approved", "disbursed"] },
        });

        if (activeLoan) {
            return res.status(409).json({
                success: false,
                message: `You already have an active ${loanType} loan application`,
            });
        }

        const loan = await FtLoan.create({
            userId: req.ftUser._id,
            loanType,
            amount,
            tenure,
            interestRate,
            purpose,
            disbursementAccountId,
        });

        return res.status(201).json({
            success: true,
            message: "Loan application submitted successfully",
            loan,
        });
    } catch (err) {
        console.error("[FT Loan] ApplyLoan error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/loans
 * @access Private
 */
exports.getMyLoans = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { userId: req.ftUser._id };
        if (status) filter.status = status;

        const loans = await FtLoan.find(filter)
            .populate("disbursementAccountId", "bankName maskedAccount accountType")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, loans });
    } catch (err) {
        console.error("[FT Loan] GetMyLoans error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/loans/:id
 * @access Private
 */
exports.getLoanById = async (req, res) => {
    try {
        const loan = await FtLoan.findById(req.params.id).populate(
            "disbursementAccountId",
            "bankName maskedAccount accountType"
        );

        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });

        if (loan.userId.toString() !== req.ftUser._id.toString() && req.ftUser.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        return res.status(200).json({ success: true, loan });
    } catch (err) {
        console.error("[FT Loan] GetById error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/loans/admin/all (Admin only)
 * @access Admin
 */
exports.getAllLoans = async (req, res) => {
    try {
        const { status, loanType, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const filter = {};

        if (status) filter.status = status;
        if (loanType) filter.loanType = loanType;

        const [loans, total] = await Promise.all([
            FtLoan.find(filter)
                .populate("userId", "fullName email phone")
                .populate("disbursementAccountId", "bankName maskedAccount")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            FtLoan.countDocuments(filter),
        ]);

        return res.status(200).json({ success: true, total, page: Number(page), loans });
    } catch (err) {
        console.error("[FT Loan] Admin GetAll error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/loans/admin/:id/status (Admin only)
 * @access Admin
 */
exports.updateLoanStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const validStatuses = ["under_review", "approved", "disbursed", "rejected", "closed"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid loan status" });
        }

        const loan = await FtLoan.findById(req.params.id);
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });

        loan.status = status;
        if (remarks) loan.remarks = remarks;
        if (status === "disbursed") loan.disbursedAt = new Date();
        if (status === "closed") loan.closedAt = new Date();

        await loan.save();

        return res.status(200).json({ success: true, message: `Loan status updated to ${status}`, loan });
    } catch (err) {
        console.error("[FT Loan] UpdateStatus error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
