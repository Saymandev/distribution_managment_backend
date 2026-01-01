import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CompanyClaim,
  CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
import { Expense, ExpenseSchema } from "../../database/schemas/expense.schema";
import {
  ProductReturn,
  ProductReturnSchema,
} from "../../database/schemas/product-return.schema";
import { Product, ProductSchema } from "../../database/schemas/product.schema";
import {
  SalesRep,
  SalesRepSchema,
} from "../../database/schemas/salesrep.schema";
import { SRIssue, SRIssueSchema } from "../../database/schemas/sr-issue.schema";
import {
  SRPayment,
  SRPaymentSchema,
  SupplierPayment,
  SupplierPaymentSchema,
  SupplierReceipt,
  SupplierReceiptSchema,
} from "../../database/schemas/sr-payment.schema";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
      { name: SupplierReceipt.name, schema: SupplierReceiptSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
      { name: SalesRep.name, schema: SalesRepSchema },
      { name: ProductReturn.name, schema: ProductReturnSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
