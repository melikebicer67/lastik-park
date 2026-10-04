import type { Season } from "./api";

export type SupplierType = "MAIN_DEALER" | "EXTERNAL";

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  MAIN_DEALER: "Ana bayi",
  EXTERNAL: "Dış tedarikçi",
};

export interface Supplier {
  id: number;
  name: string;
  type: SupplierType;
  taxNr: string | null;
  phone: string | null;
  contactName: string | null;
  city: string | null;
  note: string | null;
  active: boolean;
  purchaseCount: number;
  quantity: number;
  amount: number;
  lastPurchaseDate: string | null;
}

export interface PurchaseListItem {
  id: number;
  purchaseDate: string;
  documentNo: string | null;
  supplier: { id: number; name: string; type: SupplierType };
  brands: string[];
  quantity: number;
  amount: number;
  amountWithVat: number;
}

export interface PurchaseDetail {
  id: number;
  purchaseDate: string;
  documentNo: string | null;
  note: string | null;
  supplier: Supplier;
  createdBy: { name: string } | null;
  lines: {
    id: number;
    brand: string;
    pattern: string | null;
    season: Season;
    width: number;
    aspectRatio: number;
    rimDiameter: string;
    loadIndex: number | null;
    speedIndex: string | null;
    quantity: number;
    unitPrice: string;
    vatRate: number;
  }[];
}

export interface Split {
  main: number;
  external: number;
}

export interface PurchaseReport {
  totals: { amount: number; amountWithVat: number; quantity: number; purchases: number };
  share: {
    amount: Split;
    quantity: Split;
    purchases: Split;
    mainAmountPct: number | null;
    mainQuantityPct: number | null;
  };
  monthly: { month: string; amount: Split; quantity: Split }[];
  bySupplier: { id: number; name: string; type: SupplierType; amount: number; quantity: number; purchases: number; lastDate: string }[];
  byBrand: { brand: string; quantity: Split; amount: number }[];
  bySize: { size: string; quantity: Split }[];
  priceComparison: {
    brand: string;
    size: string;
    mainAvg: number;
    mainQty: number;
    externalAvg: number;
    externalQty: number;
    externalMin: number;
    externalMinSupplier: string;
    diffPct: number;
  }[];
}

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });

export const formatTL = (n: number) => money.format(n);
export const formatCompactTL = (n: number) => `${compact.format(n)} ₺`;
export const formatInt = (n: number) => n.toLocaleString("tr-TR");

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
// "2026-03" → "Mar 26"
export function monthLabel(key: string, withYear = true) {
  const [y, m] = key.split("-");
  return withYear ? `${MONTHS[Number(m) - 1]} ${y.slice(2)}` : MONTHS[Number(m) - 1];
}

// Rapor tarih aralığı kısayolları
export const RANGE_PRESETS = {
  last12: "Son 12 ay",
  thisYear: "Bu yıl",
  last3: "Son 3 ay",
  thisMonth: "Bu ay",
} as const;
export type RangePreset = keyof typeof RANGE_PRESETS;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function presetRange(p: RangePreset, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const from =
    p === "last12" ? new Date(y, m - 11, 1) : p === "thisYear" ? new Date(y, 0, 1) : p === "last3" ? new Date(y, m - 2, 1) : new Date(y, m, 1);
  return { from: iso(from), to: iso(today) };
}
