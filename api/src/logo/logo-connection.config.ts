import type { config as MssqlConfig } from 'mssql';

export interface LogoConnectionConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  firmNo: string;
  periodNo: string;
  encrypt: boolean;
}

export function toMssqlConfig(c: LogoConnectionConfig): MssqlConfig {
  return {
    server: c.server,
    port: c.port,
    database: c.database,
    user: c.user,
    password: c.password,
    connectionTimeout: 8000,
    requestTimeout: 15000,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: c.encrypt, trustServerCertificate: true },
  };
}
