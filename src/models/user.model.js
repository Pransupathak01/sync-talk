const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        avatar: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["online", "offline"],
            default: "offline",
        },

        lastSeen: {
            type: Date,
            default: Date.now,
        },


        storeName: {
            type: String,
            default: function () { return this.username + "'s Store"; }
        },

        role: {
            type: String,
            default: "Virtual Dukandar"
        },

        referralCode: {
            type: String,
            unique: true
        },

        referredBy: {
            type: String,
            default: null
        },

        objEarnings: {
            total: { type: Number, default: 0 },
            pendingPayouts: { type: Number, default: 0 },
            activeOrders: { type: Number, default: 0 }
        },

        address: {
            fullName: { type: String, default: "" },
            phoneNumber: { type: String, default: "" },
            streetAddress: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            postalCode: { type: String, default: "" },
            country: { type: String, default: "India" },
        },
        fcmToken: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

// Hash password before saving
// Generate referral code before saving if not exists
userSchema.pre("save", async function (next) {
    if (!this.referralCode) {
        this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
