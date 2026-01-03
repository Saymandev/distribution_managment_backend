import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { User, UserDocument } from "../../database/schemas/user.schema";
import { LoginDto } from "./dto/login.dto";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) {
      console.error(
        `Login attempt failed: User not found or inactive - ${email}`,
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error(`Login attempt failed: Invalid password - ${email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    const { password: _password, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { email: user.email, sub: user._id };
    const refreshPayload = { sub: user._id, tokenType: "refresh" };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: JWT_SECRET,
        expiresIn: "1h",
      }),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: JWT_SECRET,
        expiresIn: "7d",
      }),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    };
  }

  async validateToken(payload: any) {
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) {
      console.error("validateToken - user not found for ID:", payload.sub);
      throw new UnauthorizedException("User not found");
    }
    if (!user.isActive) {
      console.error("validateToken - user inactive:", user.email);
      throw new UnauthorizedException("User is inactive");
    }

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token with explicit secret
      const payload = this.jwtService.verify(refreshToken, {
        secret: JWT_SECRET,
      });

      // Check if it's a refresh token
      if (payload.tokenType !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.isActive) {
        throw new UnauthorizedException("User not found or inactive");
      }

      // Generate new tokens with explicit options
      const newPayload = { email: user.email, sub: user._id };
      const newRefreshPayload = { sub: user._id, tokenType: "refresh" };

      return {
        access_token: this.jwtService.sign(newPayload, {
          secret: JWT_SECRET,
          expiresIn: "1h",
        }),
        refresh_token: this.jwtService.sign(newRefreshPayload, {
          secret: JWT_SECRET,
          expiresIn: "7d",
        }),
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
