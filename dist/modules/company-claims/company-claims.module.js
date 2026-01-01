"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyClaimsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const company_schema_1 = require("../../database/schemas/company.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const company_claims_controller_1 = require("./company-claims.controller");
const company_claims_service_1 = require("./company-claims.service");
let CompanyClaimsModule = class CompanyClaimsModule {
};
exports.CompanyClaimsModule = CompanyClaimsModule;
exports.CompanyClaimsModule = CompanyClaimsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: company_claim_schema_1.CompanyClaim.name, schema: company_claim_schema_1.CompanyClaimSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: sr_payment_schema_1.SRPayment.name, schema: sr_payment_schema_1.SRPaymentSchema },
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [company_claims_controller_1.CompanyClaimsController],
        providers: [company_claims_service_1.CompanyClaimsService],
        exports: [company_claims_service_1.CompanyClaimsService],
    })
], CompanyClaimsModule);
//# sourceMappingURL=company-claims.module.js.map