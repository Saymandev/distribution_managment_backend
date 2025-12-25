import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesRepsService } from './salesreps.service';
import { SalesRepsController } from './salesreps.controller';
import { SalesRep, SalesRepSchema } from '../../database/schemas/salesrep.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SalesRep.name, schema: SalesRepSchema }])],
  controllers: [SalesRepsController],
  providers: [SalesRepsService],
  exports: [SalesRepsService],
})
export class SalesRepsModule {}

