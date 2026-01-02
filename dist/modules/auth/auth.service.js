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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = require("bcrypt");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../database/schemas/user.schema");
let AuthService = class AuthService {
    constructor(userModel, jwtService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.userModel.findOne({ email, isActive: true }).exec();
        if (!user) {
            console.error(`Login attempt failed: User not found or inactive - ${email}`);
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.error(`Login attempt failed: Invalid password - ${email}`);
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        
        const _a = user.toObject(), { password: _password } = _a, result = __rest(_a, ["password"]);
        return result;
    }
    async login(loginDto) {
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
    async validateToken(payload) {
       
        const user = await this.userModel.findById(payload.sub).exec();
        if (!user) {
            console.error("validateToken - user not found for ID:", payload.sub);
            throw new common_1.UnauthorizedException("User not found");
        }
        if (!user.isActive) {
            console.error("validateToken - user inactive:", user.email);
            throw new common_1.UnauthorizedException("User is inactive");
        }
       
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map