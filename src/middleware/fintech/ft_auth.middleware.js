const jwt = require("jsonwebtoken");
const FtUser = require("../../models/fintech/ft_user.model");

/**
 * Protects fintech routes — verifies JWT and attaches req.ftUser
 */
const ftProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.ftUser = await FtUser.findById(decoded.id).select("-password -pin");

            if (!req.ftUser) {
                return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
            }

            if (!req.ftUser.isActive) {
                return res.status(403).json({ success: false, message: "Account is deactivated" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
    } else {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
};

/**
 * Restricts access to admin-only fintech routes
 */
const ftAdminOnly = (req, res, next) => {
    if (req.ftUser && req.ftUser.role === "admin") {
        return next();
    }
    return res.status(403).json({ success: false, message: "Admin access only" });
};

module.exports = { ftProtect, ftAdminOnly };
