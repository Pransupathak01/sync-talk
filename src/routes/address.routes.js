const express = require("express");
const { getAddresses, saveAddress } = require("../controllers/address.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getAddresses);
router.post("/", protect, saveAddress);

module.exports = router;
