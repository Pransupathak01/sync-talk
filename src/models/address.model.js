const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        addressId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        zipCode: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["Home", "Work", "Other"],
            default: "Home",
        },
    },
    { timestamps: true }
);

// Virtual for 'id' to match frontend expectation
addressSchema.method("toJSON", function () {
    const { __v, _id, addressId, ...object } = this.toObject();
    object.id = addressId;
    return object;
});

module.exports = mongoose.model("Address", addressSchema);
