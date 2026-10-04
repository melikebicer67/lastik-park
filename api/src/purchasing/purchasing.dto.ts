import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Season, SupplierType } from '../generated/prisma/enums.js';

export class SupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SupplierType)
  type: SupplierType;

  @IsOptional()
  @IsString()
  taxNr?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class PurchaseLineDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsEnum(Season)
  season: Season;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(400)
  width: number;

  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(95)
  aspectRatio: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(10)
  @Max(26)
  rimDiameter: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  loadIndex?: number;

  @IsOptional()
  @Matches(/^[A-Z]{1,2}$/)
  speedIndex?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  vatRate?: number;
}

export class CreatePurchaseDto {
  @Type(() => Number)
  @IsInt()
  supplierId: number;

  @IsDateString()
  purchaseDate: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdById?: number;

  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  lines: PurchaseLineDto[];
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class PurchaseQueryDto extends DateRangeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  supplierId?: number;

  @IsOptional()
  @IsEnum(SupplierType)
  type?: SupplierType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 25;
}
