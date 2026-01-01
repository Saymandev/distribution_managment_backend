"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductReturnsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const product_return_schema_1 = require("../../database/schemas/product-return.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
const product_returns_controller_1 = require("./product-returns.controller");
const product_returns_service_1 = require("./product-returns.service");
let ProductReturnsModule = class ProductReturnsModule {
};
exports.ProductReturnsModule = ProductReturnsModule;
exports.ProductReturnsModule = ProductReturnsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: product_return_schema_1.ProductReturn.name, schema: product_return_schema_1.ProductReturnSchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: sr_issue_schema_1.SRIssue.name, schema: sr_issue_schema_1.SRIssueSchema },
                { name: sr_payment_schema_1.SRPayment.name, schema: sr_payment_schema_1.SRPaymentSchema },
                { name: company_claim_schema_1.CompanyClaim.name, schema: company_claim_schema_1.CompanyClaimSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [product_returns_controller_1.ProductReturnsController],
        providers: [product_returns_service_1.ProductReturnsService],
        exports: [product_returns_service_1.ProductReturnsService],
    })
], ProductReturnsModule);
//# sourceMappingURL=product-returns.module.js.map