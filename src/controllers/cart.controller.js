const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

// ─────────────────────────────────────────
// GET  /api/cart  → Fetch the user's cart
// ─────────────────────────────────────────
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate(
            "items.product",
            "name brand imageUrl images mrp price discount referralCommission referralPercentage stock rating category"
        );

        // If no cart exists yet, return an empty one
        if (!cart) {
            return res.json({
                success: true,
                data: {
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    totalMrp: 0,
                    totalSavings: 0,
                    totalEarnings: 0,
                },
            });
        }

        // Filter out items whose product was deleted
        cart.items = cart.items.filter((item) => item.product !== null);
        await cart.save();

        // Format the response
        const formattedItems = cart.items.map((item) => {
            const p = item.product;
            const youEarn =
                p.referralCommission > 0
                    ? p.referralCommission
                    : Math.round((p.referralPercentage / 100) * p.price);

            return {
                _id: item._id,
                product: {
                    _id: p._id,
                    name: p.name,
                    brand: p.brand,
                    imageUrl: p.imageUrl,
                    images: p.images,
                    mrp: p.mrp,
                    price: p.price,
                    discount: p.discount,
                    stock: p.stock,
                    rating: p.rating,
                    category: p.category,
                    youEarn,
                },
                quantity: item.quantity,
                size: item.size,
                itemTotal: p.price * item.quantity,
                itemMrp: p.mrp * item.quantity,
                itemSavings: (p.mrp - p.price) * item.quantity,
                itemEarnings: youEarn * item.quantity,
            };
        });

        res.json({
            success: true,
            data: {
                items: formattedItems,
                totalItems: cart.totalItems,
                totalPrice: cart.totalPrice,
                totalMrp: cart.totalMrp,
                totalSavings: cart.totalSavings,
                totalEarnings: cart.totalEarnings,
            },
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─────────────────────────────────────────────────────────────
// POST  /api/cart/add  → Add product to cart (from product details)
//
// Body:
//   { productId, quantity?, size? }
// ─────────────────────────────────────────────────────────────
const addToCart = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required" });
        }

        // Verify product exists & is in stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (product.stock <= 0) {
            return res.status(400).json({ success: false, message: "Product is out of stock" });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Check if product already in cart (same size)
        const existingIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.size === (size || "")
        );

        const qty = quantity || 1;

        if (existingIndex > -1) {
            // Already in cart — increase quantity
            cart.items[existingIndex].quantity += qty;
        } else {
            // New item
            cart.items.push({
                product: productId,
                quantity: qty,
                size: size || "",
            });
        }

        await cart.save();

        // Re-fetch with populated products
        cart = await Cart.findOne({ user: req.user._id }).populate(
            "items.product",
            "name brand imageUrl images mrp price discount referralCommission referralPercentage stock rating category"
        );

        const addedItem = cart.items.find(
            (item) => item.product._id.toString() === productId
        );

        const p = addedItem.product;
        const youEarn =
            p.referralCommission > 0
                ? p.referralCommission
                : Math.round((p.referralPercentage / 100) * p.price);

        res.json({
            success: true,
            message: `${p.name} added to cart`,
            data: {
                addedItem: {
                    product: {
                        _id: p._id,
                        name: p.name,
                        brand: p.brand,
                        imageUrl: p.imageUrl,
                        price: p.price,
                        mrp: p.mrp,
                        discount: p.discount,
                        youEarn,
                    },
                    quantity: addedItem.quantity,
                    size: addedItem.size,
                },
                totalItems: cart.totalItems,
                totalPrice: cart.totalPrice,
            },
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ──────────────────────────────────────────────────────────
// POST  /api/cart/update  → Add, update quantity, change size, or remove
//
// Body:
//   { productId, action, quantity?, size? }
//
// Actions:
//   "add"       → Add product to cart (or increment if exists)
//   "increment" → Increase quantity by 1
//   "decrement" → Decrease quantity by 1 (removes if qty becomes 0)
//   "remove"    → Remove item from cart entirely
//   "set"       → Set exact quantity
//   "size"      → Change the size of an item
// ──────────────────────────────────────────────────────────
const updateCart = async (req, res) => {
    try {
        const { productId, action, quantity, size } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required" });
        }

        if (!action) {
            return res.status(400).json({ success: false, message: "action is required (add, increment, decrement, remove, set, size)" });
        }

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Find existing item in cart
        const existingIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.size === (size || "")
        );

        switch (action) {
            case "add": {
                if (existingIndex > -1) {
                    // Product with same size already in cart — increment
                    cart.items[existingIndex].quantity += quantity || 1;
                } else {
                    // Add new item
                    cart.items.push({
                        product: productId,
                        quantity: quantity || 1,
                        size: size || "",
                    });
                }
                break;
            }

            case "increment": {
                if (existingIndex > -1) {
                    cart.items[existingIndex].quantity += 1;
                } else {
                    // If not in cart, add it
                    cart.items.push({
                        product: productId,
                        quantity: 1,
                        size: size || "",
                    });
                }
                break;
            }

            case "decrement": {
                if (existingIndex > -1) {
                    cart.items[existingIndex].quantity -= 1;
                    if (cart.items[existingIndex].quantity <= 0) {
                        cart.items.splice(existingIndex, 1);
                    }
                }
                break;
            }

            case "remove": {
                if (existingIndex > -1) {
                    cart.items.splice(existingIndex, 1);
                } else {
                    // Try to remove by productId only (ignore size match)
                    const idx = cart.items.findIndex(
                        (item) => item.product.toString() === productId
                    );
                    if (idx > -1) cart.items.splice(idx, 1);
                }
                break;
            }

            case "set": {
                if (!quantity || quantity < 1) {
                    // If quantity is 0 or invalid, remove item
                    if (existingIndex > -1) cart.items.splice(existingIndex, 1);
                } else if (existingIndex > -1) {
                    cart.items[existingIndex].quantity = quantity;
                } else {
                    cart.items.push({
                        product: productId,
                        quantity,
                        size: size || "",
                    });
                }
                break;
            }

            case "size": {
                if (!size) {
                    return res.status(400).json({ success: false, message: "size is required for action 'size'" });
                }
                // Find item by productId regardless of current size
                const sizeIdx = cart.items.findIndex(
                    (item) => item.product.toString() === productId
                );
                if (sizeIdx > -1) {
                    cart.items[sizeIdx].size = size;
                }
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action. Use: add, increment, decrement, remove, set, size",
                });
        }

        await cart.save();

        // Re-fetch with populated products for the response
        cart = await Cart.findOne({ user: req.user._id }).populate(
            "items.product",
            "name brand imageUrl images mrp price discount referralCommission referralPercentage stock rating category"
        );

        // Build response
        const formattedItems = cart.items.map((item) => {
            const p = item.product;
            if (!p) return null;
            const youEarn =
                p.referralCommission > 0
                    ? p.referralCommission
                    : Math.round((p.referralPercentage / 100) * p.price);

            return {
                _id: item._id,
                product: {
                    _id: p._id,
                    name: p.name,
                    brand: p.brand,
                    imageUrl: p.imageUrl,
                    images: p.images,
                    mrp: p.mrp,
                    price: p.price,
                    discount: p.discount,
                    stock: p.stock,
                    rating: p.rating,
                    category: p.category,
                    youEarn,
                },
                quantity: item.quantity,
                size: item.size,
                itemTotal: p.price * item.quantity,
                itemMrp: p.mrp * item.quantity,
                itemSavings: (p.mrp - p.price) * item.quantity,
                itemEarnings: youEarn * item.quantity,
            };
        }).filter(Boolean);

        res.json({
            success: true,
            message: `Cart updated (${action})`,
            data: {
                items: formattedItems,
                totalItems: cart.totalItems,
                totalPrice: cart.totalPrice,
                totalMrp: cart.totalMrp,
                totalSavings: cart.totalSavings,
                totalEarnings: cart.totalEarnings,
            },
        });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─────────────────────────────────────────
// DELETE  /api/cart  → Clear entire cart
// ─────────────────────────────────────────
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: [] } }
        );

        res.json({
            success: true,
            message: "Cart cleared",
            data: {
                items: [],
                totalItems: 0,
                totalPrice: 0,
                totalMrp: 0,
                totalSavings: 0,
                totalEarnings: 0,
            },
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getCart, addToCart, updateCart, clearCart };
