const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        orderId: {
            type: String, // e.g. "ORD-2026-001"
            required: true,
            unique: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Delivered", "Processing", "Shipped", "Cancelled", "Pending"],
            default: "Pending",
        },
        paymentMethod: {
            type: String,
            enum: ["UPI", "COD", "CARD"],
            default: "UPI",
        },
        paymentStatus: {
            type: String,
            enum: ["Captured", "Pending", "Failed"],
            default: "Pending",
        },
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
        couponCode: {
            type: String,
            default: "",
        },
        referralCode: {
            type: String,
            default: "",
        },
        couponDiscount: {
            type: Number,
            default: 0,
        },
        referralDiscount: {
            type: Number,
            default: 0,
        },
        estimatedDelivery: {
            type: Date,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        amount: {
            type: Number,
            required: true,
            default: 0.0,
        },
        earnings: {
            type: Number,
            required: true,
            default: 0.0,
        },
        items: [
            {
                type: String,
            },
        ],
        imageUrl: {
            type: String,
            default: "https://randomuser.me/api/portraits/lego/1.jpg",
        },
        shippingAddress: {
            fullName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            streetAddress: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for 'id' to match frontend expectation if needed, or just map in controller
orderSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = object.orderId;
    delete object.orderId;
    return object;
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
