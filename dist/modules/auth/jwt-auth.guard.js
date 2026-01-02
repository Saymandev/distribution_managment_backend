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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)("jwt") {
    constructor() {
        super();
        
    }
    canActivate(context) {
       
        const request = context.switchToHttp().getRequest();
        
        const authHeader = request.headers.authorization || request.headers.Authorization;
        
        
        if (!authHeader) {
            console.error("❌ JwtAuthGuard - NO AUTHORIZATION HEADER FOUND!");
            console.error("   Request headers:", JSON.stringify(request.headers, null, 2));
        }
        const result = super.canActivate(context);
        
        return result;
    }
    handleRequest(err, user, info) {
        if (err || !user) {
            console.error("JwtAuthGuard - Authentication failed:", (err === null || err === void 0 ? void 0 : err.message) || (info === null || info === void 0 ? void 0 : info.message) || "Unknown error");
            throw err || new Error("Unauthorized");
        }
       
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map