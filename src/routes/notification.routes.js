const express = require("express");
const {
    updateFCMToken,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
} = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// FCM Token
router.put("/fcm-token", protect, updateFCMToken);

// Notification Inbox
router.get("/", protect, getNotifications);              // GET all notifications (paginated)
router.put("/read-all", protect, markAllAsRead);         // Mark ALL as read
router.put("/:id/read", protect, markAsRead);            // Mark single as read
router.delete("/:id", protect, deleteNotification);      // Delete single

// Debug / Test
router.post("/test", protect, sendTestNotification);

module.exports = router;
