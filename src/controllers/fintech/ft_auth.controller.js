const jwt = require("jsonwebtoken");
const FtUser = require("../../models/fintech/ft_user.model");
const FtWallet = require("../../models/fintech/ft_wallet.model");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * @route  POST /api/ft/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existingEmail = await FtUser.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const existingPhone = await FtUser.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({ success: false, message: "Phone already registered" });
        }

        const user = await FtUser.create({ fullName, email, phone, password });

        // Auto-create wallet for user
        await FtWallet.create({ userId: user._id });

        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                kycStatus: user.kycStatus,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        console.error("[FT Auth] Register error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await FtUser.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                kycStatus: user.kycStatus,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                lastLogin: user.lastLogin,
            },
        });
    } catch (err) {
        console.error("[FT Auth] Login error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await FtUser.findById(req.ftUser._id).select("-password -pin");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error("[FT Auth] GetMe error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
