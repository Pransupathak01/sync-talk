const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        couponId: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        minOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Virtual for 'id' to match frontend expectation
couponSchema.method("toJSON", function () {
    const { __v, _id, couponId, ...object } = this.toObject();
    object.id = couponId;
    return object;
});

module.exports = mongoose.model("Coupon", couponSchema);
