const mongoose = require("mongoose");

exports.connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");

    // Reset all users to offline status on system startup
    try {
        const User = mongoose.model("User");
        await User.updateMany({}, { status: "offline" });
        console.log("All user statuses reset to offline");
    } catch (err) {
        console.error("Error resetting user statuses:", err);
    }
};
