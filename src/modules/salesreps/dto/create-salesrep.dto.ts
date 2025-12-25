import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEmail, IsMongoId, ValidateIf } from 'class-validator';

export class CreateSalesRepDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string; // Required: SR belongs to a company

  @IsString()
  @IsOptional()
  phone?: string;

  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

