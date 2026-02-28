const crypto = require("crypto");
const razorpay = require("../config/razorpay");

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
        amount: Math.round(Number(amount) * 100), // convert INR to paise and ensure it's an integer
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(201).json(order);
    } catch (err) {
        console.error("Razorpay Order Creation Error Detail:", err);
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.description || "Failed to create Razorpay order",
            error: err
        });
    }
};

/**
 * @desc    Verify Razorpay Payment Signature
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
const verifyPayment = (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        res.json({ status: "Payment Verified", success: true });
    } else {
        res.status(400).json({ status: "Invalid Signature", success: false });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
};
