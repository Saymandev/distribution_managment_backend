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
exports.SupplierPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_supplier_payment_dto_1 = require("./dto/create-supplier-payment.dto");
const update_supplier_payment_dto_1 = require("./dto/update-supplier-payment.dto");
const supplier_payments_service_1 = require("./supplier-payments.service");
let SupplierPaymentsController = class SupplierPaymentsController {
    constructor(supplierPaymentsService) {
        this.supplierPaymentsService = supplierPaymentsService;
    }
    create(createSupplierPaymentDto) {
        return this.supplierPaymentsService.create(createSupplierPaymentDto);
    }
    findAll(companyId, startDate, endDate, search, page, limit) {
        const filters = {
            companyId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        };
        return this.supplierPaymentsService.findAllWithFilters(filters);
    }
    findOne(id) {
        return this.supplierPaymentsService.findOne(id);
    }
    update(id, updateSupplierPaymentDto) {
        return this.supplierPaymentsService.update(id, updateSupplierPaymentDto);
    }
    remove(id) {
        return this.supplierPaymentsService.remove(id);
    }
};
exports.SupplierPaymentsController = SupplierPaymentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_supplier_payment_dto_1.CreateSupplierPaymentDto]),
    __metadata("design:returntype", void 0)
], SupplierPaymentsController.prototype, "create", null);
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
], SupplierPaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierPaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_supplier_payment_dto_1.UpdateSupplierPaymentDto]),
    __metadata("design:returntype", void 0)
], SupplierPaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupplierPaymentsController.prototype, "remove", null);
exports.SupplierPaymentsController = SupplierPaymentsController = __decorate([
    (0, common_1.Controller)("supplier-payments"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [supplier_payments_service_1.SupplierPaymentsService])
], SupplierPaymentsController);
//# sourceMappingURL=supplier-payments.controller.js.map