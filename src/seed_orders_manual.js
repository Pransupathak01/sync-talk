require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./models/order.model");

const seedOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB via " + process.env.MONGO_URI);

        const userId = "6996ad6021fcaead58568539";

        console.log("Seeding orders for User ID:", userId);

        const orders = [
            // TODAY (2 orders) - Feb 20, 2026
            {
                user: userId,
                orderId: `ORD-${Date.now()}-1`,
                customerName: "Pransu Pathak", // Self order maybe? or generic
                status: "Processing",
                date: new Date(),
                amount: 1500,
                earnings: 150,
                items: ["Wireless Mouse"],
                imageUrl: "https://randomuser.me/api/portraits/men/10.jpg"
            },
            {
                user: userId,
                orderId: `ORD-${Date.now()}-2`,
                customerName: "Rohan Das",
                status: "Delivered",
                date: new Date(new Date().setHours(new Date().getHours() - 2)), // 2 hours ago
                amount: 2500,
                earnings: 250,
                items: ["Mechanical Keyboard"],
                imageUrl: "https://randomuser.me/api/portraits/men/11.jpg"
            },

            // THIS WEEK (Not Today) - Monday Feb 16, 2026
            // 2026-02-20 is Friday. Week starts Sunday Feb 15.
            {
                user: userId,
                orderId: `ORD-${Date.now()}-3`,
                customerName: "Sneha Gupta",
                status: "Shipped",
                date: new Date("2026-02-16T10:00:00Z"),
                amount: 3200,
                earnings: 320,
                items: ["Noise Cancelling Headphones"],
                imageUrl: "https://randomuser.me/api/portraits/women/12.jpg"
            },
            {
                user: userId,
                orderId: `ORD-${Date.now()}-4`,
                customerName: "Vikram Singh",
                status: "Processing",
                date: new Date("2026-02-17T14:30:00Z"),
                amount: 900,
                earnings: 90,
                items: ["USB-C Cable Pack"],
                imageUrl: "https://randomuser.me/api/portraits/men/13.jpg"
            },

            // LAST WEEK (Feb 8 - Feb 14)
            {
                user: userId,
                orderId: `ORD-${Date.now()}-5`,
                customerName: "Anjali Verma",
                status: "Delivered",
                date: new Date("2026-02-10T09:00:00Z"),
                amount: 12000,
                earnings: 1200,
                items: ["27-inch Monitor"],
                imageUrl: "https://randomuser.me/api/portraits/women/14.jpg"
            },
            {
                user: userId,
                orderId: `ORD-${Date.now()}-6`,
                customerName: "Kunal Shah",
                status: "Cancelled",
                date: new Date("2026-02-12T16:20:00Z"),
                amount: 1200,
                earnings: 0,
                items: ["Gaming Mouse Pad"],
                imageUrl: "https://randomuser.me/api/portraits/men/15.jpg"
            },

            // THIS MONTH (But older than last week - Early Feb)
            {
                user: userId,
                orderId: `ORD-${Date.now()}-7`,
                customerName: "Pooja Reddy",
                status: "Delivered",
                date: new Date("2026-02-02T11:15:00Z"),
                amount: 4500,
                earnings: 450,
                items: ["HD Webcam"],
                imageUrl: "https://randomuser.me/api/portraits/women/16.jpg"
            },

            // LAST MONTH (Jan 2026)
            {
                user: userId,
                orderId: `ORD-${Date.now()}-8`,
                customerName: "Rahul Dravid",
                status: "Delivered",
                date: new Date("2026-01-15T10:00:00Z"),
                amount: 15000,
                earnings: 1500,
                items: ["Ergonomic Chair"],
                imageUrl: "https://randomuser.me/api/portraits/men/17.jpg"
            },
            {
                user: userId,
                orderId: `ORD-${Date.now()}-9`,
                customerName: "Sania Mirza",
                status: "Shipped",
                date: new Date("2026-01-28T14:00:00Z"),
                amount: 2100,
                earnings: 210,
                items: ["Podcast Microphone"],
                imageUrl: "https://randomuser.me/api/portraits/women/18.jpg"
            }
        ];

        await Order.insertMany(orders);
        console.log("Successfully seeded " + orders.length + " orders for user " + userId);
        process.exit();
    } catch (error) {
        console.error("Error seeding orders:", error);
        process.exit(1);
    }
};

seedOrders();
