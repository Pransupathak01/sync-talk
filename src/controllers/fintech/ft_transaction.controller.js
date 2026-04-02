const mongoose = require("mongoose");
const FtTransaction = require("../../models/fintech/ft_transaction.model");
const FtWallet = require("../../models/fintech/ft_wallet.model");
const FtUser = require("../../models/fintech/ft_user.model");

const generateTxId = () =>
    "FT" + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * @route  POST /api/ft/transactions/send
 * @access Private
 * Transfer money from one wallet to another (requires PIN)
 */
exports.sendMoney = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { receiverPhone, amount, pin, note = "", category = "transfer" } = req.body;

        if (!receiverPhone || !amount || !pin) {
            return res.status(400).json({ success: false, message: "Receiver phone, amount, and PIN are required" });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
        }

        // Verify sender PIN
        const sender = await FtUser.findById(req.ftUser._id);
        if (!sender.pin) {
            return res.status(403).json({ success: false, message: "Please set a transaction PIN first" });
        }

        const isPinValid = await sender.matchPin(pin);
        if (!isPinValid) {
            return res.status(401).json({ success: false, message: "Incorrect transaction PIN" });
        }

        // Find receiver
        const receiver = await FtUser.findOne({ phone: receiverPhone }).session(session);
        if (!receiver) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Receiver not found" });
        }

        if (receiver._id.toString() === req.ftUser._id.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Cannot send money to yourself" });
        }

        // Check sender wallet balance
        const senderWallet = await FtWallet.findOne({ userId: req.ftUser._id }).session(session);
        if (!senderWallet || !senderWallet.isActive) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: "Sender wallet is inactive" });
        }

        if (senderWallet.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
        }

        const receiverWallet = await FtWallet.findOne({ userId: receiver._id }).session(session);
        if (!receiverWallet || !receiverWallet.isActive) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: "Receiver wallet is inactive" });
        }

        const transactionId = generateTxId();

        // Debit sender
        senderWallet.balance -= amount;
        senderWallet.totalDebited += amount;
        await senderWallet.save({ session });

        // Credit receiver
        receiverWallet.balance += amount;
        receiverWallet.totalCredited += amount;
        await receiverWallet.save({ session });

        // Create transaction record
        const transaction = await FtTransaction.create(
            [
                {
                    transactionId,
                    senderId: req.ftUser._id,
                    receiverId: receiver._id,
                    amount,
                    type: "transfer",
                    status: "success",
                    category,
                    note,
                    description: `Transfer to ${receiver.fullName}`,
                    completedAt: new Date(),
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: `₹${amount} sent to ${receiver.fullName}`,
            transaction: transaction[0],
            newBalance: senderWallet.balance,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("[FT Transaction] SendMoney error:", err);
        return res.status(500).json({ success: false, message: "Transaction failed" });
    } finally {
        session.endSession();
    }
};

/**
 * @route  GET /api/ft/transactions
 * @access Private
 * Get paginated transaction history for the logged-in user
 */
exports.getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, category, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = {
            $or: [{ senderId: req.ftUser._id }, { receiverId: req.ftUser._id }],
        };

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const [transactions, total] = await Promise.all([
            FtTransaction.find(filter)
                .populate("senderId", "fullName phone avatar")
                .populate("receiverId", "fullName phone avatar")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            FtTransaction.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            transactions,
        });
    } catch (err) {
        console.error("[FT Transaction] GetTransactions error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/transactions/:id
 * @access Private
 */
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await FtTransaction.findById(req.params.id)
            .populate("senderId", "fullName phone avatar")
            .populate("receiverId", "fullName phone avatar");

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Ensure the user is part of this transaction
        const userId = req.ftUser._id.toString();
        const isSender = transaction.senderId?._id?.toString() === userId;
        const isReceiver = transaction.receiverId?._id?.toString() === userId;

        if (!isSender && !isReceiver && req.ftUser.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        return res.status(200).json({ success: true, transaction });
    } catch (err) {
        console.error("[FT Transaction] GetById error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/transactions/summary/monthly
 * @access Private
 * Returns category-wise spend summary for the current month
 */
exports.getMonthlySummary = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const summary = await FtTransaction.aggregate([
            {
                $match: {
                    senderId: req.ftUser._id,
                    status: "success",
                    createdAt: { $gte: startOfMonth },
                },
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]);

        return res.status(200).json({ success: true, summary });
    } catch (err) {
        console.error("[FT Transaction] MonthlySummary error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
