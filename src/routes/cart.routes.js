const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getCart, addToCart, updateCart, clearCart } = require("../controllers/cart.controller");

// GET    /api/cart         → Get user's cart
router.get("/", protect, getCart);

// POST   /api/cart/add     → Add product to cart (from product details screen)
router.post("/add", protect, addToCart);

// POST   /api/cart/update  → Add/update/remove items (from cart screen)
router.post("/update", protect, updateCart);

// DELETE /api/cart         → Clear entire cart
router.delete("/", protect, clearCart);

module.exports = router;
