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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getDashboard(req, companyId) {
        return this.reportsService.getDashboard(companyId);
    }
    getProfitLoss(companyId, startDate, endDate) {
        const start = startDate ? this.parseDateString(startDate, true) : undefined;
        const end = endDate ? this.parseDateString(endDate, false) : undefined;
        return this.reportsService.getProfitLoss(companyId, start, end);
    }
    getDueAmounts(companyId) {
        return this.reportsService.getDueAmounts(companyId);
    }
    getWeeklyData(companyId) {
        return this.reportsService.getWeeklyData(companyId);
    }
    getMonthlyData(companyId) {
        return this.reportsService.getMonthlyData(companyId);
    }
    getFloorStockReport(companyId) {
        return this.reportsService.getFloorStockReport(companyId);
    }
    getDuesReport(companyId) {
        return this.reportsService.getDuesReport(companyId);
    }
    getPendingDeliveries(companyId, page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.reportsService.getPendingDeliveries(companyId, pageNum, limitNum);
    }
    getProductHistory(productId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.reportsService.getProductHistory(productId, start, end);
    }
    getFinancialOverview(companyId) {
        return this.reportsService.getFinancialOverview(companyId);
    }
    getMonthlyReport(companyId, startDate, endDate) {
        const start = startDate ? this.parseDateString(startDate, true) : undefined;
        const end = endDate ? this.parseDateString(endDate, false) : undefined;
        return this.reportsService.getMonthlyReport(companyId, start, end);
    }
    parseDateString(dateString, isStart) {
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        if (isStart) {
            date.setHours(0, 0, 0, 0);
        }
        else {
            date.setHours(23, 59, 59, 999);
        }
        return date;
    }
    getDailyFinancialSummary(startDate, endDate, companyId) {
        const start = startDate ? this.parseDateString(startDate, true) : undefined;
        const end = endDate ? this.parseDateString(endDate, false) : undefined;
        return this.reportsService.getDailyFinancialSummary(start, end, companyId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)("dashboard"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)("profit-loss"),
    __param(0, (0, common_1.Query)("companyId")),
    __param(1, (0, common_1.Query)("startDate")),
    __param(2, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getProfitLoss", null);
__decorate([
    (0, common_1.Get)("due-amounts"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDueAmounts", null);
__decorate([
    (0, common_1.Get)("weekly"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getWeeklyData", null);
__decorate([
    (0, common_1.Get)("monthly"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyData", null);
__decorate([
    (0, common_1.Get)("floor-stock"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFloorStockReport", null);
__decorate([
    (0, common_1.Get)("dues"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDuesReport", null);
__decorate([
    (0, common_1.Get)("pending-deliveries"),
    __param(0, (0, common_1.Query)("companyId")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPendingDeliveries", null);
__decorate([
    (0, common_1.Get)("product-history/:productId"),
    __param(0, (0, common_1.Param)("productId")),
    __param(1, (0, common_1.Query)("startDate")),
    __param(2, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getProductHistory", null);
__decorate([
    (0, common_1.Get)("financial-overview"),
    __param(0, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFinancialOverview", null);
__decorate([
    (0, common_1.Get)("monthly-report"),
    __param(0, (0, common_1.Query)("companyId")),
    __param(1, (0, common_1.Query)("startDate")),
    __param(2, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.Get)("daily-financial"),
    __param(0, (0, common_1.Query)("startDate")),
    __param(1, (0, common_1.Query)("endDate")),
    __param(2, (0, common_1.Query)("companyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDailyFinancialSummary", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)("reports"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map