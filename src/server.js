const http = require("http");
const os = require("os");
const { Server } = require("socket.io");
const app = require("./app");
const { connectDB } = require("./config/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

require("./sockets/chat.socket")(io);

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);

    // Get local IP address
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = 'localhost';

    Object.keys(networkInterfaces).forEach((ifname) => {
        networkInterfaces[ifname].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                ipAddress = iface.address;
            }
        });
    });

    console.log(`Network URL for Frontend: http://${ipAddress}:${process.env.PORT}`);
});
