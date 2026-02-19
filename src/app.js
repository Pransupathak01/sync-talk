require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Message = require("./models/message.model");
const authRoutes = require("./routes/auth.routes");

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

module.exports = app;
