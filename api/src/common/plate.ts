// Türk plakası: il kodu (01-81) + 1-3 harf + 2-4 rakam. Boşluksuz, büyük harf saklanır: 34ABC123
const TR_PLATE = /^(0[1-9]|[1-7]\d|8[01])[A-Z]{1,3}\d{2,4}$/;

export function normalizePlate(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidPlate(plate: string): boolean {
  return TR_PLATE.test(plate);
}

// Ekranda okunaklı gösterim: 34ABC123 → 34 ABC 123
export function formatPlate(plate: string): string {
  const m = /^(\d{2})([A-Z]+)(\d+)$/.exec(plate);
  return m ? `${m[1]} ${m[2]} ${m[3]}` : plate;
}
