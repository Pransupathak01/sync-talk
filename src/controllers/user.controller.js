const User = require("../models/user.model");

// @desc    Get all users (except current user)
// @route   GET /api/users
// @access  Public (for now, later make protected)
exports.getUsers = async (req, res) => {
    try {
        // Fetch all users, select only necessary fields
        // excluding password
        const users = await User.find({}, "-password").select(
            "username email avatar status lastSeen"
        );

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password").lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate referral count
        const referralCount = await User.countDocuments({ referredBy: user.referralCode });

        res.json({
            ...user,
            referralCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


