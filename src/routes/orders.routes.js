const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getOrders } = require("../controllers/orders.controller");

router.get("/", protect, getOrders);

module.exports = router;
