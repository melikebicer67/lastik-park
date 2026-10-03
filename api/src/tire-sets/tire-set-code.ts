// Etikete basılan takım numarası: LP-2026-000123
export function tireSetCode(id: number, date = new Date()): string {
  return `LP-${date.getFullYear()}-${String(id).padStart(6, '0')}`;
}
