require("dotenv").config();
const path = require("path");
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
const addressRoutes = require("./routes/address.routes");
const couponRoutes = require("./routes/coupon.routes");
const notificationRoutes = require("./routes/notification.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files (voice messages, etc.) as static assets
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.get("/api/health", (req, res) => {
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
app.use("/api/addresses", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

// ─────────────────────────────────────────────────────
// FinTech App Routes  (completely separate from SyncTalk)
// All collections prefixed with ft_ in MongoDB
// ─────────────────────────────────────────────────────
const ftAuthRoutes         = require("./routes/fintech/ft_auth.routes");
const ftUserRoutes         = require("./routes/fintech/ft_user.routes");
const ftWalletRoutes       = require("./routes/fintech/ft_wallet.routes");
const ftTransactionRoutes  = require("./routes/fintech/ft_transaction.routes");
const ftBeneficiaryRoutes  = require("./routes/fintech/ft_beneficiary.routes");
const ftKycRoutes          = require("./routes/fintech/ft_kyc.routes");
const ftCardRoutes         = require("./routes/fintech/ft_card.routes");
const ftAccountRoutes      = require("./routes/fintech/ft_account.routes");
const ftLoanRoutes         = require("./routes/fintech/ft_loan.routes");
const ftDashboardRoutes    = require("./routes/fintech/ft_dashboard.routes");

app.use("/api/ft/auth",         ftAuthRoutes);
app.use("/api/ft/users",        ftUserRoutes);
app.use("/api/ft/wallet",       ftWalletRoutes);
app.use("/api/ft/transactions", ftTransactionRoutes);
app.use("/api/ft/beneficiaries",ftBeneficiaryRoutes);
app.use("/api/ft/kyc",          ftKycRoutes);
app.use("/api/ft/cards",        ftCardRoutes);
app.use("/api/ft/accounts",     ftAccountRoutes);
app.use("/api/ft/loans",        ftLoanRoutes);
app.use("/api/ft/dashboard",    ftDashboardRoutes);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Global error handler
app.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;
