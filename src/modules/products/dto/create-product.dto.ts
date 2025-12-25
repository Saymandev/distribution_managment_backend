import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  dealerPrice: number;

  @IsNumber()
  @Min(0)
  tradePrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

