const http = require("http");
const os = require("os");
const { Server } = require("socket.io");
const app = require("./app");
const { connectDB } = require("./config/db");
const { initializeFirebase } = require("./config/firebase");

connectDB();
initializeFirebase();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

require("./sockets/chat.socket")(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Only log network URL in development
    if (process.env.NODE_ENV !== 'production') {
        const networkInterfaces = os.networkInterfaces();
        let ipAddress = 'localhost';

        Object.keys(networkInterfaces).forEach((ifname) => {
            networkInterfaces[ifname].forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    ipAddress = iface.address;
                }
            });
        });

        console.log(`Network URL for Frontend: http://${ipAddress}:${PORT}`);
    }
});
