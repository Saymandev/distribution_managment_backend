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
exports.SupplierReceiptsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_supplier_receipt_dto_1 = require("./dto/create-supplier-receipt.dto");
const update_supplier_receipt_dto_1 = require("./dto/update-supplier-receipt.dto");
const supplier_receipts_service_1 = require("./supplier-receipts.service");
let SupplierReceiptsController = class SupplierReceiptsController {
    constructor(supplierReceiptsService) {
        this.supplierReceiptsService = supplierReceiptsService;
    }
    create(createSupplierReceiptDto) {
        return this.supplierReceiptsService.create(createSupplierReceiptDto);
    }
    findAll(companyId, startDate, endDate, search, page, limit) {
        console.log("🎯 Controller: findAll called with params:", {
            companyId,
            page,
            limit,
            startDate,
            endDate,
            search,
        });
        const filters = {
            companyId,
            startDate,
            endDate,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        };
        console.log("🎯 Controller: calling service with filters:", filters);
        const result = this.supplierReceiptsService.findAllWithFilters(filters);
        console.log("🎯 Controller: service returned:", result ? "result" : "null");
        return result;
    }
    getSupplierBalance(companyId) {
        return this.supplierReceiptsService.getSupplierBalance(companyId);
    }
    testBalance(companyId) {
        return this.supplierReceiptsService.testBalance(companyId);
    }
    findOne(id) {
        return this.supplierReceiptsService.findOne(id);
    }
    update(id, updateSupplierReceiptDto) {
        return this.supplierReceiptsService.update(id, updateSupplierReceiptDto);
    }
    remove(id) {
        return this.supplierReceiptsService.remove(id);
    }
};
exports.SupplierReceiptsController = SupplierReceiptsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_supplier_receipt_dto_1.CreateSupplierReceiptDto]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("companyId")),
    __param(1, (0, common_1.Query)("startDate")),
    __param(2, (0, common_1.Query)("endDate")),
    __param(3, (0, common_1.Query)("search")),
    __param(4, (0, common_1.Query)("page")),
    __param(5, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("balance"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "getSupplierBalance", null);
__decorate([
    (0, common_1.Get)("test-balance"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "testBalance", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_supplier_receipt_dto_1.UpdateSupplierReceiptDto]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierReceiptsController.prototype, "remove", null);
exports.SupplierReceiptsController = SupplierReceiptsController = __decorate([
    (0, common_1.Controller)("supplier-receipts"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [supplier_receipts_service_1.SupplierReceiptsService])
], SupplierReceiptsController);
//# sourceMappingURL=supplier-receipts.controller.js.map