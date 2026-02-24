const Address = require("../models/address.model");

// @desc    Get all saved addresses for the user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id });
        res.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Save a new address
// @route   POST /api/addresses
// @access  Private
exports.saveAddress = async (req, res) => {
    try {
        const { name, phone, street, city, state, zipCode, type } = req.body;

        if (!name || !phone || !street || !city || !state || !zipCode) {
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }

        // Generate address ID
        const addressCount = await Address.countDocuments();
        const addressId = `addr_${(addressCount + 1).toString().padStart(3, '0')}`;

        const newAddress = new Address({
            user: req.user._id,
            addressId,
            name,
            phone,
            street,
            city,
            state,
            zipCode,
            type: type || "Home"
        });

        await newAddress.save();

        res.status(201).json({
            success: true,
            message: "Address saved successfully",
            data: newAddress
        });
    } catch (error) {
        console.error("Error saving address:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
