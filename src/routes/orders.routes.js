const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getOrders, placeOrder, getAreaOrders } = require("../controllers/orders.controller");

router.get("/", protect, getOrders);
router.post("/", protect, placeOrder);
router.get("/area", protect, getAreaOrders);

module.exports = router;
