import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyClaimsService } from './company-claims.service';
import { CompanyClaimsController } from './company-claims.controller';
import { CompanyClaim, CompanyClaimSchema } from '../../database/schemas/company-claim.schema';
import { Company, CompanySchema } from '../../database/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyClaim.name, schema: CompanyClaimSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [CompanyClaimsController],
  providers: [CompanyClaimsService],
  exports: [CompanyClaimsService],
})
export class CompanyClaimsModule {}

