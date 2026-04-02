const express = require("express");
const router = express.Router();
const {
    getKycStatus,
    submitKyc,
    getAllKycRequests,
    approveKyc,
    rejectKyc,
} = require("../../controllers/fintech/ft_kyc.controller");
const { ftProtect, ftAdminOnly } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET  /api/ft/kyc
router.get("/", getKycStatus);

// POST /api/ft/kyc/submit
router.post("/submit", submitKyc);

// --- Admin Routes ---
// GET  /api/ft/kyc/admin/all
router.get("/admin/all", ftAdminOnly, getAllKycRequests);

// PATCH /api/ft/kyc/admin/:userId/approve
router.patch("/admin/:userId/approve", ftAdminOnly, approveKyc);

// PATCH /api/ft/kyc/admin/:userId/reject
router.patch("/admin/:userId/reject", ftAdminOnly, rejectKyc);

module.exports = router;
