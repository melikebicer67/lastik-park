import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import sql from 'mssql';
import { SettingsService } from '../settings/settings.service.js';
import { LogoConnectionConfig, toMssqlConfig } from './logo-connection.config.js';
import { logoTables, LogoTables } from './logo-tables.js';

// Ayarlar her istekte okunur; bağlantı bilgisi değiştiyse havuz yeniden kurulur.
// Böylece demoda ayar kaydedildiği anda gerçek LOGO verisine geçilir.
@Injectable()
export class LogoConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(LogoConnectionService.name);
  private poolKey?: string;
  private poolPromise?: Promise<sql.ConnectionPool>;

  constructor(private readonly settings: SettingsService) {}

  async get(): Promise<{ pool: sql.ConnectionPool; tables: LogoTables }> {
    const { source: _source, ...config } = await this.settings.getLogoConfig();
    const key = JSON.stringify(config);

    if (key !== this.poolKey || !this.poolPromise) {
      const previous = this.poolPromise;
      this.poolKey = key;
      this.poolPromise = new sql.ConnectionPool(toMssqlConfig(config)).connect();
      this.poolPromise.catch(() => {
        // Başarısız bağlantı bir sonraki istekte yeniden denensin
        if (this.poolKey === key) {
          this.poolKey = undefined;
          this.poolPromise = undefined;
        }
      });
      previous?.then((p) => p.close()).catch(() => undefined);
      this.logger.log(`LOGO bağlantısı: ${config.server}/${config.database} firma ${config.firmNo}`);
    }

    try {
      return { pool: await this.poolPromise, tables: logoTables(config.firmNo, config.periodNo) };
    } catch (err) {
      throw new ServiceUnavailableException(`LOGO veritabanına bağlanılamadı: ${(err as Error).message}`);
    }
  }

  // Kaydetmeden önce bağlantıyı dener ve beklenen tabloların varlığını kontrol eder
  async test(config: LogoConnectionConfig) {
    const started = Date.now();
    const tables = logoTables(config.firmNo, config.periodNo);
    const pool = new sql.ConnectionPool(toMssqlConfig(config));
    try {
      await pool.connect();
      const version = await pool.request().query<{ v: string }>('SELECT @@VERSION AS v');
      const check = async (name: string, where = '') => {
        const exists = await pool
          .request()
          .input('name', sql.NVarChar, name)
          .query<{ id: number | null }>('SELECT OBJECT_ID(@name) AS id');
        if (exists.recordset[0].id === null) return { name, exists: false, rowCount: 0 };
        const count = await pool.request().query<{ c: number }>(
          `SELECT COUNT(*) AS c FROM ${name} WITH (NOLOCK) ${where}`,
        );
        return { name, exists: true, rowCount: count.recordset[0].c };
      };
      return {
        ok: true,
        durationMs: Date.now() - started,
        serverVersion: version.recordset[0].v.split('\n')[0].trim(),
        tables: {
          customers: await check(tables.customers),
          salesmen: await check(tables.salesmen, `WHERE FIRMNR = ${Number(tables.firmNo)}`),
          personnel: await check(tables.personnel),
        },
      };
    } catch (err) {
      return { ok: false, durationMs: Date.now() - started, error: (err as Error).message };
    } finally {
      await pool.close().catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    await this.poolPromise?.then((p) => p.close()).catch(() => undefined);
  }
}
