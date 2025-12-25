import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) {
      console.error(`Login attempt failed: User not found or inactive - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error(`Login attempt failed: Invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`Login successful: ${email}`);
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    };
  }

  async validateToken(payload: any) {
    console.log('validateToken - payload.sub:', payload.sub);
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) {
      console.error('validateToken - user not found for ID:', payload.sub);
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      console.error('validateToken - user inactive:', user.email);
      throw new UnauthorizedException('User is inactive');
    }
    console.log('validateToken - success for:', user.email);
    return user;
  }
}

