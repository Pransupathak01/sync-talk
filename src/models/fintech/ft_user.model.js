const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ftUserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 60,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        // 4-digit transaction PIN (hashed)
        pin: {
            type: String,
            default: null,
        },

        avatar: {
            type: String,
            default: "",
        },

        dateOfBirth: {
            type: Date,
            default: null,
        },

        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_to_say"],
            default: "prefer_not_to_say",
        },

        kycStatus: {
            type: String,
            enum: ["not_submitted", "pending", "approved", "rejected"],
            default: "not_submitted",
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isPhoneVerified: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        fcmToken: {
            type: String,
            default: "",
        },

        address: {
            line1: { type: String, default: "" },
            line2: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" },
            country: { type: String, default: "India" },
        },

        lastLogin: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, collection: "ft_users" }
);

// Hash password and PIN before saving
ftUserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified("pin") && this.pin) {
        const salt = await bcrypt.genSalt(10);
        this.pin = await bcrypt.hash(this.pin, salt);
    }
    next();
});

ftUserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

ftUserSchema.methods.matchPin = async function (enteredPin) {
    if (!this.pin) return false;
    return await bcrypt.compare(enteredPin, this.pin);
};

module.exports = mongoose.model("FtUser", ftUserSchema);
