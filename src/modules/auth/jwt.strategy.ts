import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    const secret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    try {
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

      return { userId: user._id, email: user.email };
    } catch (error) {
      console.error("❌ JWT Strategy validate - error:", error);
      console.error("   Error message:", error?.message);
      console.error("   Error stack:", error?.stack);
      throw error;
    }
  }
}
