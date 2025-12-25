import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { CompanyClaim, CompanyClaimDocument } from './schemas/company-claim.schema';
import { Company, CompanyDocument } from './schemas/company.schema';
import { Expense, ExpenseDocument } from './schemas/expense.schema';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { ProductReturn, ProductReturnDocument } from './schemas/product-return.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { SalesRep, SalesRepDocument } from './schemas/salesrep.schema';
import { SRIssue, SRIssueDocument } from './schemas/sr-issue.schema';
import { SRPayment, SRPaymentDocument } from './schemas/sr-payment.schema';
import { User, UserDocument } from './schemas/user.schema';

async function clearAllData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🗑️  Starting data cleanup...\n');

    // Get all models
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const companyModel = app.get<Model<CompanyDocument>>(getModelToken(Company.name));
    const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
    const salesRepModel = app.get<Model<SalesRepDocument>>(getModelToken(SalesRep.name));
    const srIssueModel = app.get<Model<SRIssueDocument>>(getModelToken(SRIssue.name));
    const srPaymentModel = app.get<Model<SRPaymentDocument>>(getModelToken(SRPayment.name));
    const companyClaimModel = app.get<Model<CompanyClaimDocument>>(getModelToken(CompanyClaim.name));
    const productReturnModel = app.get<Model<ProductReturnDocument>>(getModelToken(ProductReturn.name));
    const expenseModel = app.get<Model<ExpenseDocument>>(getModelToken(Expense.name));
    const notificationModel = app.get<Model<NotificationDocument>>(getModelToken(Notification.name));

    // Clear all collections except users
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
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await app.close();
  }
}

clearAllData();
