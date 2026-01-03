import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

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

  @IsEnum(["cash", "bank", "bkash", "nagad", "rocket"])
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  receivedAmount?: number; // Actual cash received from customer

  @IsNumber()
  @Min(0)
  @IsOptional()
  companyClaim?: number; // Discount given by SR (to be claimed from company)

  @IsNumber()
  @Min(0)
  @IsOptional()
  customerDue?: number; // Remaining amount customer owes

  @IsOptional()
  customerInfo?: {
    name?: string;
    address?: string;
    phone?: string;
  };

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  @IsOptional()
  returnItems?: ReturnItemDto[];
}

export class ReturnItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  damagedQuantity: number;

  @IsNumber()
  @Min(0)
  customerReturnQuantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
