import { IsString, IsNotEmpty, IsArray, ValidateNested, IsMongoId, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimItemDto {
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
  commissionRate: number;

  @IsNumber()
  @Min(0)
  srPayment: number;
}

export class CreateCompanyClaimDto {
  @IsString()
  @IsNotEmpty()
  claimNumber: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsMongoId()
  @IsOptional()
  paymentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimItemDto)
  items: ClaimItemDto[];

  @IsEnum(['pending', 'claimed', 'paid'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

