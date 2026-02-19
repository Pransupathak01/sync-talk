require("dotenv").config();
const { connectDB } = require("./src/config/db");
const User = require("./src/models/user.model");
const mongoose = require("mongoose");

const createTestUser = async () => {
    try {
        await connectDB();

        const testUser = new User({
            username: "TestUser",
            email: "test@example.com",
            password: "password123", // In a real app, hash this!
            status: "online",
        });

        await testUser.save();
        console.log("Test User created successfully!");
        console.log(testUser);
    } catch (error) {
        console.error("Error creating user:", error.message);
    } finally {
        mongoose.disconnect();
    }
};

createTestUser();
