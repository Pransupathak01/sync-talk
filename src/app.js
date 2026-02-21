require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Message = require("./models/message.model");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const orderRoutes = require("./routes/orders.routes");
const productRoutes = require("./routes/products.routes");
const cartRoutes = require("./routes/cart.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.send("SyncTalk API Running");
});

// Temporary route to check messages in DB
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;
