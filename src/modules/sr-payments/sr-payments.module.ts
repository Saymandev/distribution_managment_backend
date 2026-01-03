import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CompanyClaim,
  CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
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
} from "../../database/schemas/sr-payment.schema";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProductReturnsModule } from "../product-returns/product-returns.module";
import { SRPaymentsController } from "./sr-payments.controller";
import { SRPaymentsService } from "./sr-payments.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: SalesRep.name, schema: SalesRepSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: ProductReturn.name, schema: ProductReturnSchema },
    ]),
    NotificationsModule,
    ProductReturnsModule,
  ],
  controllers: [SRPaymentsController],
  providers: [SRPaymentsService],
  exports: [SRPaymentsService],
})
export class SRPaymentsModule {}
