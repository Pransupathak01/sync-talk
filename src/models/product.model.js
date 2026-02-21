const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        brand: {
            type: String,
            default: "",
        },
        imageUrl: {
            type: String,
            default: "",
        },
        images: [
            {
                type: String, // Array of image URLs
            },
        ],

        // ─── Pricing ───
        mrp: {
            type: Number,
            required: true, // Maximum Retail Price
        },
        price: {
            type: Number,
            required: true, // Selling price (after discount)
        },
        discount: {
            type: Number,
            default: 0, // Discount percentage e.g. 20 means 20% off
        },

        // ─── Referral / Earnings ───
        referralCommission: {
            type: Number,
            default: 0, // Flat amount the referrer earns per sale e.g. ₹150
        },
        referralPercentage: {
            type: Number,
            default: 0, // OR percentage-based commission e.g. 10 means 10% of price
        },

        // ─── Inventory & Status ───
        stock: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true, // Whether product is available for referral
        },

        // ─── Metadata ───
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalOrders: {
            type: Number,
            default: 0, // How many times this product has been ordered
        },
    },
    {
        timestamps: true,
    }
);

// Virtual: calculated savings
productSchema.virtual("savings").get(function () {
    return this.mrp - this.price;
});

// Ensure virtuals are included in JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
