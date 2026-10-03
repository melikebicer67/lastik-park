import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decrypt, encrypt } from '../common/crypto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LogoConnectionConfig } from '../logo/logo-connection.config.js';
import { normalizeFirmNo, normalizePeriodNo } from '../logo/logo-tables.js';
import { LogoSettingsDto } from './logo-settings.dto.js';

const SETTINGS_ID = 1;

export type LogoConfigSource = 'db' | 'env';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get secret(): string {
    return this.config.getOrThrow<string>('APP_SECRET');
  }

  // Ayarlar ekranından kaydedilmiş bağlantı varsa onu, yoksa .env'deki varsayılanı döner
  async getLogoConfig(): Promise<LogoConnectionConfig & { source: LogoConfigSource }> {
    const row = await this.prisma.logoSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (row) {
      return {
        source: 'db',
        server: row.server,
        port: row.port,
        database: row.database,
        user: row.user,
        password: decrypt(row.passwordEncrypted, this.secret),
        firmNo: row.firmNo,
        periodNo: row.periodNo,
        encrypt: row.encrypt,
      };
    }
    const env = (key: string, fallback = '') => this.config.get<string>(key) ?? fallback;
    return {
      source: 'env',
      server: env('LOGO_SERVER', 'localhost'),
      port: Number(env('LOGO_PORT', '1433')),
      database: env('LOGO_DATABASE'),
      user: env('LOGO_USER'),
      password: env('LOGO_PASSWORD'),
      firmNo: normalizeFirmNo(env('LOGO_FIRM_NO', '001')),
      periodNo: normalizePeriodNo(env('LOGO_PERIOD_NO', '01')),
      encrypt: env('LOGO_ENCRYPT') === 'true',
    };
  }

  async getLogoSettingsPublic() {
    const { password, ...rest } = await this.getLogoConfig();
    return { ...rest, hasPassword: password.length > 0 };
  }

  // Formdan gelen ayarı tam bağlantı bilgisine çevirir; şifre boşsa kayıtlı olanı kullanır
  async resolveLogoConfig(dto: LogoSettingsDto): Promise<LogoConnectionConfig> {
    let password = dto.password ?? '';
    if (!password) {
      password = (await this.getLogoConfig()).password;
    }
    if (!password) {
      throw new BadRequestException('Şifre girilmeli');
    }
    return {
      server: dto.server.trim(),
      port: dto.port,
      database: dto.database,
      user: dto.user.trim(),
      password,
      firmNo: normalizeFirmNo(dto.firmNo),
      periodNo: normalizePeriodNo(dto.periodNo),
      encrypt: dto.encrypt ?? false,
    };
  }

  async saveLogoSettings(dto: LogoSettingsDto) {
    const c = await this.resolveLogoConfig(dto);
    const data = {
      server: c.server,
      port: c.port,
      database: c.database,
      user: c.user,
      passwordEncrypted: encrypt(c.password, this.secret),
      firmNo: c.firmNo,
      periodNo: c.periodNo,
      encrypt: c.encrypt,
    };
    await this.prisma.logoSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
    return this.getLogoSettingsPublic();
  }

  // Kayıtlı bağlantıyı siler, .env'deki varsayılana (sahte veritabanı) döner. Demo sonrası için.
  async resetLogoSettings() {
    await this.prisma.logoSettings.deleteMany({ where: { id: SETTINGS_ID } });
    return this.getLogoSettingsPublic();
  }
}
