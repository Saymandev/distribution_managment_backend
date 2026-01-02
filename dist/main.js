"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const socket_io_adapter_1 = require("./common/adapters/socket-io.adapter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useWebSocketAdapter(new socket_io_adapter_1.SocketIoAdapter(app));
    const allowedOrigins = [
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ro0k004sg00c0884goskw404.ourb.live",
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "X-Requested-With",
        ],
        exposedHeaders: ["Authorization"],
    });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    
    const port = process.env.PORT || 3001;
    await app.listen(port);
    
}
bootstrap();
//# sourceMappingURL=main.js.map