const Message = require("../models/message.model");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a chat room
        socket.on("join_room", async (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);

            try {
                // Load previous messages for the room
                const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
                socket.emit("load_messages", messages);
            } catch (err) {
                console.error("Error loading messages:", err);
            }
        });

        // Send a message
        socket.on("send_message", async (data) => {
            const { roomId, sender, text } = data;

            try {
                // Save message to database
                const newMessage = new Message({ roomId, sender, text });
                await newMessage.save();

                // Broadcast message to everyone in the room including sender
                io.to(roomId).emit("receive_message", newMessage);
            } catch (err) {
                console.error("Error sending message:", err);
            }
        });

        // Typing indicators
        socket.on("typing", (roomId) => {
            socket.to(roomId).emit("display_typing", socket.id);
        });

        socket.on("stop_typing", (roomId) => {
            socket.to(roomId).emit("hide_typing", socket.id);
        });

        // Get list of all available API events
        socket.on("get_api_list", () => {
            const apiList = [
                { event: "join_room", args: ["roomId"], description: "Join a chat room to receive messages" },
                { event: "send_message", args: ["{ roomId, sender, text }"], description: "Send a message to a room" },
                { event: "typing", args: ["roomId"], description: "Notify room that user is typing" },
                { event: "stop_typing", args: ["roomId"], description: "Notify room that user stopped typing" },
                { event: "get_api_list", args: [], description: "Get list of all available API events" },
                { event: "disconnect", args: [], description: "Client disconnected" }
            ];
            socket.emit("api_list", apiList);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
