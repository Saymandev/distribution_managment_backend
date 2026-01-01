"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const company_schema_1 = require("../../database/schemas/company.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
const supplier_payments_controller_1 = require("./supplier-payments.controller");
const supplier_payments_service_1 = require("./supplier-payments.service");
let SupplierPaymentsModule = class SupplierPaymentsModule {
};
exports.SupplierPaymentsModule = SupplierPaymentsModule;
exports.SupplierPaymentsModule = SupplierPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: sr_payment_schema_1.SupplierPayment.name, schema: sr_payment_schema_1.SupplierPaymentSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
            ]),
        ],
        controllers: [supplier_payments_controller_1.SupplierPaymentsController],
        providers: [supplier_payments_service_1.SupplierPaymentsService],
        exports: [supplier_payments_service_1.SupplierPaymentsService],
    })
], SupplierPaymentsModule);
//# sourceMappingURL=supplier-payments.module.js.map