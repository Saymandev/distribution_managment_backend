import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CompanyClaim,
  CompanyClaimSchema,
} from "../../database/schemas/company-claim.schema";
import { Company, CompanySchema } from "../../database/schemas/company.schema";
import {
  SRPayment,
  SRPaymentSchema,
} from "../../database/schemas/sr-payment.schema";
import { NotificationsModule } from "../notifications/notifications.module";
import { CompanyClaimsController } from "./company-claims.controller";
import { CompanyClaimsService } from "./company-claims.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Company.name, schema: CompanySchema },
      { name: SRPayment.name, schema: SRPaymentSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [CompanyClaimsController],
  providers: [CompanyClaimsService],
  exports: [CompanyClaimsService],
})
export class CompanyClaimsModule {}
