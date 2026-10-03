export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("API'ye ulaşılamadı. Sunucu çalışıyor mu?");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new ApiError(message ?? `İstek başarısız (${res.status})`);
  }
  return body as T;
}

export interface LogoSettings {
  source: "db" | "env";
  server: string;
  port: number;
  database: string;
  user: string;
  firmNo: string;
  periodNo: string;
  encrypt: boolean;
  hasPassword: boolean;
}

export interface TableCheck {
  name: string;
  exists: boolean;
  rowCount: number;
}

export interface ConnectionTestResult {
  ok: boolean;
  durationMs: number;
  serverVersion?: string;
  error?: string;
  tables?: { customers: TableCheck; salesmen: TableCheck; personnel: TableCheck };
}

export interface LogoCustomer {
  logoRef: number;
  code: string;
  name: string;
  isPerson: boolean;
  tckn: string;
  taxNr: string;
  taxOffice: string;
  phone: string;
  email: string;
  city: string;
  town: string;
  active: boolean;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogoSalesman {
  logoRef: number;
  code: string;
  name: string;
  position: string;
  phone: string;
  active: boolean;
}

export interface LogoPerson {
  logoRef: number;
  code: string;
  firstName: string;
  lastName: string;
  active: boolean;
}
