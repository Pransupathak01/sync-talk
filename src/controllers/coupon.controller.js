const Coupon = require("../models/coupon.model");

// @desc    Get all available coupons
// @route   GET /api/coupons
// @access  Private
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true });
        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Create a new coupon (for admin/seeding)
// @route   POST /api/coupons
// @access  Private (should be Admin)
exports.createCoupon = async (req, res) => {
    try {
        const { code, description, discount, type, minOrder } = req.body;

        const couponCount = await Coupon.countDocuments();
        const couponId = `cp_${couponCount + 1}`;

        const newCoupon = new Coupon({
            couponId,
            code,
            description,
            discount,
            type,
            minOrder: minOrder || 0
        });

        await newCoupon.save();

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            data: newCoupon
        });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
