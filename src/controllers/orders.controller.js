const crypto = require("crypto");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");
const Address = require("../models/address.model");
const Coupon = require("../models/coupon.model");
const { validateReferralCode } = require("../utils/referral.util");
const { sendPushNotification, sendMulticastNotification } = require("../services/notification.service");

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
        const {
            addressId,
            couponCode,
            paymentMethod,
            referralCode,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // --- PAYMENT VERIFICATION ---
        if (paymentMethod !== "COD") {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    message: "Payment details (order_id, payment_id, signature) are required for online payments."
                });
            }

            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ success: false, message: "Invalid payment signature. Payment verification failed." });
            }
        }
        // ---------------------------

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
        let couponDiscountRate = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                if (coupon.type === "percentage") {
                    couponDiscountRate = coupon.discount / 100;
                } else {
                    // For fixed discount, we distribute it proportionally
                    couponDiscountRate = coupon.discount / cart.totalPrice;
                }
            }
        }

        // Dynamic Referral Discount
        let validatedReferralCode = "";
        let referralDiscountRate = 0;
        if (referralCode) {
            const isValid = await validateReferralCode(referralCode, req.user._id);

            if (isValid) {
                validatedReferralCode = referralCode;
                const totalPrice = cart.totalPrice;

                if (totalPrice < 1000) {
                    referralDiscountRate = 0.05; // 5%
                } else if (totalPrice < 2000) {
                    referralDiscountRate = 0.07; // 7%
                } else if (totalPrice < 5000) {
                    referralDiscountRate = 0.08; // 8%
                } else {
                    referralDiscountRate = 0.10; // 10%
                }
            } else {
                // Return error for wrong referral code
                return res.status(400).json({ success: false, message: "Invalid or self-referral code provided" });
            }
        }

        // 4. Create separate orders for each item
        const orderResults = [];

        for (const item of cart.items) {
            // Calculate proportional earnings and amount for this item
            const itemPrice = item.product.price * item.quantity;
            const itemCouponDiscount = itemPrice * couponDiscountRate;
            const itemReferralDiscount = itemPrice * referralDiscountRate;
            const finalItemAmount = Math.max(0, itemPrice - (itemCouponDiscount + itemReferralDiscount));

            // Assume earnings scale with price
            const itemEarningsShare = (itemPrice / cart.totalPrice) * cart.totalEarnings;

            // Generate Unique Order ID for each item
            const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
            const orderId = `ORD-${new Date().getFullYear()}-${randomStr}`;

            const newOrder = new Order({
                user: req.user._id,
                orderId,
                customerName: address.name,
                amount: finalItemAmount,
                earnings: itemEarningsShare,
                items: [`${item.product.name} (x${item.quantity})`],
                imageUrl: item.product.imageUrl,
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
                paymentStatus: paymentMethod === "COD" ? "Pending" : "Captured",
                razorpayOrderId: razorpay_order_id || "",
                razorpayPaymentId: razorpay_payment_id || "",
                couponCode: couponCode || "",
                referralCode: validatedReferralCode || "",
                couponDiscount: itemCouponDiscount,
                referralDiscount: itemReferralDiscount,
                estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                date: new Date()
            });

            await newOrder.save();
            orderResults.push({
                orderId: newOrder.orderId,
                status: newOrder.status,
                totalAmount: newOrder.amount,
                couponDiscount: newOrder.couponDiscount,
                referralDiscount: newOrder.referralDiscount,
                estimatedDelivery: newOrder.estimatedDelivery.toISOString()
            });
        }

        // 5. Clear Cart
        cart.items = [];
        cart.totalPrice = 0;
        cart.totalItems = 0;
        cart.totalEarnings = 0;
        await cart.save();

        // 6. Send Notifications
        try {
            // A. Notify the customer
            const orderCount = orderResults.length;
            await sendPushNotification(req.user._id, {
                title: "Order Placed Successfully! 🎉",
                body: orderCount > 1
                    ? `Your ${orderCount} items have been ordered and are being processed.`
                    : `Your order for ${orderResults[0].orderId} has been placed successfully.`,
                data: {
                    type: "ORDER_PLACED",
                    orderId: orderResults[0].orderId
                }
            });

            // B. Notify Virtual Dukandars in this area
            const pincode = address.zipCode;
            const dukandars = await User.find({
                "address.postalCode": pincode,
                role: "Virtual Dukandar",
                _id: { $ne: req.user._id } // Don't notify the user if they are also a dukandar
            }).select("_id");

            if (dukandars.length > 0) {
                const dukandarIds = dukandars.map(d => d._id);
                await sendMulticastNotification(dukandarIds, {
                    title: "New Area Order! 📦",
                    body: `A new order has been placed in pincode ${pincode}. Check your Area Orders tab.`,
                    data: {
                        type: "AREA_ORDER_RECEIVED",
                        pincode: pincode
                    }
                });
            }

            // C. Notify the Referrer (if applicable)
            if (validatedReferralCode) {
                const referrer = await User.findOne({ referralCode: validatedReferralCode });
                if (referrer) {
                    const totalEarningsFromOrder = cart.totalEarnings;
                    await sendPushNotification(referrer._id, {
                        title: "New Referral Earning! 💰",
                        body: `Someone just used your code to place an order! You've earned ₹${totalEarningsFromOrder.toFixed(2)} (pending).`,
                        data: {
                            type: "REFERRAL_EARNING",
                            amount: totalEarningsFromOrder.toString()
                        }
                    });
                }
            }
        } catch (notifyErr) {
            console.error("Delayed notification error:", notifyErr);
            // We don't want to fail the request just because notification failed
        }

        res.status(201).json({
            success: true,
            message: orderResults.length > 1 ? "Orders placed successfully" : "Order placed successfully",
            data: orderResults.length === 1 ? orderResults[0] : orderResults
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
        const summary = {
            total_orders: orders.length,
            total_earnings: orders.reduce((sum, order) => sum + (order.status !== 'Cancelled' ? order.earnings : 0), 0),
            total_referral_discount: orders.reduce((sum, order) => sum + (order.referralDiscount || 0), 0),
            total_coupon_discount: orders.reduce((sum, order) => sum + (order.couponDiscount || 0), 0)
        };

        // Map to format
        const formattedOrders = orders.map(order => ({
            id: order.orderId,
            customerName: order.customerName,
            status: order.status,
            date: order.date,
            amount: order.amount,
            earnings: order.earnings,
            items: order.items,
            imageUrl: order.imageUrl,
            referralDiscount: order.referralDiscount || 0,
            couponDiscount: order.couponDiscount || 0,
            referralCode: order.referralCode || ""
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

const validateCheckout = async (req, res) => {
    try {
        const { referralCode, couponCode } = req.body;

        // 1. Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        let discountRate = 0;
        let couponDiscount = 0;
        let referralDiscount = 0;

        // 2. Validate Coupon
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                if (coupon.type === "percentage") {
                    discountRate += coupon.discount / 100;
                    couponDiscount = (cart.totalPrice * coupon.discount) / 100;
                } else {
                    discountRate += coupon.discount / cart.totalPrice;
                    couponDiscount = coupon.discount;
                }
            } else {
                return res.status(400).json({ success: false, message: "Invalid coupon code" });
            }
        }

        // 3. Validate Referral
        if (referralCode) {
            const isValid = await validateReferralCode(referralCode, req.user._id);
            if (isValid) {
                const totalPrice = cart.totalPrice;
                let referralRate = 0;

                if (totalPrice < 1000) referralRate = 0.05;
                else if (totalPrice < 2000) referralRate = 0.07;
                else if (totalPrice < 5000) referralRate = 0.08;
                else referralRate = 0.10;

                discountRate += referralRate;
                referralDiscount = totalPrice * referralRate;
            } else {
                return res.status(400).json({ success: false, message: "Invalid or self-referral code" });
            }
        }

        const finalTotal = Math.max(0, cart.totalPrice - (couponDiscount + referralDiscount));

        res.json({
            success: true,
            data: {
                originalTotal: cart.totalPrice,
                couponDiscount,
                referralDiscount,
                totalDiscount: couponDiscount + referralDiscount,
                finalTotal,
                discountRate: discountRate * 100 // as percentage
            }
        });

    } catch (error) {
        console.error("Error validating checkout:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: "Request body is missing. Ensure Content-Type is application/json." });
        }
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and status are required" });
        }

        const validStatuses = ["Delivered", "Processing", "Shipped", "Cancelled", "Pending"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const order = await Order.findOne({ orderId }).populate("user", "_id fcmToken username");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Use findOneAndUpdate to bypass global validation if some existing fields are semi-corrupt or missing in DB
        await Order.findOneAndUpdate({ orderId }, { status }, { runValidators: false });

        // Update the local object for the notification logic
        order.status = status;

        // Notify the customer about the status change
        try {
            let title = "Order Update";
            let body = `Your order ${orderId} status has been updated to ${status}.`;

            if (status === "Shipped") {
                title = "Order Shipped! 🚚";
                body = `Great news! Your order ${orderId} is on its way.`;
            } else if (status === "Delivered") {
                title = "Order Delivered! ✅";
                body = `Your order ${orderId} has been successfully delivered. Enjoy!`;
            } else if (status === "Cancelled") {
                title = "Order Cancelled ❌";
                body = `Your order ${orderId} has been cancelled.`;
            }

            await sendPushNotification(order.user._id, {
                title,
                body,
                data: {
                    type: "ORDER_STATUS_UPDATE",
                    orderId,
                    status
                }
            });
        } catch (notifyErr) {
            console.error("Status update notification error:", notifyErr);
        }

        res.json({
            success: true,
            message: `Order ${orderId} updated to ${status}`,
            data: order
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getOrders, placeOrder, getAreaOrders, validateCheckout, updateOrderStatus };
