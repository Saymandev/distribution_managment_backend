import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SRPaymentsService } from './sr-payments.service';
import { SRPaymentsController } from './sr-payments.controller';
import { SRPayment, SRPaymentSchema } from '../../database/schemas/sr-payment.schema';
import { SalesRep, SalesRepSchema } from '../../database/schemas/salesrep.schema';
import { SRIssue, SRIssueSchema } from '../../database/schemas/sr-issue.schema';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { Company, CompanySchema } from '../../database/schemas/company.schema';
import { CompanyClaim, CompanyClaimSchema, ClaimStatus } from '../../database/schemas/company-claim.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRPayment.name, schema: SRPaymentSchema },
      { name: SalesRep.name, schema: SalesRepSchema },
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Company.name, schema: CompanySchema },
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
    ]),
  ],
  controllers: [SRPaymentsController],
  providers: [SRPaymentsService],
  exports: [SRPaymentsService],
})
export class SRPaymentsModule {}

