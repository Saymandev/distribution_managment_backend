import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { NotificationsService } from "./notifications.service";

@WebSocketGateway({
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
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret:
          process.env.JWT_SECRET || "your-secret-key-change-in-production",
      });

      client.data.userId = payload.sub;
    } catch (error) {
      console.error("❌ WebSocket authentication failed:", error);
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage("join")
  handleJoin(client: Socket) {
    client.join("notifications");
  }

  @SubscribeMessage("test")
  handleTest(_client: Socket, _data: any) {
    _client.emit("test-response", { message: "Hello from backend!" });
  }

  // Method to emit new notification to all connected clients
  async emitNewNotification(notification: any) {
    this.server.to("notifications").emit("new-notification", notification);
  }

  // Method to emit notification update
  async emitNotificationUpdate(notification: any) {
    this.server.to("notifications").emit("notification-update", notification);
  }

  // Method to emit claim status update
  async emitClaimStatusUpdate(claimData: any) {
    this.server.to("notifications").emit("claim-status-update", claimData);
  }

  // Method to emit claims data refresh
  async emitClaimsDataRefresh() {
    this.server.to("notifications").emit("claims-data-refresh");
  }
}
