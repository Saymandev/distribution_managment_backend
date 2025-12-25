"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const app_module_1 = require("../app.module");
const company_claim_schema_1 = require("./schemas/company-claim.schema");
const company_schema_1 = require("./schemas/company.schema");
const expense_schema_1 = require("./schemas/expense.schema");
const notification_schema_1 = require("./schemas/notification.schema");
const product_return_schema_1 = require("./schemas/product-return.schema");
const product_schema_1 = require("./schemas/product.schema");
const salesrep_schema_1 = require("./schemas/salesrep.schema");
const sr_issue_schema_1 = require("./schemas/sr-issue.schema");
const sr_payment_schema_1 = require("./schemas/sr-payment.schema");
const user_schema_1 = require("./schemas/user.schema");
async function clearAllData() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        console.log('🗑️  Starting data cleanup...\n');
        const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
        const companyModel = app.get((0, mongoose_1.getModelToken)(company_schema_1.Company.name));
        const productModel = app.get((0, mongoose_1.getModelToken)(product_schema_1.Product.name));
        const salesRepModel = app.get((0, mongoose_1.getModelToken)(salesrep_schema_1.SalesRep.name));
        const srIssueModel = app.get((0, mongoose_1.getModelToken)(sr_issue_schema_1.SRIssue.name));
        const srPaymentModel = app.get((0, mongoose_1.getModelToken)(sr_payment_schema_1.SRPayment.name));
        const companyClaimModel = app.get((0, mongoose_1.getModelToken)(company_claim_schema_1.CompanyClaim.name));
        const productReturnModel = app.get((0, mongoose_1.getModelToken)(product_return_schema_1.ProductReturn.name));
        const expenseModel = app.get((0, mongoose_1.getModelToken)(expense_schema_1.Expense.name));
        const notificationModel = app.get((0, mongoose_1.getModelToken)(notification_schema_1.Notification.name));
        const companiesCount = await companyModel.countDocuments();
        await companyModel.deleteMany({});
        console.log(`✅ Cleared Companies: ${companiesCount} documents`);
        const productsCount = await productModel.countDocuments();
        await productModel.deleteMany({});
        console.log(`✅ Cleared Products: ${productsCount} documents`);
        const salesRepsCount = await salesRepModel.countDocuments();
        await salesRepModel.deleteMany({});
        console.log(`✅ Cleared Sales Reps: ${salesRepsCount} documents`);
        const srIssuesCount = await srIssueModel.countDocuments();
        await srIssueModel.deleteMany({});
        console.log(`✅ Cleared SR Issues: ${srIssuesCount} documents`);
        const srPaymentsCount = await srPaymentModel.countDocuments();
        await srPaymentModel.deleteMany({});
        console.log(`✅ Cleared SR Payments: ${srPaymentsCount} documents`);
        const companyClaimsCount = await companyClaimModel.countDocuments();
        await companyClaimModel.deleteMany({});
        console.log(`✅ Cleared Company Claims: ${companyClaimsCount} documents`);
        const productReturnsCount = await productReturnModel.countDocuments();
        await productReturnModel.deleteMany({});
        console.log(`✅ Cleared Product Returns: ${productReturnsCount} documents`);
        const expensesCount = await expenseModel.countDocuments();
        await expenseModel.deleteMany({});
        console.log(`✅ Cleared Expenses: ${expensesCount} documents`);
        const notificationsCount = await notificationModel.countDocuments();
        await notificationModel.deleteMany({});
        console.log(`✅ Cleared Notifications: ${notificationsCount} documents`);
        const userCount = await userModel.countDocuments();
        console.log(`\n⏭️  Preserved Users: ${userCount} documents`);
        console.log('\n✨ All data cleared successfully!');
        console.log('✅ Only user data has been preserved.');
    }
    catch (error) {
        console.error('❌ Error clearing data:', error);
    }
    finally {
        await app.close();
    }
}
clearAllData();
//# sourceMappingURL=clear-data.js.map