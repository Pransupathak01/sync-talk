const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
    getProducts,
    getProductById,
    getCategories,
} = require("../controllers/products.controller");

// GET /api/products/categories  — must be before /:id
router.get("/categories", protect, getCategories);

// GET /api/products
router.get("/", protect, getProducts);

// GET /api/products/:id
router.get("/:id", protect, getProductById);

module.exports = router;
