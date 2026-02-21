const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        size: {
            type: String,
            default: "",  // e.g. "S", "M", "L", "XL", "6", "7", "8" etc.
        },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,  // One cart per user
        },
        items: [cartItemSchema],
    },
    {
        timestamps: true,
    }
);

// Virtual: total number of items in cart
cartSchema.virtual("totalItems").get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual: total cart value (needs populated products)
cartSchema.virtual("totalPrice").get(function () {
    return this.items.reduce((sum, item) => {
        const price = item.product?.price || 0;
        return sum + price * item.quantity;
    }, 0);
});

// Virtual: total MRP value
cartSchema.virtual("totalMrp").get(function () {
    return this.items.reduce((sum, item) => {
        const mrp = item.product?.mrp || 0;
        return sum + mrp * item.quantity;
    }, 0);
});

// Virtual: total savings
cartSchema.virtual("totalSavings").get(function () {
    return this.totalMrp - this.totalPrice;
});

// Virtual: total referral earnings
cartSchema.virtual("totalEarnings").get(function () {
    return this.items.reduce((sum, item) => {
        if (!item.product) return sum;
        const p = item.product;
        const earn =
            p.referralCommission > 0
                ? p.referralCommission
                : Math.round((p.referralPercentage / 100) * p.price);
        return sum + earn * item.quantity;
    }, 0);
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
