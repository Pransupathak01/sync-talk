const admin = require("firebase-admin");

// Note: In production, you should download your service account key from 
// Firebase Console -> Settings -> Service Accounts -> Generate new private key
// and save it as a JSON file or use environment variables.

const initializeFirebase = () => {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            console.log("Firebase Admin initialized successfully");
        } catch (error) {
            console.error("Firebase initialization error:", error);
        }
    }
    return admin;
};

module.exports = { initializeFirebase, admin };
