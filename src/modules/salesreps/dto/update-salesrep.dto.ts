import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesRepDto } from './create-salesrep.dto';

export class UpdateSalesRepDto extends PartialType(CreateSalesRepDto) {}

