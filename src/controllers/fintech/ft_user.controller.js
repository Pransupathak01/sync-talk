const FtUser = require("../../models/fintech/ft_user.model");
const FtWallet = require("../../models/fintech/ft_wallet.model");
const bcrypt = require("bcryptjs");

/**
 * @route  GET /api/ft/users/profile
 * @access Private
 * @desc   Returns the current user profile including wallet balance and KYC status.
 */
exports.getProfile = async (req, res) => {
    try {
        const [user, wallet] = await Promise.all([
            FtUser.findById(req.ftUser._id).select("-password -pin"),
            FtWallet.findOne({ userId: req.ftUser._id }).select("balance currency isActive"),
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Return a unified object
        const profile = {
            ...user.toObject(),
            wallet: wallet || { balance: 0, currency: "INR", isActive: false },
        };

        return res.status(200).json({ success: true, user: profile });
    } catch (err) {
        console.error("[FT User] GetProfile error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/users/profile
 * @access Private
 * @desc   Updates allowed profile fields (fullName, dob, gender, avatar, address)
 */
exports.updateProfile = async (req, res) => {
    try {
        const user = await FtUser.findById(req.ftUser._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { fullName, dateOfBirth, gender, avatar, address } = req.body;

        // Basic Info Updates
        if (fullName) user.fullName = fullName;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;
        if (avatar !== undefined) user.avatar = avatar;

        // Granular Address Updates (don't overwrite the whole object if only one field sent)
        if (address && typeof address === "object") {
            const currentAddress = user.toObject().address || {};
            user.address = {
                line1: address.line1 !== undefined ? address.line1 : currentAddress.line1,
                line2: address.line2 !== undefined ? address.line2 : currentAddress.line2,
                city: address.city !== undefined ? address.city : currentAddress.city,
                state: address.state !== undefined ? address.state : currentAddress.state,
                pincode: address.pincode !== undefined ? address.pincode : currentAddress.pincode,
                country: address.country !== undefined ? address.country : currentAddress.country,
            };
        }

        await user.save({ validateBeforeSave: true });

        const updatedUser = await FtUser.findById(req.ftUser._id).select("-password -pin").lean();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (err) {
        console.error("[FT User] UpdateProfile error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/users/change-password
 * @access Private
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both passwords are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
        }

        const user = await FtUser.findById(req.ftUser._id);
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        console.error("[FT User] ChangePassword error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/users/set-pin
 * @access Private
 * Sets or changes the 4-digit transaction PIN
 */
exports.setPin = async (req, res) => {
    try {
        const { pin, password } = req.body;

        if (!pin || !password) {
            return res.status(400).json({ success: false, message: "PIN and password are required" });
        }

        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({ success: false, message: "PIN must be exactly 4 digits" });
        }

        const user = await FtUser.findById(req.ftUser._id);
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Password is incorrect" });
        }

        user.pin = pin; // will be hashed by pre-save hook
        await user.save();

        return res.status(200).json({ success: true, message: "Transaction PIN set successfully" });
    } catch (err) {
        console.error("[FT User] SetPin error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/users/fcm-token
 * @access Private
 */
exports.updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) return res.status(400).json({ success: false, message: "FCM token is required" });

        await FtUser.findByIdAndUpdate(req.ftUser._id, { fcmToken });
        return res.status(200).json({ success: true, message: "FCM token updated" });
    } catch (err) {
        console.error("[FT User] UpdateFcmToken error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/users (Admin only)
 * @access Admin
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "", kycStatus } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }
        if (kycStatus) filter.kycStatus = kycStatus;

        const [users, total] = await Promise.all([
            FtUser.find(filter).select("-password -pin").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
            FtUser.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            users,
        });
    } catch (err) {
        console.error("[FT User] GetAllUsers error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/users/:id/toggle-active (Admin only)
 * @access Admin
 */
exports.toggleUserActive = async (req, res) => {
    try {
        const user = await FtUser.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isActive = !user.isActive;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"}`,
            isActive: user.isActive,
        });
    } catch (err) {
        console.error("[FT User] ToggleUserActive error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
