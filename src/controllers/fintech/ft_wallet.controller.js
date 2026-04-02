const FtWallet = require("../../models/fintech/ft_wallet.model");
const FtTransaction = require("../../models/fintech/ft_transaction.model");

/**
 * @route  GET /api/ft/wallet
 * @access Private
 */
exports.getWallet = async (req, res) => {
    try {
        const wallet = await FtWallet.findOne({ userId: req.ftUser._id });
        if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

        return res.status(200).json({ success: true, wallet });
    } catch (err) {
        console.error("[FT Wallet] GetWallet error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/wallet/add-money
 * @access Private
 * Simulates adding money to wallet (e.g., after payment gateway success)
 */
exports.addMoney = async (req, res) => {
    try {
        const { amount, reference = "" } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const wallet = await FtWallet.findOne({ userId: req.ftUser._id });
        if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });
        if (!wallet.isActive) return res.status(403).json({ success: false, message: "Wallet is inactive" });

        // Generate unique transaction ID
        const transactionId = "FT" + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create transaction record
        const transaction = await FtTransaction.create({
            transactionId,
            receiverId: req.ftUser._id,
            amount,
            type: "deposit",
            status: "success",
            category: "transfer",
            description: "Wallet top-up",
            reference,
            completedAt: new Date(),
        });

        // Update wallet balance
        wallet.balance += amount;
        wallet.totalCredited += amount;
        await wallet.save();

        return res.status(200).json({
            success: true,
            message: `₹${amount} added to wallet`,
            balance: wallet.balance,
            transaction,
        });
    } catch (err) {
        console.error("[FT Wallet] AddMoney error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/wallet/stats
 * @access Private
 * Returns monthly stats for dashboard
 */
exports.getWalletStats = async (req, res) => {
    try {
        const wallet = await FtWallet.findOne({ userId: req.ftUser._id });
        if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

        // Get current month's stats
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthlyCredits, monthlyDebits, recentTxCount] = await Promise.all([
            FtTransaction.aggregate([
                {
                    $match: {
                        receiverId: req.ftUser._id,
                        status: "success",
                        createdAt: { $gte: startOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            FtTransaction.aggregate([
                {
                    $match: {
                        senderId: req.ftUser._id,
                        status: "success",
                        createdAt: { $gte: startOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            FtTransaction.countDocuments({
                $or: [{ senderId: req.ftUser._id }, { receiverId: req.ftUser._id }],
                createdAt: { $gte: startOfMonth },
            }),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                balance: wallet.balance,
                totalCredited: wallet.totalCredited,
                totalDebited: wallet.totalDebited,
                monthlyCredit: monthlyCredits[0]?.total || 0,
                monthlyDebit: monthlyDebits[0]?.total || 0,
                monthlyTransactions: recentTxCount,
                dailyLimit: wallet.dailyLimit,
                monthlyLimit: wallet.monthlyLimit,
            },
        });
    } catch (err) {
        console.error("[FT Wallet] GetStats error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
