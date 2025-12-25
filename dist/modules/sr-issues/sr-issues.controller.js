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
exports.SRIssuesController = void 0;
const common_1 = require("@nestjs/common");
const sr_issues_service_1 = require("./sr-issues.service");
const create_sr_issue_dto_1 = require("./dto/create-sr-issue.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let SRIssuesController = class SRIssuesController {
    constructor(srIssuesService) {
        this.srIssuesService = srIssuesService;
    }
    create(createSRIssueDto) {
        return this.srIssuesService.create(createSRIssueDto);
    }
    findAll(srId) {
        if (srId) {
            return this.srIssuesService.findBySR(srId);
        }
        return this.srIssuesService.findAll();
    }
    findOne(id) {
        return this.srIssuesService.findOne(id);
    }
};
exports.SRIssuesController = SRIssuesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sr_issue_dto_1.CreateSRIssueDto]),
    __metadata("design:returntype", void 0)
], SRIssuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('srId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SRIssuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SRIssuesController.prototype, "findOne", null);
exports.SRIssuesController = SRIssuesController = __decorate([
    (0, common_1.Controller)('sr-issues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sr_issues_service_1.SRIssuesService])
], SRIssuesController);
//# sourceMappingURL=sr-issues.controller.js.map