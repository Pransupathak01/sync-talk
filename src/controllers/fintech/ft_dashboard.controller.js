const FtTransaction = require("../../models/fintech/ft_transaction.model");

/** Format relative time label like "2 min ago" */
const getTimeLabel = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yr ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hr ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return "Just now";
};

/** Day-of-week labels */
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * @route  GET /api/ft/dashboard/summary
 * @access Private
 */
exports.getSummary = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        startOfWeek.setHours(0, 0, 0, 0);

        // Core Aggregations for KPIs and Chart
        const [todayStats, weeklyStats, pendingCount, chartAgg] = await Promise.all([
            // Today stats
            FtTransaction.aggregate([
                { $match: { createdAt: { $gte: new Date(startOfToday) } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                    },
                },
            ]),
            // Weekly stats
            FtTransaction.aggregate([
                { $match: { createdAt: { $gte: new Date(startOfWeek) } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                    },
                },
            ]),
            // Pending reconciliation
            FtTransaction.countDocuments({ status: "pending" }),
            // Chart Data (Last 7 days)
            FtTransaction.aggregate([
                { $match: { createdAt: { $gte: new Date(startOfWeek) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        total: { $sum: 1 },
                        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        // Core counts from database
        let tdTotal = todayStats[0]?.total || 0;
        let tdSuccess = todayStats[0]?.success || 0;
        let tdFailed = todayStats[0]?.failed || 0;
        let wkTotal = weeklyStats[0]?.total || 0;
        let pendCount = pendingCount || 0;

        // Fallback demo values if database is empty (to avoid zeros during development)
        if (tdTotal === 0) {
            tdTotal = 1284;
            tdSuccess = 1106;
            tdFailed = 178;
        }
        if (wkTotal === 0) {
            wkTotal = 8732;
        }
        if (pendCount === 0) {
            pendCount = 43;
        }

        // Process Chart Data
        const chartMap = {};
        chartAgg.forEach((d) => { chartMap[d._id] = d; });

        const chartData = [];
        const fallbackChartData = [980, 1240, 870, 1560, 1100, 700, 1284];
        const fallbackFailedData = [45, 92, 30, 110, 67, 22, 178];

        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            const iso = day.toISOString().split("T")[0];
            
            // Use real data if present, otherwise use fallback values (7th point is today)
            const realTotal = chartMap[iso]?.total || 0;
            const realFailed = chartMap[iso]?.failed || 0;

            chartData.push({
                x: DAY_LABELS[day.getDay()],
                y: realTotal > 0 ? realTotal : fallbackChartData[6 - i],
                failed: realTotal > 0 ? realFailed : fallbackFailedData[6 - i],
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                todayTotal: tdTotal,
                weeklyTotal: wkTotal,
                todaySuccess: tdSuccess,
                todayFailed: tdFailed,
                pendingReconciliation: pendCount,
                chartData,
            },
        });
    } catch (err) {
        console.error("[FT Dashboard] getSummary error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/dashboard/recent
 * @access Private
 */
exports.getRecentActivity = async (req, res) => {
    try {
        const transactions = await FtTransaction.find({
            $or: [{ senderId: req.ftUser._id }, { receiverId: req.ftUser._id }],
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        let data = transactions.map((tx) => {
            const isCredit = tx.receiverId?.toString() === req.ftUser._id.toString();
            return {
                _id: tx._id,
                title: tx.description || (isCredit ? "Internal Deposit" : "Internal Transfer"),
                amount: tx.amount,
                status: tx.status,
                type: isCredit ? "credit" : "debit",
                timeLabel: getTimeLabel(tx.createdAt),
                description: tx.note || tx.category || (isCredit ? "Bank Transfer" : "Payment Settlement"),
            };
        });

        // Fallback demo data if no real transactions exist
        if (data.length === 0) {
            data = [
                {
                    _id: "t1",
                    title: "Payment from Acme Corp",
                    amount: 24500,
                    status: "success",
                    type: "credit",
                    timeLabel: "2 min ago",
                    description: "Client deposit",
                },
                {
                    _id: "t2",
                    title: "Vendor payout - Suresh Traders",
                    amount: 8200,
                    status: "failed",
                    type: "debit",
                    timeLabel: "15 min ago",
                    description: "Vendor settlement failed",
                },
                {
                    _id: "t3",
                    title: "Salary disbursement",
                    amount: 142000,
                    status: "success",
                    type: "debit",
                    timeLabel: "1 hr ago",
                    description: "Payroll • 48 employees",
                },
                {
                    _id: "t4",
                    title: "Refund - Order #4821",
                    amount: 3750,
                    status: "pending",
                    type: "credit",
                    timeLabel: "2 hr ago",
                    description: "Customer refund",
                },
                {
                    _id: "t5",
                    title: "GST payment - Q1",
                    amount: 67400,
                    status: "success",
                    type: "debit",
                    timeLabel: "3 hr ago",
                    description: "Tax payment",
                },
                {
                    _id: "t6",
                    title: "Client deposit - TechVision",
                    amount: 95000,
                    status: "success",
                    type: "credit",
                    timeLabel: "5 hr ago",
                    description: "Client advance",
                },
            ];
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        console.error("[FT Dashboard] getRecentActivity error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
