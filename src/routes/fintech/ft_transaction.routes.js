const express = require("express");
const router = express.Router();
const {
    sendMoney,
    getTransactions,
    getTransactionById,
    getMonthlySummary,
} = require("../../controllers/fintech/ft_transaction.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// POST /api/ft/transactions/send
router.post("/send", sendMoney);

// GET /api/ft/transactions/summary/monthly
router.get("/summary/monthly", getMonthlySummary);

// GET /api/ft/transactions
router.get("/", getTransactions);

// GET /api/ft/transactions/:id
router.get("/:id", getTransactionById);

module.exports = router;
