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

export interface Vehicle {
  id: number;
  customerId: number;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
}

export interface Customer {
  id: number;
  logoRef: number | null;
  logoCode: string | null;
  name: string;
  isPerson: boolean;
  phone: string | null;
  email: string | null;
  city: string | null;
  vehicles: Vehicle[];
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  branch: string;
}

export interface StorageLocation {
  id: number;
  code: string;
  capacity: number;
  occupied: number;
}

export type Season = "SUMMER" | "WINTER" | "ALL_SEASON";
export type RimType = "NONE" | "STEEL" | "ALLOY";
export type TirePosition = "FRONT_LEFT" | "FRONT_RIGHT" | "REAR_LEFT" | "REAR_RIGHT" | "SPARE" | "OTHER";
export type TireCondition = "GOOD" | "WORN" | "DAMAGED";

export interface Tire {
  id: number;
  position: TirePosition;
  brand: string;
  pattern: string | null;
  width: number;
  aspectRatio: number;
  rimDiameter: string;
  loadIndex: number | null;
  speedIndex: string | null;
  dot: string | null;
  treadDepthMm: string | null;
  condition: TireCondition;
}

export interface TireSetDetail {
  id: number;
  code: string;
  season: Season;
  status: TireSetStatus;
  rimType: RimType;
  quantity: number;
  hasHubcaps: boolean;
  hasBolts: boolean;
  note: string | null;
  createdAt: string;
  customer: Omit<Customer, "vehicles">;
  vehicle: Vehicle | null;
  tires: Tire[];
  currentLocation: (StorageLocation & { warehouse: { name: string; branch: { name: string } } }) | null;
  stays: {
    id: number;
    checkInAt: string;
    checkOutAt: string | null;
    seasonLabel: string | null;
    mileageKm: number | null;
    price: string | null;
    checkInBy: { name: string } | null;
    checkOutBy: { name: string } | null;
  }[];
}

export type TireSetStatus = "IN_STORAGE" | "DELIVERED" | "DISPOSED";

export interface TireSetListItem {
  id: number;
  code: string;
  status: TireSetStatus;
  season: Season;
  rimType: RimType;
  quantity: number;
  location: string | null;
  warehouse: string | null;
  customer: { id: number; name: string; phone: string | null };
  vehicle: { plate: string; brand: string | null; model: string | null } | null;
  tire: { brand: string; pattern: string | null; width: number; aspectRatio: number; rimDiameter: string } | null;
  checkInAt: string;
  checkOutAt: string | null;
}

export interface WarehouseMap {
  warehouse: { id: number; name: string; branch: string };
  summary: { locations: number; capacity: number; occupied: number; free: number };
  locations: {
    id: number;
    code: string;
    aisle: string | null;
    rack: string | null;
    level: string | null;
    capacity: number;
    sets: { id: number; code: string; season: Season; customer: string; plate: string | null }[];
  }[];
}
