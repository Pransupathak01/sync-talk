const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getOrders, placeOrder, getAreaOrders, validateCheckout, updateOrderStatus } = require("../controllers/orders.controller");

router.get("/", protect, getOrders);
router.post("/", protect, placeOrder);
router.post("/validate-checkout", protect, validateCheckout);
router.get("/area", protect, getAreaOrders);
router.put("/update-status", protect, updateOrderStatus);

module.exports = router;
