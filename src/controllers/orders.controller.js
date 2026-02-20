const Order = require("../models/order.model");

const getOrders = async (req, res) => {
    try {
        const { filter } = req.query;
        const userId = req.user._id;

        // Date Handling
        const now = new Date(); // Use current server time
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        let dateQuery = {};

        if (filter) {
            const normalizedFilter = filter.replace(/ /g, '_');

            switch (normalizedFilter) {
                case 'today':
                    dateQuery = {
                        date: {
                            $gte: today,
                            $lt: new Date(today.getTime() + 86400000)
                        }
                    };
                    break;
                case 'this_week': {
                    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
                    const diff = today.getDate() - day; // Adjust to Sunday start
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(diff);
                    startOfWeek.setHours(0, 0, 0, 0);
                    dateQuery = { date: { $gte: startOfWeek } };
                    break;
                }
                case 'last_week': {
                    const day = today.getDay();
                    const diff = today.getDate() - day - 7;
                    const startOfLastWeek = new Date(today);
                    startOfLastWeek.setDate(diff);
                    startOfLastWeek.setHours(0, 0, 0, 0);

                    const endOfLastWeek = new Date(startOfLastWeek);
                    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);

                    dateQuery = {
                        date: {
                            $gte: startOfLastWeek,
                            $lt: endOfLastWeek
                        }
                    };
                    break;
                }
                case 'this_month': {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    dateQuery = { date: { $gte: startOfMonth } };
                    break;
                }
                case 'last_month': {
                    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    dateQuery = {
                        date: {
                            $gte: startOfLastMonth,
                            $lt: startOfThisMonth
                        }
                    };
                    break;
                }
            }
        }

        // Build Final Query
        const query = { user: userId, ...dateQuery };

        const orders = await Order.find(query).sort({ date: -1 });

        // Calculate Summary
        // Note: For summary, do we want stats on *filtered* or *all* orders? 
        // Typically stats reflect the current view (filtered), so we use the filtered list.
        const summary = {
            total_orders: orders.length,
            total_earnings: orders.reduce((sum, order) => sum + (order.status !== 'Cancelled' ? order.earnings : 0), 0)
        };

        // Map to format (virtual 'id' handles _id -> id mapping mostly, but let's be explicit if needed)
        const formattedOrders = orders.map(order => ({
            id: order.orderId,
            customerName: order.customerName,
            status: order.status,
            date: order.date,
            amount: order.amount,
            earnings: order.earnings,
            items: order.items,
            imageUrl: order.imageUrl
        }));

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                summary
            }
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getOrders };
