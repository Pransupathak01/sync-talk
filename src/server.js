const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { connectDB } = require("./config/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

require("./sockets/chat.socket")(io);

server.listen(process.env.PORT, () =>
    console.log("Server running on", process.env.PORT)
);
