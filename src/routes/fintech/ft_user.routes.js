const express = require("express");
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    setPin,
    updateFcmToken,
    getAllUsers,
    toggleUserActive,
} = require("../../controllers/fintech/ft_user.controller");
const { ftProtect, ftAdminOnly } = require("../../middleware/fintech/ft_auth.middleware");

// All routes are protected
router.use(ftProtect);

// GET /api/ft/users/profile
router.get("/profile", getProfile);

// PUT /api/ft/users/profile
router.put("/profile", updateProfile);

// PUT /api/ft/users/change-password
router.put("/change-password", changePassword);

// PUT /api/ft/users/set-pin
router.put("/set-pin", setPin);

// PUT /api/ft/users/fcm-token
router.put("/fcm-token", updateFcmToken);

// --- Admin Routes ---
// GET /api/ft/users (admin: list all users)
router.get("/", ftAdminOnly, getAllUsers);

// PATCH /api/ft/users/:id/toggle-active
router.patch("/:id/toggle-active", ftAdminOnly, toggleUserActive);

module.exports = router;
