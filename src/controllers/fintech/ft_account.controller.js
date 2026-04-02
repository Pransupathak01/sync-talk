const FtAccount = require("../../models/fintech/ft_account.model");

/**
 * @route  GET /api/ft/accounts
 * @access Private
 */
exports.getAccounts = async (req, res) => {
    try {
        const accounts = await FtAccount.find({ userId: req.ftUser._id }).sort({ isPrimary: -1, createdAt: -1 });
        return res.status(200).json({ success: true, accounts });
    } catch (err) {
        console.error("[FT Account] GetAccounts error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/accounts
 * @access Private
 */
exports.addAccount = async (req, res) => {
    try {
        const { accountHolderName, bankName, accountNumber, ifscCode, accountType } = req.body;

        if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
            return res.status(400).json({ success: false, message: "All account fields are required" });
        }

        // Prevent duplicate account
        const exists = await FtAccount.findOne({ userId: req.ftUser._id, accountNumber });
        if (exists) {
            return res.status(409).json({ success: false, message: "This account is already linked" });
        }

        const count = await FtAccount.countDocuments({ userId: req.ftUser._id });

        const maskedAccount = "XXXX XXXX " + accountNumber.slice(-4);

        const account = await FtAccount.create({
            userId: req.ftUser._id,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
            accountType: accountType || "savings",
            isPrimary: count === 0,
            maskedAccount,
        });

        return res.status(201).json({ success: true, message: "Bank account added", account });
    } catch (err) {
        console.error("[FT Account] AddAccount error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  DELETE /api/ft/accounts/:id
 * @access Private
 */
exports.deleteAccount = async (req, res) => {
    try {
        const account = await FtAccount.findOneAndDelete({ _id: req.params.id, userId: req.ftUser._id });
        if (!account) return res.status(404).json({ success: false, message: "Account not found" });

        // Reassign primary if needed
        if (account.isPrimary) {
            const next = await FtAccount.findOne({ userId: req.ftUser._id });
            if (next) {
                next.isPrimary = true;
                await next.save();
            }
        }

        return res.status(200).json({ success: true, message: "Bank account removed" });
    } catch (err) {
        console.error("[FT Account] DeleteAccount error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/accounts/:id/set-primary
 * @access Private
 */
exports.setPrimaryAccount = async (req, res) => {
    try {
        const account = await FtAccount.findOne({ _id: req.params.id, userId: req.ftUser._id });
        if (!account) return res.status(404).json({ success: false, message: "Account not found" });

        await FtAccount.updateMany({ userId: req.ftUser._id }, { isPrimary: false });
        account.isPrimary = true;
        await account.save();

        return res.status(200).json({ success: true, message: "Primary account updated" });
    } catch (err) {
        console.error("[FT Account] SetPrimary error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
