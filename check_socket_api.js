const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    // Attempt to discover events (usually requires server support)
    // For demonstration, we'll listen for a response if we emit 'get_api_list'
    socket.emit("get_api_list");

    // Also try to join a room to verify basic functionality
    socket.emit("join_room", "test-room");
});

socket.on("api_list", (data) => {
    console.log("Received API List:", JSON.stringify(data, null, 2));
    socket.disconnect();
});

socket.on("load_messages", (messages) => {
    console.log("Joined room, loaded messages count:", messages.length);
    // If we don't get an api_list in 2 seconds, we assume it's not implemented
    setTimeout(() => {
        console.log("No api_list response received. Feature likely not implemented.");
        socket.disconnect();
    }, 2000);
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});
