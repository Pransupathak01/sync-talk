const express = require("express");
const router = express.Router();
const {
    getBeneficiaries,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    toggleFavorite,
} = require("../../controllers/fintech/ft_beneficiary.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET  /api/ft/beneficiaries
router.get("/", getBeneficiaries);

// POST /api/ft/beneficiaries
router.post("/", addBeneficiary);

// PUT  /api/ft/beneficiaries/:id
router.put("/:id", updateBeneficiary);

// DELETE /api/ft/beneficiaries/:id
router.delete("/:id", deleteBeneficiary);

// PATCH /api/ft/beneficiaries/:id/favorite
router.patch("/:id/favorite", toggleFavorite);

module.exports = router;
