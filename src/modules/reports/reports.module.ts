import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SRPayment, SRPaymentSchema } from '../../database/schemas/sr-payment.schema';
import { CompanyClaim, CompanyClaimSchema } from '../../database/schemas/company-claim.schema';
import { Expense, ExpenseSchema } from '../../database/schemas/expense.schema';
import { SRIssue, SRIssueSchema } from '../../database/schemas/sr-issue.schema';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { Company, CompanySchema } from '../../database/schemas/company.schema';
import { SalesRep, SalesRepSchema } from '../../database/schemas/salesrep.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
      { name: SalesRep.name, schema: SalesRepSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

