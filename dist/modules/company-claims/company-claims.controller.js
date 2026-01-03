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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyClaimsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const company_claims_service_1 = require("./company-claims.service");
const create_company_claim_dto_1 = require("./dto/create-company-claim.dto");
let CompanyClaimsController = class CompanyClaimsController {
    constructor(companyClaimsService) {
        this.companyClaimsService = companyClaimsService;
    }
    create(createCompanyClaimDto) {
        return this.companyClaimsService.create(createCompanyClaimDto);
    }
    findAll(companyId, page, limit, timePeriod = "all", searchQuery) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const safePage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
        const safeLimit = isNaN(limitNum) || limitNum < 1 ? 10 : limitNum;
        return this.companyClaimsService.findAll(companyId, safePage, safeLimit, timePeriod, searchQuery);
    }
    findOne(id) {
        return this.companyClaimsService.findOne(id);
    }
    update(id, updateData) {
        return this.companyClaimsService.update(id, updateData);
    }
    updateStatus(id, body) {
        return this.companyClaimsService.updateStatus(id, body.status, body.paidDate);
    }
};
exports.CompanyClaimsController = CompanyClaimsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_claim_dto_1.CreateCompanyClaimDto]),
    __metadata("design:returntype", void 0)
], CompanyClaimsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("companyId")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("timePeriod")),
    __param(4, (0, common_1.Query)("searchQuery")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CompanyClaimsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyClaimsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompanyClaimsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompanyClaimsController.prototype, "updateStatus", null);
exports.CompanyClaimsController = CompanyClaimsController = __decorate([
    (0, common_1.Controller)("company-claims"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [company_claims_service_1.CompanyClaimsService])
], CompanyClaimsController);
//# sourceMappingURL=company-claims.controller.js.map