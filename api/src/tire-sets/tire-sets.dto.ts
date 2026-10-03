import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
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
import { RimType, Season, TireCondition, TirePosition, TireSetStatus } from '../generated/prisma/enums.js';

export class TireInputDto {
  @IsEnum(TirePosition)
  position: TirePosition;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsOptional()
  @IsString()
  pattern?: string;

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
  @Min(50)
  @Max(130)
  loadIndex?: number;

  @IsOptional()
  @Matches(/^[A-Z]{1,2}$/, { message: 'Hız endeksi harf olmalı (örn. V)' })
  speedIndex?: string;

  // Üretim haftası + yılı: 2423 = 2023'ün 24. haftası
  @IsOptional()
  @Matches(/^(0[1-9]|[1-4]\d|5[0-3])\d{2}$/, { message: 'DOT 4 haneli olmalı (hafta+yıl, örn. 2423)' })
  dot?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(20)
  treadDepthMm?: number;

  @IsOptional()
  @IsEnum(TireCondition)
  condition?: TireCondition;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CheckInDto {
  @Type(() => Number)
  @IsInt()
  customerId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;

  @IsEnum(Season)
  season: Season;

  @IsEnum(RimType)
  rimType: RimType;

  @IsOptional()
  @IsBoolean()
  hasHubcaps?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBolts?: boolean;

  @Type(() => Number)
  @IsInt()
  locationId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileageKm?: number;

  @IsOptional()
  @IsString()
  seasonLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @ValidateNested({ each: true })
  @Type(() => TireInputDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  tires: TireInputDto[];
}

export class TireSetQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TireSetStatus)
  status?: TireSetStatus;

  @IsOptional()
  @IsEnum(Season)
  season?: Season;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize = 25;
}
