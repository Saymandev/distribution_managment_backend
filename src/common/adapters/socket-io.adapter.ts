import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
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
          } else {
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
      },
    });

    return server;
  }
}
