import { Type } from "class-transformer";
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class SRIssueItemDto {
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

export class CreateSRIssueDto {
  @IsString()
  @IsOptional()
  issueNumber?: string;

  @IsMongoId()
  @IsNotEmpty()
  srId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SRIssueItemDto)
  items: SRIssueItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
