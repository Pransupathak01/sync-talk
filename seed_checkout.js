require("dotenv").config();
const mongoose = require("mongoose");
const Address = require("./src/models/address.model");
const Coupon = require("./src/models/coupon.model");
const User = require("./src/models/user.model");

const seedCheckoutData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/synctalk");

        console.log("Connected to MongoDB...");

        // Find a user to attach addresses to
        const user = await User.findOne();
        if (!user) {
            console.log("No user found. Please run create_user.js or seed other data first.");
            process.exit(1);
        }

        console.log(`Seeding data for user: ${user.username}`);

        // 1. Seed Addresses
        await Address.deleteMany({ user: user._id });
        const addresses = [
            {
                user: user._id,
                addressId: "addr_001",
                name: user.username,
                phone: "+91 9876543210",
                street: "123 Main St, Apartment 4B",
                city: "Mumbai",
                state: "Maharashtra",
                zipCode: "400001",
                type: "Home"
            },
            {
                user: user._id,
                addressId: "addr_002",
                name: user.username,
                phone: "+91 9876543210",
                street: "456 Business Park",
                city: "Noida",
                state: "Uttar Pradesh",
                zipCode: "201301",
                type: "Work"
            }
        ];
        await Address.insertMany(addresses);
        console.log("Addresses seeded!");

        // 2. Seed Coupons
        await Coupon.deleteMany({});
        const coupons = [
            {
                couponId: "cp_1",
                code: "WELCOME10",
                description: "Get 10% OFF on your first order",
                discount: 10,
                type: "percentage"
            },
            {
                couponId: "cp_2",
                code: "SAVE50",
                description: "Flat ₹50 OFF on orders above ₹500",
                discount: 50,
                type: "fixed",
                minOrder: 500
            }
        ];
        await Coupon.insertMany(coupons);
        console.log("Coupons seeded!");

        console.log("Checkout seeding completed successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding checkout data:", error);
        process.exit(1);
    }
};

seedCheckoutData();
