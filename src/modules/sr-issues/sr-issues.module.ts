import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SRIssuesService } from './sr-issues.service';
import { SRIssuesController } from './sr-issues.controller';
import { SRIssue, SRIssueSchema } from '../../database/schemas/sr-issue.schema';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { SalesRep, SalesRepSchema } from '../../database/schemas/salesrep.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SRIssue.name, schema: SRIssueSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SalesRep.name, schema: SalesRepSchema },
    ]),
  ],
  controllers: [SRIssuesController],
  providers: [SRIssuesService],
  exports: [SRIssuesService],
})
export class SRIssuesModule {}

