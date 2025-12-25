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
exports.SalesRepsController = void 0;
const common_1 = require("@nestjs/common");
const salesreps_service_1 = require("./salesreps.service");
const create_salesrep_dto_1 = require("./dto/create-salesrep.dto");
const update_salesrep_dto_1 = require("./dto/update-salesrep.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let SalesRepsController = class SalesRepsController {
    constructor(salesRepsService) {
        this.salesRepsService = salesRepsService;
    }
    create(createSalesRepDto) {
        return this.salesRepsService.create(createSalesRepDto);
    }
    findAll(companyId) {
        return this.salesRepsService.findAll(companyId);
    }
    findOne(id) {
        return this.salesRepsService.findOne(id);
    }
    update(id, updateSalesRepDto) {
        return this.salesRepsService.update(id, updateSalesRepDto);
    }
    remove(id) {
        return this.salesRepsService.remove(id);
    }
};
exports.SalesRepsController = SalesRepsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_salesrep_dto_1.CreateSalesRepDto]),
    __metadata("design:returntype", void 0)
], SalesRepsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesRepsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesRepsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_salesrep_dto_1.UpdateSalesRepDto]),
    __metadata("design:returntype", void 0)
], SalesRepsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesRepsController.prototype, "remove", null);
exports.SalesRepsController = SalesRepsController = __decorate([
    (0, common_1.Controller)('salesreps'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [salesreps_service_1.SalesRepsService])
], SalesRepsController);
//# sourceMappingURL=salesreps.controller.js.map