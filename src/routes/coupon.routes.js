const express = require("express");
const { getCoupons, createCoupon } = require("../controllers/coupon.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getCoupons);
router.post("/", protect, createCoupon);

module.exports = router;
