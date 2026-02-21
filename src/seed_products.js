require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

// All images from cdn.dummyjson.com – 100% reliable CDN
const IMG = "https://cdn.dummyjson.com/product-images";

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const products = [
            // ═══════════════════════════════════
            // ─── ELECTRONICS (8) ───
            // ═══════════════════════════════════
            {
                name: "boAt Airdopes 141",
                description: "Wireless earbuds with 42H playtime, ENx tech, IWP, IPX4 water resistance, Bluetooth v5.1",
                category: "Electronics",
                brand: "boAt",
                imageUrl: `${IMG}/mobile-accessories/apple-airpods/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-airpods/1.webp`,
                    `${IMG}/mobile-accessories/apple-airpods/2.webp`,
                    `${IMG}/mobile-accessories/apple-airpods/3.webp`,
                ],
                mrp: 4490, price: 1299, discount: 71,
                referralCommission: 150, referralPercentage: 0,
                stock: 250, rating: 4.1, totalOrders: 12500,
            },
            {
                name: "Noise Buds VS104",
                description: "Truly wireless earbuds with 45H playtime, Hyper Sync technology, Instacharge",
                category: "Electronics",
                brand: "Noise",
                imageUrl: `${IMG}/mobile-accessories/beats-flex-wireless-earphones/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/beats-flex-wireless-earphones/1.webp`,
                    `${IMG}/mobile-accessories/apple-airpods-max-silver/1.webp`,
                    `${IMG}/mobile-accessories/amazon-echo-plus/1.webp`,
                ],
                mrp: 2499, price: 899, discount: 64,
                referralCommission: 100, referralPercentage: 0,
                stock: 180, rating: 3.9, totalOrders: 8700,
            },
            {
                name: "Fire-Boltt Phoenix Smart Watch",
                description: "1.3\" display, SpO2, heart rate & sleep monitoring, IP68, Bluetooth calling",
                category: "Electronics",
                brand: "Fire-Boltt",
                imageUrl: `${IMG}/mobile-accessories/apple-watch-series-4-gold/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-watch-series-4-gold/1.webp`,
                    `${IMG}/mobile-accessories/apple-watch-series-4-gold/2.webp`,
                    `${IMG}/mobile-accessories/apple-watch-series-4-gold/3.webp`,
                ],
                mrp: 8999, price: 1999, discount: 78,
                referralCommission: 250, referralPercentage: 0,
                stock: 120, rating: 4.3, totalOrders: 5400,
            },
            {
                name: "OnePlus Nord Buds 2",
                description: "12.4mm titanium drivers, up to 36hr playtime, IP55 rating, 94ms low latency",
                category: "Electronics",
                brand: "OnePlus",
                imageUrl: `${IMG}/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp`,
                    `${IMG}/mobile-accessories/amazon-echo-plus/2.webp`,
                    `${IMG}/mobile-accessories/apple-airpods/1.webp`,
                ],
                mrp: 3299, price: 2299, discount: 30,
                referralCommission: 200, referralPercentage: 0,
                stock: 200, rating: 4.2, totalOrders: 6300,
            },
            {
                name: "JBL Flip 5 Bluetooth Speaker",
                description: "Portable waterproof speaker, 12H playtime, PartyBoost, IPX7 waterproof",
                category: "Electronics",
                brand: "JBL",
                imageUrl: `${IMG}/mobile-accessories/amazon-echo-plus/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/amazon-echo-plus/1.webp`,
                    `${IMG}/mobile-accessories/amazon-echo-plus/2.webp`,
                    `${IMG}/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp`,
                ],
                mrp: 12999, price: 8499, discount: 35,
                referralCommission: 500, referralPercentage: 0,
                stock: 90, rating: 4.6, totalOrders: 3200,
            },
            {
                name: "Redmi 10000mAh Power Bank",
                description: "10W fast charge, dual output, LED indicator, lithium polymer battery",
                category: "Electronics",
                brand: "Redmi",
                imageUrl: `${IMG}/mobile-accessories/apple-magsafe-battery-pack/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-magsafe-battery-pack/1.webp`,
                    `${IMG}/mobile-accessories/apple-magsafe-battery-pack/2.webp`,
                    `${IMG}/mobile-accessories/apple-airpower-wireless-charger/1.webp`,
                ],
                mrp: 1499, price: 899, discount: 40,
                referralCommission: 80, referralPercentage: 0,
                stock: 500, rating: 4.3, totalOrders: 18000,
            },
            {
                name: "Zebronics Zeb-Thunder Headphones",
                description: "Over-ear wireless headphones, 34hr battery, AUX, dual pairing",
                category: "Electronics",
                brand: "Zebronics",
                imageUrl: `${IMG}/mobile-accessories/apple-airpods-max-silver/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-airpods-max-silver/1.webp`,
                    `${IMG}/mobile-accessories/beats-flex-wireless-earphones/1.webp`,
                    `${IMG}/mobile-accessories/apple-airpods/2.webp`,
                ],
                mrp: 2999, price: 549, discount: 82,
                referralCommission: 60, referralPercentage: 0,
                stock: 320, rating: 3.8, totalOrders: 11000,
            },
            {
                name: "Logitech M221 Silent Mouse",
                description: "Wireless mouse with 90% noise reduction, 18-month battery, nano receiver",
                category: "Electronics",
                brand: "Logitech",
                imageUrl: `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`,
                images: [
                    `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`,
                    `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/2.webp`,
                    `${IMG}/laptops/apple-macbook-pro-14-inch-space-grey/3.webp`,
                ],
                mrp: 1095, price: 649, discount: 41,
                referralCommission: 70, referralPercentage: 0,
                stock: 400, rating: 4.4, totalOrders: 9800,
            },

            // ═══════════════════════════════════
            // ─── FASHION (6) ───
            // ═══════════════════════════════════
            {
                name: "Allen Solly Men's Polo T-Shirt",
                description: "Regular fit cotton polo, solid color, classic collar",
                category: "Fashion",
                brand: "Allen Solly",
                imageUrl: `${IMG}/mens-shirts/blue-&-black-check-shirt/1.webp`,
                images: [
                    `${IMG}/mens-shirts/blue-&-black-check-shirt/1.webp`,
                    `${IMG}/mens-shirts/blue-&-black-check-shirt/2.webp`,
                    `${IMG}/mens-shirts/blue-&-black-check-shirt/3.webp`,
                    `${IMG}/mens-shirts/blue-&-black-check-shirt/4.webp`,
                ],
                mrp: 1299, price: 649, discount: 50,
                referralCommission: 0, referralPercentage: 12,
                stock: 500, rating: 4.0, totalOrders: 3200,
            },
            {
                name: "Levi's Women's Skinny Fit Jeans",
                description: "Mid-rise skinny fit jeans, classic blue wash, stretch denim",
                category: "Fashion",
                brand: "Levi's",
                imageUrl: `${IMG}/mens-shirts/man-plaid-shirt/1.webp`,
                images: [
                    `${IMG}/mens-shirts/man-plaid-shirt/1.webp`,
                    `${IMG}/mens-shirts/man-plaid-shirt/2.webp`,
                    `${IMG}/mens-shirts/man-plaid-shirt/3.webp`,
                    `${IMG}/mens-shirts/man-plaid-shirt/4.webp`,
                ],
                mrp: 3299, price: 1649, discount: 50,
                referralCommission: 200, referralPercentage: 0,
                stock: 300, rating: 4.2, totalOrders: 2100,
            },
            {
                name: "US Polo Assn Men's Sneakers",
                description: "Lightweight casual sneakers, cushioned insole, lace-up closure",
                category: "Fashion",
                brand: "US Polo Assn",
                imageUrl: `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/1.webp`,
                images: [
                    `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/1.webp`,
                    `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/2.webp`,
                    `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/3.webp`,
                    `${IMG}/mens-shoes/nike-air-jordan-1-red-and-black/4.webp`,
                ],
                mrp: 3299, price: 1399, discount: 58,
                referralCommission: 180, referralPercentage: 0,
                stock: 200, rating: 4.0, totalOrders: 4500,
            },
            {
                name: "Fastrack Analog Men's Watch",
                description: "Casual analog watch with leather strap, water resistant, quartz movement",
                category: "Fashion",
                brand: "Fastrack",
                imageUrl: `${IMG}/mens-watches/brown-leather-belt-watch/1.webp`,
                images: [
                    `${IMG}/mens-watches/brown-leather-belt-watch/1.webp`,
                    `${IMG}/mens-watches/brown-leather-belt-watch/2.webp`,
                    `${IMG}/mens-watches/brown-leather-belt-watch/3.webp`,
                ],
                mrp: 2495, price: 1247, discount: 50,
                referralCommission: 130, referralPercentage: 0,
                stock: 150, rating: 4.1, totalOrders: 2800,
            },
            {
                name: "Lavie Women's Handbag",
                description: "Spacious tote handbag with zip closure, multiple compartments, faux leather",
                category: "Fashion",
                brand: "Lavie",
                imageUrl: `${IMG}/womens-bags/blue-women's-handbag/1.webp`,
                images: [
                    `${IMG}/womens-bags/blue-women's-handbag/1.webp`,
                    `${IMG}/womens-bags/blue-women's-handbag/2.webp`,
                    `${IMG}/womens-bags/blue-women's-handbag/3.webp`,
                ],
                mrp: 2800, price: 979, discount: 65,
                referralCommission: 120, referralPercentage: 0,
                stock: 180, rating: 3.9, totalOrders: 3400,
            },
            {
                name: "Wildcraft Unisex Backpack 30L",
                description: "Adventure backpack, rain cover included, padded shoulder straps, laptop compartment",
                category: "Fashion",
                brand: "Wildcraft",
                imageUrl: `${IMG}/womens-bags/prada-bucket-bag/1.webp`,
                images: [
                    `${IMG}/womens-bags/prada-bucket-bag/1.webp`,
                    `${IMG}/womens-bags/prada-bucket-bag/2.webp`,
                    `${IMG}/womens-bags/prada-bucket-bag/3.webp`,
                    `${IMG}/womens-bags/prada-bucket-bag/4.webp`,
                ],
                mrp: 2799, price: 1259, discount: 55,
                referralCommission: 140, referralPercentage: 0,
                stock: 220, rating: 4.3, totalOrders: 5100,
            },

            // ═══════════════════════════════════
            // ─── HOME & KITCHEN (5) ───
            // ═══════════════════════════════════
            {
                name: "Prestige Iris 750W Mixer Grinder",
                description: "3 stainless steel jars, 750W motor, 3-speed control with pulse",
                category: "Home & Kitchen",
                brand: "Prestige",
                imageUrl: `${IMG}/kitchen-accessories/boxed-blender/1.webp`,
                images: [
                    `${IMG}/kitchen-accessories/boxed-blender/1.webp`,
                    `${IMG}/kitchen-accessories/boxed-blender/2.webp`,
                    `${IMG}/kitchen-accessories/boxed-blender/3.webp`,
                    `${IMG}/kitchen-accessories/boxed-blender/4.webp`,
                ],
                mrp: 4295, price: 2599, discount: 39,
                referralCommission: 300, referralPercentage: 0,
                stock: 80, rating: 4.4, totalOrders: 1800,
            },
            {
                name: "Milton Thermosteel Flask 1L",
                description: "Double wall vacuum insulated, keeps hot 24hrs & cold 24hrs",
                category: "Home & Kitchen",
                brand: "Milton",
                imageUrl: `${IMG}/kitchen-accessories/black-aluminium-cup/1.webp`,
                images: [
                    `${IMG}/kitchen-accessories/black-aluminium-cup/1.webp`,
                    `${IMG}/kitchen-accessories/black-aluminium-cup/2.webp`,
                    `${IMG}/kitchen-accessories/glass/1.webp`,
                ],
                mrp: 1165, price: 599, discount: 49,
                referralCommission: 60, referralPercentage: 0,
                stock: 400, rating: 4.5, totalOrders: 9500,
            },
            {
                name: "Pigeon Favourite Induction Cooktop",
                description: "1800W induction cooktop with crystal glass, push button, auto-off",
                category: "Home & Kitchen",
                brand: "Pigeon",
                imageUrl: `${IMG}/kitchen-accessories/electric-stove/1.webp`,
                images: [
                    `${IMG}/kitchen-accessories/electric-stove/1.webp`,
                    `${IMG}/kitchen-accessories/electric-stove/2.webp`,
                    `${IMG}/kitchen-accessories/electric-stove/3.webp`,
                    `${IMG}/kitchen-accessories/electric-stove/4.webp`,
                ],
                mrp: 2495, price: 1399, discount: 44,
                referralCommission: 160, referralPercentage: 0,
                stock: 110, rating: 4.0, totalOrders: 6700,
            },
            {
                name: "Havells Instanio 3L Instant Water Heater",
                description: "3 litre capacity, LED indicator, ISI marked, anti-rust body",
                category: "Home & Kitchen",
                brand: "Havells",
                imageUrl: `${IMG}/kitchen-accessories/microwave-oven/1.webp`,
                images: [
                    `${IMG}/kitchen-accessories/microwave-oven/1.webp`,
                    `${IMG}/kitchen-accessories/microwave-oven/2.webp`,
                    `${IMG}/kitchen-accessories/microwave-oven/3.webp`,
                    `${IMG}/kitchen-accessories/microwave-oven/4.webp`,
                ],
                mrp: 5640, price: 3499, discount: 38,
                referralCommission: 350, referralPercentage: 0,
                stock: 65, rating: 4.2, totalOrders: 2300,
            },
            {
                name: "Borosil Glass Lunch Box Set",
                description: "Set of 4 borosilicate glass containers, microwave & oven safe, BPA-free lids",
                category: "Home & Kitchen",
                brand: "Borosil",
                imageUrl: `${IMG}/kitchen-accessories/lunch-box/1.webp`,
                images: [
                    `${IMG}/kitchen-accessories/lunch-box/1.webp`,
                    `${IMG}/kitchen-accessories/plate/1.webp`,
                    `${IMG}/kitchen-accessories/tray/1.webp`,
                ],
                mrp: 1749, price: 999, discount: 43,
                referralCommission: 100, referralPercentage: 0,
                stock: 260, rating: 4.4, totalOrders: 4200,
            },

            // ═══════════════════════════════════
            // ─── BEAUTY & PERSONAL CARE (5) ───
            // ═══════════════════════════════════
            {
                name: "Mamaearth Vitamin C Face Wash",
                description: "For skin illumination with turmeric, 150ml, toxin-free, all skin types",
                category: "Beauty",
                brand: "Mamaearth",
                imageUrl: `${IMG}/skin-care/attitude-super-leaves-hand-soap/1.webp`,
                images: [
                    `${IMG}/skin-care/attitude-super-leaves-hand-soap/1.webp`,
                    `${IMG}/skin-care/attitude-super-leaves-hand-soap/2.webp`,
                    `${IMG}/skin-care/attitude-super-leaves-hand-soap/3.webp`,
                ],
                mrp: 349, price: 262, discount: 25,
                referralCommission: 35, referralPercentage: 0,
                stock: 600, rating: 4.0, totalOrders: 15000,
            },
            {
                name: "Nivea Soft Moisturizing Cream 300ml",
                description: "Light cream with vitamin E & jojoba oil, non-greasy, face, hands & body",
                category: "Beauty",
                brand: "Nivea",
                imageUrl: `${IMG}/skin-care/vaseline-men-body-and-face-lotion/1.webp`,
                images: [
                    `${IMG}/skin-care/vaseline-men-body-and-face-lotion/1.webp`,
                    `${IMG}/skin-care/vaseline-men-body-and-face-lotion/2.webp`,
                    `${IMG}/skin-care/vaseline-men-body-and-face-lotion/3.webp`,
                ],
                mrp: 449, price: 299, discount: 33,
                referralCommission: 30, referralPercentage: 0,
                stock: 800, rating: 4.3, totalOrders: 22000,
            },
            {
                name: "Philips BT1233 Beard Trimmer",
                description: "Cordless rechargeable, USB charging, 20 lock-in length, skin-friendly blades",
                category: "Beauty",
                brand: "Philips",
                imageUrl: `${IMG}/skin-care/olay-ultra-moisture-shea-butter-body-wash/1.webp`,
                images: [
                    `${IMG}/skin-care/olay-ultra-moisture-shea-butter-body-wash/1.webp`,
                    `${IMG}/skin-care/olay-ultra-moisture-shea-butter-body-wash/2.webp`,
                    `${IMG}/skin-care/olay-ultra-moisture-shea-butter-body-wash/3.webp`,
                ],
                mrp: 1500, price: 899, discount: 40,
                referralCommission: 100, referralPercentage: 0,
                stock: 300, rating: 4.1, totalOrders: 7500,
            },
            {
                name: "WOW Apple Cider Vinegar Shampoo",
                description: "No parabens & sulphates, for hair growth, 300ml, built-in comb applicator",
                category: "Beauty",
                brand: "WOW",
                imageUrl: `${IMG}/beauty/powder-canister/1.webp`,
                images: [
                    `${IMG}/beauty/powder-canister/1.webp`,
                    `${IMG}/beauty/essence-mascara-lash-princess/1.webp`,
                    `${IMG}/beauty/eyeshadow-palette-with-mirror/1.webp`,
                ],
                mrp: 649, price: 399, discount: 39,
                referralCommission: 50, referralPercentage: 0,
                stock: 450, rating: 4.0, totalOrders: 13000,
            },
            {
                name: "Lakme Eyeconic Kajal Twin Pack",
                description: "24hr smudge-proof, deep black, waterproof, ophthalmologically tested",
                category: "Beauty",
                brand: "Lakme",
                imageUrl: `${IMG}/beauty/red-lipstick/1.webp`,
                images: [
                    `${IMG}/beauty/red-lipstick/1.webp`,
                    `${IMG}/beauty/red-nail-polish/1.webp`,
                    `${IMG}/beauty/essence-mascara-lash-princess/1.webp`,
                ],
                mrp: 495, price: 284, discount: 43,
                referralCommission: 30, referralPercentage: 0,
                stock: 700, rating: 4.2, totalOrders: 19000,
            },

            // ═══════════════════════════════════
            // ─── ACCESSORIES (4) ───
            // ═══════════════════════════════════
            {
                name: "Ambrane 10000mAh Power Bank",
                description: "20W fast charging, dual output USB-A & Type-C, compact design",
                category: "Accessories",
                brand: "Ambrane",
                imageUrl: `${IMG}/smartphones/iphone-5s/1.webp`,
                images: [
                    `${IMG}/smartphones/iphone-5s/1.webp`,
                    `${IMG}/smartphones/iphone-5s/2.webp`,
                    `${IMG}/smartphones/iphone-5s/3.webp`,
                ],
                mrp: 2499, price: 899, discount: 64,
                referralCommission: 100, referralPercentage: 0,
                stock: 350, rating: 4.1, totalOrders: 7200,
            },
            {
                name: "Portronics Adapto 62 Charger",
                description: "2.4A fast charging adapter with 1m USB cable, Android & iOS",
                category: "Accessories",
                brand: "Portronics",
                imageUrl: `${IMG}/mobile-accessories/apple-iphone-charger/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/apple-iphone-charger/1.webp`,
                    `${IMG}/mobile-accessories/apple-iphone-charger/2.webp`,
                    `${IMG}/mobile-accessories/apple-airpower-wireless-charger/1.webp`,
                ],
                mrp: 799, price: 349, discount: 56,
                referralCommission: 40, referralPercentage: 0,
                stock: 700, rating: 3.8, totalOrders: 4100,
            },
            {
                name: "Spigen Rugged Armor Phone Case",
                description: "Shock absorption TPU case, carbon fiber design, raised bezels",
                category: "Accessories",
                brand: "Spigen",
                imageUrl: `${IMG}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/1.webp`,
                images: [
                    `${IMG}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/1.webp`,
                    `${IMG}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/2.webp`,
                    `${IMG}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/3.webp`,
                    `${IMG}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/4.webp`,
                ],
                mrp: 1299, price: 699, discount: 46,
                referralCommission: 70, referralPercentage: 0,
                stock: 400, rating: 4.4, totalOrders: 5600,
            },
            {
                name: "Belkin 3-in-1 USB-C Hub",
                description: "USB-C to HDMI, USB-A 3.0, USB-C PD 100W pass-through, 4K display",
                category: "Accessories",
                brand: "Belkin",
                imageUrl: `${IMG}/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp`,
                images: [
                    `${IMG}/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp`,
                    `${IMG}/laptops/asus-zenbook-pro-dual-screen-laptop/2.webp`,
                    `${IMG}/laptops/asus-zenbook-pro-dual-screen-laptop/3.webp`,
                ],
                mrp: 3999, price: 2499, discount: 38,
                referralCommission: 280, referralPercentage: 0,
                stock: 100, rating: 4.5, totalOrders: 1900,
            },

            // ═══════════════════════════════════
            // ─── FITNESS & SPORTS (2) ───
            // ═══════════════════════════════════
            {
                name: "Boldfit Yoga Mat 6mm",
                description: "Anti-skid, extra thick, NBR material, carrying strap included, 72x24 inches",
                category: "Fitness",
                brand: "Boldfit",
                imageUrl: `${IMG}/sports-accessories/cricket-bat/1.webp`,
                images: [
                    `${IMG}/sports-accessories/cricket-bat/1.webp`,
                    `${IMG}/sports-accessories/cricket-bat/2.webp`,
                    `${IMG}/sports-accessories/cricket-bat/3.webp`,
                ],
                mrp: 1299, price: 399, discount: 69,
                referralCommission: 50, referralPercentage: 0,
                stock: 500, rating: 4.2, totalOrders: 8900,
            },
            {
                name: "Nivia Storm Football Size 5",
                description: "Machine stitched, 32 panels, PVC material, training & recreational play",
                category: "Fitness",
                brand: "Nivia",
                imageUrl: `${IMG}/sports-accessories/football/1.webp`,
                images: [
                    `${IMG}/sports-accessories/football/1.webp`,
                    `${IMG}/sports-accessories/football/2.webp`,
                    `${IMG}/sports-accessories/football/3.webp`,
                    `${IMG}/sports-accessories/football/4.webp`,
                ],
                mrp: 920, price: 399, discount: 57,
                referralCommission: 45, referralPercentage: 0,
                stock: 350, rating: 3.9, totalOrders: 4300,
            },
        ];

        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log(`✅ Successfully seeded ${products.length} products across ${new Set(products.map(p => p.category)).size} categories!`);
        console.log("All images use cdn.dummyjson.com – guaranteed to load!");
        process.exit();
    } catch (error) {
        console.error("Error seeding products:", error);
        process.exit(1);
    }
};

seedProducts();
