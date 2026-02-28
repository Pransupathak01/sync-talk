const express = require("express");
const { getUsers, getMe, getUserById, updateAddress, updateBankDetails, getEarningsHistory, getBankDetails } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/profile", protect, getMe);
router.put("/address", protect, updateAddress);
router.put("/update-bank", protect, updateBankDetails);
router.get("/bank-details", protect, getBankDetails);
router.get("/earnings-history", protect, getEarningsHistory);
router.get("/:id", protect, getUserById);

module.exports = router;
