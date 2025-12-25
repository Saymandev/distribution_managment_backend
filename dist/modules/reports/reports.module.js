"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const expense_schema_1 = require("../../database/schemas/expense.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: sr_payment_schema_1.SRPayment.name, schema: sr_payment_schema_1.SRPaymentSchema },
                { name: company_claim_schema_1.CompanyClaim.name, schema: company_claim_schema_1.CompanyClaimSchema },
                { name: expense_schema_1.Expense.name, schema: expense_schema_1.ExpenseSchema },
                { name: sr_issue_schema_1.SRIssue.name, schema: sr_issue_schema_1.SRIssueSchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: salesrep_schema_1.SalesRep.name, schema: salesrep_schema_1.SalesRepSchema },
            ]),
        ],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map