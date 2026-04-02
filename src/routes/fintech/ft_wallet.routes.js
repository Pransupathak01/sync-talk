const express = require("express");
const router = express.Router();
const { getWallet, addMoney, getWalletStats } = require("../../controllers/fintech/ft_wallet.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET /api/ft/wallet
router.get("/", getWallet);

// POST /api/ft/wallet/add-money
router.post("/add-money", addMoney);

// GET /api/ft/wallet/stats
router.get("/stats", getWalletStats);

module.exports = router;
