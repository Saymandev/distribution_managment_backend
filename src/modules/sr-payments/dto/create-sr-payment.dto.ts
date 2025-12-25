import { IsString, IsNotEmpty, IsArray, ValidateNested, IsMongoId, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SRPaymentItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  dealerPrice: number;

  @IsNumber()
  @Min(0)
  tradePrice: number;
}

export class CreateSRPaymentDto {
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  srId: string;

  @IsMongoId()
  @IsOptional()
  issueId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SRPaymentItemDto)
  items: SRPaymentItemDto[];

  @IsEnum(['cash', 'bank', 'bkash', 'nagad', 'rocket'])
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

