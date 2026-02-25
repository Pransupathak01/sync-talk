const User = require("../models/user.model");

// @desc    Update FCM Token for a user
// @route   PUT /api/notifications/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: "FCM Token is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.fcmToken = fcmToken;
        await user.save();

        res.json({ success: true, message: "FCM Token updated successfully" });
    } catch (error) {
        console.error("Error updating FCM Token:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc    Send test notification (for debugging)
// @route   POST /api/notifications/test
// @access  Private
exports.sendTestNotification = async (req, res) => {
    const { sendPushNotification } = require("../services/notification.service");
    try {
        await sendPushNotification(req.user._id, {
            title: "Test Notification",
            body: "This is a test notification from SyncTalk Backend!"
        });
        res.json({ success: true, message: "Test notification triggered" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
