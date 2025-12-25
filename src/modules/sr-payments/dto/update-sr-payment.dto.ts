import { PartialType } from '@nestjs/mapped-types';
import { CreateSRPaymentDto } from './create-sr-payment.dto';

export class UpdateSRPaymentDto extends PartialType(CreateSRPaymentDto) {}

