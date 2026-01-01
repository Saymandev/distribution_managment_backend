"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const notifications_service_1 = require("./notifications.service");
let NotificationsGateway = class NotificationsGateway {
    constructor(notificationsService, jwtService) {
        this.notificationsService = notificationsService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        var _a;
        try {
            const token = client.handshake.auth.token ||
                ((_a = client.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", ""));
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
            });
            client.data.userId = payload.sub;
        }
        catch (error) {
            console.error("❌ WebSocket authentication failed:", error);
            client.disconnect();
        }
    }
    handleDisconnect(_client) { }
    handleJoin(client) {
        client.join("notifications");
    }
    handleTest(_client, _data) {
        _client.emit("test-response", { message: "Hello from backend!" });
    }
    async emitNewNotification(notification) {
        this.server.to("notifications").emit("new-notification", notification);
    }
    async emitNotificationUpdate(notification) {
        this.server.to("notifications").emit("notification-update", notification);
    }
    async emitClaimStatusUpdate(claimData) {
        this.server.to("notifications").emit("claim-status-update", claimData);
    }
    async emitClaimsDataRefresh() {
        this.server.to("notifications").emit("claims-data-refresh");
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("join"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleTest", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
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
        },
    }),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map