import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CompanyClaim,
  CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
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
import { SRIssuesController } from "./sr-issues.controller";
import { SRIssuesService } from "./sr-issues.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SalesRep.name, schema: SalesRepSchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: ProductReturn.name, schema: ProductReturnSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
    ]),
  ],
  controllers: [SRIssuesController],
  providers: [SRIssuesService],
  exports: [SRIssuesService],
})
export class SRIssuesModule {}
