const { admin } = require("../config/firebase");
const User = require("../models/user.model");

/**
 * Send a push notification to a specific user
 * @param {string} userId - ID of the user to receive the notification
 * @param {object} notification - { title, body, data }
 */
const sendPushNotification = async (userId, { title, body, data = {} }) => {
    try {
        const user = await User.findById(userId);

        if (!user || !user.fcmToken) {
            console.log(`User ${userId} not found or has no FCM token`);
            return;
        }

        // Ensure all data values are strings (FCM requirement)
        const sanitizedData = {};
        Object.keys(data).forEach(key => {
            sanitizedData[key] = String(data[key]);
        });

        const message = {
            notification: {
                title,
                body,
            },
            data: sanitizedData,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'sound_channel_final', // Ensure this matches your frontend channel ID
                    sound: 'default',
                    priority: 'high',
                },
            },
            // For iOS
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                    },
                },
            },
            token: user.fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message to user:", user.username, "Response:", response);
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

        if (tokens.length === 0) return;

        // Ensure all data values are strings (FCM requirement)
        const sanitizedData = {};
        Object.keys(data).forEach(key => {
            sanitizedData[key] = String(data[key]);
        });

        const message = {
            notification: { title, body },
            data: sanitizedData,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'sound_channel_final', // Ensure this matches your frontend channel ID
                    sound: 'default',
                    priority: 'high',
                },
            },
            // For iOS
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        contentAvailable: true,
                    },
                },
            },
            tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} messages were sent successfully out of ${tokens.length}`);
        return response;
    } catch (error) {
        console.error("Error sending multicast notification:", error);
    }
};

module.exports = { sendPushNotification, sendMulticastNotification };
