require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("=== USERS ===");
    const users = await mongoose.connection.db.collection("users")
        .find({})
        .project({ username: 1, referralCode: 1, referredBy: 1, email: 1 })
        .toArray();

    users.forEach((u) => {
        console.log(`  ${u.username} | email: ${u.email} | code: ${u.referralCode} | referredBy: ${u.referredBy || "none"}`);
    });
    console.log("Total users:", users.length);

    console.log("\n=== ROOMS ===");
    const rooms = await mongoose.connection.db.collection("rooms").find({}).toArray();
    console.log("Total rooms:", rooms.length);
    rooms.forEach((r) => {
        console.log(`  Room: ${r._id} | type: ${r.type || "N/A"} | participants: ${JSON.stringify(r.participants)}`);
    });

    console.log("\n=== MESSAGES ===");
    const msgCount = await mongoose.connection.db.collection("messages").countDocuments();
    console.log("Total messages:", msgCount);

    const last5 = await mongoose.connection.db.collection("messages")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ sender: 1, text: 1, roomId: 1, createdAt: 1 })
        .toArray();

    last5.forEach((m) => {
        console.log(`  [${m.createdAt}] sender: ${m.sender} | room: ${m.roomId} | text: ${m.text}`);
    });

    await mongoose.disconnect();
}

check().catch((e) => {
    console.error(e);
    process.exit(1);
});
