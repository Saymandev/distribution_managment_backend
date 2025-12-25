import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ReturnType } from '../../../database/schemas/product-return.schema';

export class ReturnItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateProductReturnDto {
  @IsString()
  @IsNotEmpty()
  returnNumber: string;

  @IsEnum(ReturnType)
  @IsNotEmpty()
  returnType: ReturnType;

  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @IsMongoId()
  @IsOptional()
  srId?: string;

  @IsMongoId()
  @IsOptional()
  companyId?: string;

  @IsMongoId()
  @IsOptional()
  issueId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

