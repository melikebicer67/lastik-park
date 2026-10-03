import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class LogoSettingsDto {
  @IsString()
  @IsNotEmpty()
  server: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @Matches(/^[A-Za-z0-9_\-]+$/, { message: 'Veritabanı adı geçersiz' })
  database: string;

  @IsString()
  @IsNotEmpty()
  user: string;

  // Boş bırakılırsa kayıtlı şifre korunur
  @IsOptional()
  @IsString()
  password?: string;

  @Matches(/^\d{1,3}$/, { message: 'Firma numarası 1-3 haneli olmalı' })
  firmNo: string;

  @Matches(/^\d{1,2}$/, { message: 'Dönem numarası 1-2 haneli olmalı' })
  periodNo: string;

  @IsOptional()
  @IsBoolean()
  encrypt?: boolean;
}
