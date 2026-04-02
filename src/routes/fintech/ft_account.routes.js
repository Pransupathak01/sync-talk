const express = require("express");
const router = express.Router();
const {
    getAccounts,
    addAccount,
    deleteAccount,
    setPrimaryAccount,
} = require("../../controllers/fintech/ft_account.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET  /api/ft/accounts
router.get("/", getAccounts);

// POST /api/ft/accounts
router.post("/", addAccount);

// DELETE /api/ft/accounts/:id
router.delete("/:id", deleteAccount);

// PATCH /api/ft/accounts/:id/set-primary
router.patch("/:id/set-primary", setPrimaryAccount);

module.exports = router;
