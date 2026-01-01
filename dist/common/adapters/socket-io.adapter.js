"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class SocketIoAdapter extends platform_socket_io_1.IoAdapter {
    createIOServer(port, options) {
        const server = super.createIOServer(port, Object.assign(Object.assign({}, options), { cors: {
                origin: (origin, callback) => {
                    const allowedOrigins = [
                        ...(process.env.FRONTEND_URL
                            ? process.env.FRONTEND_URL.split(",")
                            : []),
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "https://ro0k004sg00c0884goskw404.ourb.live",
                    ];
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    }
                    else {
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                credentials: true,
                methods: ["GET", "POST"],
                allowedHeaders: [
                    "Content-Type",
                    "Authorization",
                    "Accept",
                    "X-Requested-With",
                ],
            } }));
        return server;
    }
}
exports.SocketIoAdapter = SocketIoAdapter;
//# sourceMappingURL=socket-io.adapter.js.map