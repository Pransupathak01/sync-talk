const User = require("../models/user.model");
const Message = require("../models/message.model");
const Order = require("../models/order.model");

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        const user = req.user;
        const userId = user._id;

        // ─── 1. Compute Order Stats from DB ───
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart.getTime() + 86400000);

        // Total earnings from all delivered orders
        const earningsAgg = await Order.aggregate([
            { $match: { user: userId, status: { $in: ["Delivered", "Shipped", "Processing"] } } },
            { $group: { _id: null, totalEarnings: { $sum: "$earnings" } } }
        ]);
        const totalEarnings = earningsAgg.length > 0 ? earningsAgg[0].totalEarnings : 0;

        // Active orders (Processing + Shipped)
        const activeOrdersCount = await Order.countDocuments({
            user: userId,
            status: { $in: ["Processing", "Shipped"] }
        });

        // Orders placed today
        const todayOrdersCount = await Order.countDocuments({
            user: userId,
            date: { $gte: todayStart, $lt: todayEnd }
        });

        // Pending payouts = earnings from Delivered orders (not yet paid out)
        const pendingPayoutsAgg = await Order.aggregate([
            { $match: { user: userId, status: "Delivered" } },
            { $group: { _id: null, pendingAmount: { $sum: "$earnings" } } }
        ]);
        const pendingPayouts = pendingPayoutsAgg.length > 0 ? pendingPayoutsAgg[0].pendingAmount : 0;

        // Total orders count
        const totalOrdersCount = await Order.countDocuments({ user: userId });

        // ─── 2. Referral Stats ───
        const referralCount = await User.countDocuments({ referredBy: user.referralCode });

        // ─── 3. Unread Messages ───
        const unreadCount = await Message.countDocuments({
            $or: [
                { receiver: user._id, isRead: false },
                { receiver: user.username, isRead: false }
            ]
        });

        const responseData = {
            success: true,
            data: {
                user_profile: {
                    greeting_name: user.username,
                    store_name: user.storeName,
                    role: user.role,
                    profile_image: user.avatar,
                    referral_code: user.referralCode
                },
                earnings: {
                    total_earnings: totalEarnings,
                    currency: "₹",
                    can_withdraw: totalEarnings > 500
                },
                quick_stats: {
                    active_orders: {
                        count: activeOrdersCount,
                        trend_text: `+${todayOrdersCount} today`
                    },
                    total_orders: {
                        count: totalOrdersCount
                    },
                    referrals: {
                        total_count: referralCount,
                        pending_count: 0,
                        is_new: referralCount > 0
                    },
                    payouts: {
                        pending_amount: pendingPayouts
                    },
                    messages: {
                        unread_count: unreadCount,
                        subtext: "Customer queries"
                    }
                },
                banner: {
                    id: "promo_101",
                    title: "Boost Your Sales!",
                    message: "Share 5 more products to unlock Platinum Seller badge.",
                    icon: "trophy",
                    action_url: "/share/product"
                }
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
