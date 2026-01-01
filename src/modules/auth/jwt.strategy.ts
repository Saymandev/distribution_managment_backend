import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const secret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    console.log(
      "🔑 JWT Strategy initialized with secret:",
      secret.substring(0, 10) + "...",
    );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    try {
      console.log(
        "🔑 JWT Strategy validate - payload received:",
        JSON.stringify(payload, null, 2),
      );
      if (!payload || !payload.sub) {
        console.error(
          "❌ JWT Strategy validate - Invalid payload, missing sub",
        );
        throw new UnauthorizedException("Invalid token payload");
      }
      const user = await this.authService.validateToken(payload);
      if (!user) {
        console.error(
          "❌ JWT Strategy validate - user not found for ID:",
          payload.sub,
        );
        throw new UnauthorizedException("User not found");
      }
      console.log("✅ JWT Strategy validate - success for:", user.email);
      return { userId: user._id, email: user.email };
    } catch (error) {
      console.error("❌ JWT Strategy validate - error:", error);
      console.error("   Error message:", error?.message);
      console.error("   Error stack:", error?.stack);
      throw error;
    }
  }
}
