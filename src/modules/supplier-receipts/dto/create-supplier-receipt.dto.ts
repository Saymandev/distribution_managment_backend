import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class SupplierReceiptItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  dealerPrice: number;

  @IsNumber()
  @Min(0)
  tradePrice: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateSupplierReceiptDto {
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierReceiptItemDto)
  items: SupplierReceiptItemDto[];

  @IsNumber()
  @Min(0.01)
  totalValue: number;

  @IsDateString()
  @IsOptional()
  receiptDate?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
