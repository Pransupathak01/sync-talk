const User = require("../models/user.model");

/**
 * Validates a referral code
 * @param {string} code - The referral code to validate
 * @param {string} currentUserId - The ID of the user trying to use the code (to prevent self-referral)
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
const validateReferralCode = async (code, currentUserId) => {
    try {
        if (!code) return false;

        const referrer = await User.findOne({ referralCode: code });

        // Code is valid if:
        // 1. A user with this code exists sunmmary also sjhho reffral deduction details i f deducted]
        // 2. The referrer is NOT the same as the current user
        if (referrer && referrer._id.toString() !== currentUserId.toString()) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error validating referral code:", error);
        return false;
    }
};

module.exports = { validateReferralCode };
