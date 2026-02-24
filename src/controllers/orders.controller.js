const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");
const Address = require("../models/address.model");
const Coupon = require("../models/coupon.model");

// @desc    Get orders and cart summary for Virtual Dukandar's area (pincode)
// @route   GET /api/orders/area
// @access  Private
const getAreaOrders = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "Virtual Dukandar") {
            return res.status(403).json({ success: false, message: "Only Virtual Dukandars can access area data" });
        }

        const pincode = user.address?.postalCode;
        if (!pincode) {
            return res.status(400).json({ success: false, message: "Please set your pincode in profile first" });
        }

        // 1. Get all users in this pincode
        const usersInArea = await User.find({ "address.postalCode": pincode }).select("_id username");
        const userIds = usersInArea.map(u => u._id);

        // 2. Get orders shipped to this pincode OR placed by users in this pincode
        const areaOrders = await Order.find({
            $or: [
                { "shippingAddress.postalCode": pincode },
                { user: { $in: userIds } }
            ]
        }).sort({ date: -1 }).populate("user", "username email");

        // 3. Get active carts for users in this pincode
        // This gives the "Virtual Dukandar" an idea of what people are interested in
        const areaCarts = await Cart.find({ user: { $in: userIds } })
            .populate("user", "username")
            .populate("items.product", "name price mrp");

        res.json({
            success: true,
            data: {
                pincode,
                orders: areaOrders,
                carts: areaCarts.map(cart => ({
                    username: cart.user.username,
                    totalItems: cart.totalItems,
                    totalPrice: cart.totalPrice,
                    items: cart.items.map(item => ({
                        productName: item.product?.name,
                        quantity: item.quantity
                    }))
                }))
            }
        });

    } catch (error) {
        console.error("Error fetching area orders:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const placeOrder = async (req, res) => {
    try {
        const { addressId, couponCode, paymentMethod, referralCode } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // 1. Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // 2. Look up the address
        const address = await Address.findOne({ addressId, user: req.user._id });
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // 3. Handle Coupon (Optional)
        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                if (coupon.type === "percentage") {
                    discount = (cart.totalPrice * coupon.discount) / 100;
                } else {
                    discount = coupon.discount;
                }
            }
        }

        const finalAmount = Math.max(0, cart.totalPrice - discount);

        // 4. Generate Order ID
        // Format: ORD-2026-X8YZA (as requested)
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const orderId = `ORD-${new Date().getFullYear()}-${randomStr}`;

        // 5. Prepare items summary
        const itemNames = cart.items.map(item => `${item.product.name} (x${item.quantity})`);

        // 6. Create Order
        const newOrder = new Order({
            user: req.user._id,
            orderId,
            customerName: address.name,
            amount: finalAmount,
            earnings: cart.totalEarnings, // Assuming earnings logic remains same
            items: itemNames,
            imageUrl: cart.items[0].product.imageUrl,
            shippingAddress: {
                fullName: address.name,
                phoneNumber: address.phone,
                streetAddress: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.zipCode,
                country: "India"
            },
            status: "Pending",
            paymentMethod: paymentMethod || "UPI",
            couponCode: couponCode || "",
            referralCode: referralCode || "",
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            date: new Date()
        });

        await newOrder.save();

        // 7. Clear Cart
        cart.items = [];
        cart.totalPrice = 0;
        cart.totalItems = 0;
        cart.totalEarnings = 0;
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                orderId: newOrder.orderId,
                status: newOrder.status,
                totalAmount: newOrder.amount,
                estimatedDelivery: newOrder.estimatedDelivery.toISOString()
            }
        });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

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

        // 1. Get referred users
        const referredUsers = await User.find({ referredBy: req.user.referralCode }).select("_id");
        const referredUserIds = referredUsers.map(u => u._id);

        // Build Final Query: Orders from referred users OR orders explicitly tagged with user's referralCode
        const query = {
            ...dateQuery,
            $or: [
                { user: { $in: referredUserIds } },
                { referralCode: req.user.referralCode }
            ]
        };

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

module.exports = { getOrders, placeOrder, getAreaOrders };
