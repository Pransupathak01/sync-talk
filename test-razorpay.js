require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testConnection() {
    try {
        console.log("Testing Razorpay connection...");
        console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
        // Try to fetch one order to verify keys
        const orders = await razorpay.orders.all({ count: 1 });
        console.log("Successfully connected to Razorpay!");
        console.log("Orders count:", orders.items.length);
    } catch (err) {
        console.error("Razorpay connection test failed:");
        console.error(err);
    }
}

testConnection();
