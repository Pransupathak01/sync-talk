const User = require("../models/user.model");
const Message = require("../models/message.model");

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        const user = req.user;

        // 1. Get Referral Stats
        const referralCount = await User.countDocuments({ referredBy: user.referralCode });

        // 2. Get Unread Messages (assuming receiver is saved as user._id or username)
        // Check for both ID and Username to be safe
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
                    total_earnings: user.objEarnings ? user.objEarnings.total : 0,
                    currency: "₹",
                    can_withdraw: (user.objEarnings?.total || 0) > 500 // Example logic
                },
                quick_stats: {
                    active_orders: {
                        count: user.objEarnings ? user.objEarnings.activeOrders : 0,
                        trend_text: "+0 today" // Placeholder as we don't track daily order history yet
                    },
                    referrals: {
                        total_count: referralCount,
                        pending_count: 0,
                        is_new: referralCount > 0
                    },
                    payouts: {
                        pending_amount: user.objEarnings ? user.objEarnings.pendingPayouts : 0
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
