import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
import { Product, ProductSchema } from "../../database/schemas/product.schema";
import {
  SupplierPayment,
  SupplierPaymentSchema,
  SupplierReceipt,
  SupplierReceiptSchema,
} from "../../database/schemas/sr-payment.schema";
import { SupplierReceiptsController } from "./supplier-receipts.controller";
import { SupplierReceiptsService } from "./supplier-receipts.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupplierReceipt.name, schema: SupplierReceiptSchema },
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [SupplierReceiptsController],
  providers: [SupplierReceiptsService],
  exports: [SupplierReceiptsService],
})
export class SupplierReceiptsModule {}
