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
