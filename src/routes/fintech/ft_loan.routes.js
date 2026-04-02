const express = require("express");
const router = express.Router();
const {
    emiCalculator,
    applyForLoan,
    getMyLoans,
    getLoanById,
    getAllLoans,
    updateLoanStatus,
} = require("../../controllers/fintech/ft_loan.controller");
const { ftProtect, ftAdminOnly } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET  /api/ft/loans/emi-calculator?amount=&tenure=&interestRate=
router.get("/emi-calculator", emiCalculator);

// POST /api/ft/loans/apply
router.post("/apply", applyForLoan);

// GET  /api/ft/loans
router.get("/", getMyLoans);

// GET  /api/ft/loans/:id
router.get("/:id", getLoanById);

// --- Admin Routes ---
// GET  /api/ft/loans/admin/all
router.get("/admin/all", ftAdminOnly, getAllLoans);

// PATCH /api/ft/loans/admin/:id/status
router.patch("/admin/:id/status", ftAdminOnly, updateLoanStatus);

module.exports = router;
