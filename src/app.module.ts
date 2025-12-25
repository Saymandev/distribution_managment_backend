import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CompanyClaim, CompanyClaimSchema } from './database/schemas/company-claim.schema';
import { Company, CompanySchema } from './database/schemas/company.schema';
import { Expense, ExpenseSchema } from './database/schemas/expense.schema';
import { Notification, NotificationSchema } from './database/schemas/notification.schema';
import { ProductReturn, ProductReturnSchema } from './database/schemas/product-return.schema';
import { Product, ProductSchema } from './database/schemas/product.schema';
import { SalesRep, SalesRepSchema } from './database/schemas/salesrep.schema';
import { SRIssue, SRIssueSchema } from './database/schemas/sr-issue.schema';
import { SRPayment, SRPaymentSchema } from './database/schemas/sr-payment.schema';
import { User, UserSchema } from './database/schemas/user.schema';

import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CompanyClaimsModule } from './modules/company-claims/company-claims.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductReturnsModule } from './modules/product-returns/product-returns.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesRepsModule } from './modules/salesreps/salesreps.module';
import { SRIssuesModule } from './modules/sr-issues/sr-issues.module';
import { SRPaymentsModule } from './modules/sr-payments/sr-payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/dms_db'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Product.name, schema: ProductSchema },
      { name: SalesRep.name, schema: SalesRepSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: ProductReturn.name, schema: ProductReturnSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
    CompaniesModule,
    ProductsModule,
    SalesRepsModule,
    SRIssuesModule,
    SRPaymentsModule,
    CompanyClaimsModule,
    ProductReturnsModule,
    ExpensesModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
