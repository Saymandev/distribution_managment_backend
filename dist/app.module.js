"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const company_claim_schema_1 = require("./database/schemas/company-claim.schema");
const company_schema_1 = require("./database/schemas/company.schema");
const expense_schema_1 = require("./database/schemas/expense.schema");
const notification_schema_1 = require("./database/schemas/notification.schema");
const product_return_schema_1 = require("./database/schemas/product-return.schema");
const product_schema_1 = require("./database/schemas/product.schema");
const salesrep_schema_1 = require("./database/schemas/salesrep.schema");
const sr_issue_schema_1 = require("./database/schemas/sr-issue.schema");
const sr_payment_schema_1 = require("./database/schemas/sr-payment.schema");
const user_schema_1 = require("./database/schemas/user.schema");
const auth_module_1 = require("./modules/auth/auth.module");
const companies_module_1 = require("./modules/companies/companies.module");
const company_claims_module_1 = require("./modules/company-claims/company-claims.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const product_returns_module_1 = require("./modules/product-returns/product-returns.module");
const products_module_1 = require("./modules/products/products.module");
const reports_module_1 = require("./modules/reports/reports.module");
const salesreps_module_1 = require("./modules/salesreps/salesreps.module");
const sr_issues_module_1 = require("./modules/sr-issues/sr-issues.module");
const sr_payments_module_1 = require("./modules/sr-payments/sr-payments.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/dms_db'),
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: salesrep_schema_1.SalesRep.name, schema: salesrep_schema_1.SalesRepSchema },
                { name: sr_issue_schema_1.SRIssue.name, schema: sr_issue_schema_1.SRIssueSchema },
                { name: sr_payment_schema_1.SRPayment.name, schema: sr_payment_schema_1.SRPaymentSchema },
                { name: company_claim_schema_1.CompanyClaim.name, schema: company_claim_schema_1.CompanyClaimSchema },
                { name: product_return_schema_1.ProductReturn.name, schema: product_return_schema_1.ProductReturnSchema },
                { name: expense_schema_1.Expense.name, schema: expense_schema_1.ExpenseSchema },
                { name: notification_schema_1.Notification.name, schema: notification_schema_1.NotificationSchema },
            ]),
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            products_module_1.ProductsModule,
            salesreps_module_1.SalesRepsModule,
            sr_issues_module_1.SRIssuesModule,
            sr_payments_module_1.SRPaymentsModule,
            company_claims_module_1.CompanyClaimsModule,
            product_returns_module_1.ProductReturnsModule,
            expenses_module_1.ExpensesModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map