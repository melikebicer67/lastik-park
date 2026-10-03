import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CustomerQueryDto {
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

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includePassive = false;
}

export interface LogoCustomer {
  logoRef: number;
  code: string;
  name: string;
  isPerson: boolean;
  firstName: string;
  lastName: string;
  tckn: string;
  taxNr: string;
  taxOffice: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  city: string;
  town: string;
  specialCode: string;
  cardType: number;
  active: boolean;
}

export interface LogoSalesman {
  logoRef: number;
  code: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  active: boolean;
}

export interface LogoPerson {
  logoRef: number;
  code: string;
  firstName: string;
  lastName: string;
  active: boolean;
}
