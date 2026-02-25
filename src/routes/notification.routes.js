const express = require("express");
const { updateFCMToken, sendTestNotification } = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.put("/fcm-token", protect, updateFCMToken);
router.post("/test", protect, sendTestNotification);

module.exports = router;
