const Product = require("../models/product.model");

// @desc    Get all active products (for user to browse & refer)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const { category, search, sort, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Search by name or brand
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
            ];
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // default: newest first
        if (sort === "price_low") sortOption = { price: 1 };
        if (sort === "price_high") sortOption = { price: -1 };
        if (sort === "discount") sortOption = { discount: -1 };
        if (sort === "commission") sortOption = { referralCommission: -1 };
        if (sort === "popular") sortOption = { totalOrders: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Format response with referral info
        const formattedProducts = products.map((p) => ({
            id: p._id,
            name: p.name,
            description: p.description,
            category: p.category,
            brand: p.brand,
            imageUrl: p.imageUrl,
            images: p.images,
            mrp: p.mrp,
            price: p.price,
            discount: p.discount,
            savings: p.savings,
            referralCommission: p.referralCommission,
            referralPercentage: p.referralPercentage,
            // Show the user exactly how much they earn
            youEarn: p.referralCommission > 0
                ? p.referralCommission
                : Math.round((p.referralPercentage / 100) * p.price),
            stock: p.stock,
            rating: p.rating,
            totalOrders: p.totalOrders,
            isActive: p.isActive,
        }));

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasMore: skip + products.length < total,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const youEarn = product.referralCommission > 0
            ? product.referralCommission
            : Math.round((product.referralPercentage / 100) * product.price);

        res.json({
            success: true,
            data: {
                id: product._id,
                name: product.name,
                description: product.description,
                category: product.category,
                brand: product.brand,
                imageUrl: product.imageUrl,
                images: product.images,
                mrp: product.mrp,
                price: product.price,
                discount: product.discount,
                savings: product.savings,
                referralCommission: product.referralCommission,
                referralPercentage: product.referralPercentage,
                youEarn,
                stock: product.stock,
                rating: product.rating,
                totalOrders: product.totalOrders,
                isActive: product.isActive,
            },
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category", { isActive: true });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getProducts, getProductById, getCategories };
