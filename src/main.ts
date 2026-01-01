import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SocketIoAdapter } from "./common/adapters/socket-io.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  // Best practice CORS configuration: allow multiple origins (env and hardcoded)
  const allowedOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ro0k004sg00c0884goskw404.ourb.live", // Add your deployed domain explicitly
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  console.log("---------- SERVER ENV --------------");
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("PORT:", process.env.PORT);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("-------------------------------------");
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
}

bootstrap();
