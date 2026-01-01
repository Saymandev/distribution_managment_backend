import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateSupplierPaymentDto {
  @IsString()
  @IsOptional()
  paymentNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(["cash", "bank", "bkash", "nagad", "rocket", "online"])
  @IsNotEmpty()
  paymentMethod: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
