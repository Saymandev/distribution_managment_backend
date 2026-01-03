import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Check headers - Express lowercases headers
    const authHeader =
      request.headers.authorization || request.headers.Authorization;

    if (!authHeader) {
      console.error("❌ JwtAuthGuard - NO AUTHORIZATION HEADER FOUND!");
      console.error(
        "   Request headers:",
        JSON.stringify(request.headers, null, 2),
      );
    }

    const result = super.canActivate(context);

    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error(
        "JwtAuthGuard - Authentication failed:",
        err?.message || info?.message || "Unknown error",
      );
      throw new UnauthorizedException("Invalid or expired token");
    }

    return user;
  }
}
