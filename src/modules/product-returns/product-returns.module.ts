import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CompanyClaim,
  CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
import { NotificationsModule } from "../notifications/notifications.module";
import {
  ProductReturn,
  ProductReturnSchema,
} from "../../database/schemas/product-return.schema";
import { Product, ProductSchema } from "../../database/schemas/product.schema";
import { SRIssue, SRIssueSchema } from "../../database/schemas/sr-issue.schema";
import {
  SRPayment,
  SRPaymentSchema,
} from "../../database/schemas/sr-payment.schema";
import { ProductReturnsController } from "./product-returns.controller";
import { ProductReturnsService } from "./product-returns.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductReturn.name, schema: ProductReturnSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ProductReturnsController],
  providers: [ProductReturnsService],
  exports: [ProductReturnsService],
})
export class ProductReturnsModule {}
