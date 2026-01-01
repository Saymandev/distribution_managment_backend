import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
    CompanyClaim,
    CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
import {
    Customer,
    CustomerSchema,
} from "../../database/schemas/customer.schema";
import { Product, ProductSchema } from "../../database/schemas/product.schema";
import {
    SRPayment,
    SRPaymentSchema,
} from "../../database/schemas/sr-payment.schema";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
