const { admin } = require("../config/firebase");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/**
 * Save a notification record to the database for inbox display
 */
const saveNotificationToDB = async (userId, { title, body, data = {} }) => {
    try {
        const type = data.type || "GENERAL";
        await Notification.create({ user: userId, title, body, data, type });
    } catch (err) {
        console.error("Failed to save notification to DB:", err.message);
    }
};

/**
 * Sanitize data object to ensure all values are strings (FCM requirement)
 */
const sanitizeData = (data = {}) => {
    const sanitized = {};
    Object.keys(data).forEach(key => {
        sanitized[key] = String(data[key]);
    });
    return sanitized;
};

/**
 * Send a push notification to a specific user
 * @param {string} userId - ID of the user to receive the notification
 * @param {object} notification - { title, body, data }
 */
const sendPushNotification = async (userId, { title, body, data = {} }) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            console.log(`User ${userId} not found`);
            return;
        }

        // Always save to DB so the user can see it in their notification inbox
        await saveNotificationToDB(userId, { title, body, data });

        if (!user.fcmToken) {
            console.log(`User ${user.username} has no FCM token – saved to DB only`);
            return;
        }

        const sanitizedData = sanitizeData(data);

        const message = {
            notification: { title, body },
            data: sanitizedData,
            android: {
                priority: "high",
                notification: {
                    channelId: "sound_channel_final",
                    sound: "default",
                    priority: "high",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        contentAvailable: true,
                    },
                },
            },
            token: user.fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log("Notification sent to:", user.username, "| Msg ID:", response);
        return response;
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};

/**
 * Send a notification to multiple users
 * @param {Array<string>} userIds - array of user IDs
 * @param {object} notification - { title, body, data }
 */
const sendMulticastNotification = async (userIds, { title, body, data = {} }) => {
    try {
        const users = await User.find({ _id: { $in: userIds }, fcmToken: { $ne: "" } });
        const tokens = users.map(u => u.fcmToken);

        // Save to DB for all users regardless of FCM token
        await Promise.all(
            userIds.map(uid => saveNotificationToDB(uid, { title, body, data }))
        );

        if (tokens.length === 0) return;

        const sanitizedData = sanitizeData(data);

        const message = {
            notification: { title, body },
            data: sanitizedData,
            android: {
                priority: "high",
                notification: {
                    channelId: "sound_channel_final",
                    sound: "default",
                    priority: "high",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        contentAvailable: true,
                    },
                },
            },
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount}/${tokens.length} multicast messages sent`);
        return response;
    } catch (error) {
        console.error("Error sending multicast notification:", error);
    }
};

module.exports = { sendPushNotification, sendMulticastNotification };
