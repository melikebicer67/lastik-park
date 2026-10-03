import type { RimType, Season, TireCondition, TirePosition, TireSetStatus } from "./api";

export const SEASON_LABELS: Record<Season, string> = {
  SUMMER: "Yaz",
  WINTER: "Kış",
  ALL_SEASON: "4 Mevsim",
};

export const RIM_LABELS: Record<RimType, string> = {
  NONE: "Jantsız",
  STEEL: "Çelik jant",
  ALLOY: "Alüminyum jant",
};

export const POSITION_LABELS: Record<TirePosition, string> = {
  FRONT_LEFT: "Sol ön",
  FRONT_RIGHT: "Sağ ön",
  REAR_LEFT: "Sol arka",
  REAR_RIGHT: "Sağ arka",
  SPARE: "Stepne",
  OTHER: "Diğer",
};

export const CONDITION_LABELS: Record<TireCondition, string> = {
  GOOD: "İyi",
  WORN: "Aşınmış",
  DAMAGED: "Hasarlı",
};

export interface TireSize {
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  loadIndex?: number;
  speedIndex?: string;
}

// "205/55 R16 91V", "205 55 16", "225/45ZR17 94W" gibi yazımları çözer
export function parseTireSize(input: string): TireSize | null {
  const m = /^\s*(\d{3})\s*[/\s]\s*(\d{2})\s*Z?R?\s*(\d{2}(?:[.,]\d)?)\s*(?:(\d{2,3})\s*([A-Za-z]{1,2})?)?\s*$/i.exec(input);
  if (!m) return null;
  return {
    width: Number(m[1]),
    aspectRatio: Number(m[2]),
    rimDiameter: Number(m[3].replace(",", ".")),
    loadIndex: m[4] ? Number(m[4]) : undefined,
    speedIndex: m[5]?.toUpperCase(),
  };
}

export function formatTireSize(t: { width: number; aspectRatio: number; rimDiameter: number | string; loadIndex?: number | null; speedIndex?: string | null }) {
  const base = `${t.width}/${t.aspectRatio} R${Number(t.rimDiameter)}`;
  const load = [t.loadIndex, t.speedIndex].filter(Boolean).join("");
  return load ? `${base} ${load}` : base;
}

export function formatPlate(plate: string) {
  const m = /^(\d{2})([A-Z]+)(\d+)$/.exec(plate);
  return m ? `${m[1]} ${m[2]} ${m[3]}` : plate;
}

export const STATUS_LABELS: Record<TireSetStatus, string> = {
  IN_STORAGE: "Depoda",
  DELIVERED: "Teslim edildi",
  DISPOSED: "Hurdaya ayrıldı",
};

// Haritada ve listede mevsim rengi
export const SEASON_STYLES: Record<Season, string> = {
  SUMMER: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  WINTER: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  ALL_SEASON: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
};

export function daysSince(date: string | Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 864e5);
}

// API'deki foldSearch ile aynı: Türkçe harf ve büyük/küçük farkı, boşluk ve noktalama yok sayılır
export function foldSearch(input: string) {
  return input
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}
