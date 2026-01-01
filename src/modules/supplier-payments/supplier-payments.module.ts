import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
import {
  SupplierPayment,
  SupplierPaymentSchema,
} from "../../database/schemas/sr-payment.schema";
import { SupplierPaymentsController } from "./supplier-payments.controller";
import { SupplierPaymentsService } from "./supplier-payments.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [SupplierPaymentsController],
  providers: [SupplierPaymentsService],
  exports: [SupplierPaymentsService],
})
export class SupplierPaymentsModule {}
