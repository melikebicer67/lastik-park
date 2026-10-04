// Satın alma raporu: ana bayi / dış alım oranı, aylık dağılım, tedarikçi, marka, ebat ve fiyat karşılaştırması.
// Saf fonksiyon; veritabanından bağımsız test edilir.

export type SupplierKind = 'MAIN_DEALER' | 'EXTERNAL';

export interface ReportLine {
  date: Date;
  purchaseId: number;
  supplierId: number;
  supplierName: string;
  supplierType: SupplierKind;
  brand: string;
  pattern: string | null;
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  quantity: number;
  unitPrice: number; // KDV hariç
  vatRate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const sizeOf = (l: Pick<ReportLine, 'width' | 'aspectRatio' | 'rimDiameter'>) =>
  `${l.width}/${l.aspectRatio} R${l.rimDiameter}`;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

function monthsBetween(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (d <= to) {
    out.push(monthKey(d));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export interface Split {
  main: number;
  external: number;
}
const emptySplit = (): Split => ({ main: 0, external: 0 });
const add = (s: Split, type: SupplierKind, v: number) => {
  if (type === 'MAIN_DEALER') s.main += v;
  else s.external += v;
};

export function buildPurchaseReport(lines: ReportLine[], from: Date, to: Date) {
  const amount = emptySplit();
  const quantity = emptySplit();
  const purchases = { main: new Set<number>(), external: new Set<number>() };
  let amountWithVat = 0;

  const monthly = new Map(monthsBetween(from, to).map((m) => [m, { amount: emptySplit(), quantity: emptySplit() }]));
  const suppliers = new Map<number, { id: number; name: string; type: SupplierKind; amount: number; quantity: number; purchases: Set<number>; lastDate: Date }>();
  const brands = new Map<string, { brand: string; quantity: Split; amount: number }>();
  const sizes = new Map<string, { size: string; quantity: Split }>();
  const prices = new Map<string, { brand: string; size: string; main: { qty: number; total: number }; external: { qty: number; total: number; min: number; minSupplier: string } }>();

  for (const l of lines) {
    const net = l.quantity * l.unitPrice;
    add(amount, l.supplierType, net);
    add(quantity, l.supplierType, l.quantity);
    (l.supplierType === 'MAIN_DEALER' ? purchases.main : purchases.external).add(l.purchaseId);
    amountWithVat += net * (1 + l.vatRate / 100);

    const m = monthly.get(monthKey(l.date));
    if (m) {
      add(m.amount, l.supplierType, net);
      add(m.quantity, l.supplierType, l.quantity);
    }

    const s = suppliers.get(l.supplierId) ?? {
      id: l.supplierId,
      name: l.supplierName,
      type: l.supplierType,
      amount: 0,
      quantity: 0,
      purchases: new Set<number>(),
      lastDate: l.date,
    };
    s.amount += net;
    s.quantity += l.quantity;
    s.purchases.add(l.purchaseId);
    if (l.date > s.lastDate) s.lastDate = l.date;
    suppliers.set(l.supplierId, s);

    const b = brands.get(l.brand) ?? { brand: l.brand, quantity: emptySplit(), amount: 0 };
    add(b.quantity, l.supplierType, l.quantity);
    b.amount += net;
    brands.set(l.brand, b);

    const size = sizeOf(l);
    const z = sizes.get(size) ?? { size, quantity: emptySplit() };
    add(z.quantity, l.supplierType, l.quantity);
    sizes.set(size, z);

    // Aynı marka + ebat: ana bayi ile dış fiyatlar adet ağırlıklı ortalamayla karşılaştırılır
    const key = `${l.brand}|${size}`;
    const p = prices.get(key) ?? {
      brand: l.brand,
      size,
      main: { qty: 0, total: 0 },
      external: { qty: 0, total: 0, min: Infinity, minSupplier: '' },
    };
    if (l.supplierType === 'MAIN_DEALER') {
      p.main.qty += l.quantity;
      p.main.total += net;
    } else {
      p.external.qty += l.quantity;
      p.external.total += net;
      if (l.unitPrice < p.external.min) {
        p.external.min = l.unitPrice;
        p.external.minSupplier = l.supplierName;
      }
    }
    prices.set(key, p);
  }

  const totalAmount = amount.main + amount.external;
  const totalQty = quantity.main + quantity.external;
  const splitOut = (s: Split) => ({ main: round2(s.main), external: round2(s.external) });

  return {
    range: { from, to },
    totals: {
      amount: round2(totalAmount),
      amountWithVat: round2(amountWithVat),
      quantity: totalQty,
      purchases: purchases.main.size + purchases.external.size,
    },
    share: {
      amount: splitOut(amount),
      quantity: splitOut(quantity),
      purchases: { main: purchases.main.size, external: purchases.external.size },
      mainAmountPct: totalAmount ? round2((amount.main / totalAmount) * 100) : null,
      mainQuantityPct: totalQty ? round2((quantity.main / totalQty) * 100) : null,
    },
    monthly: [...monthly.entries()].map(([month, v]) => ({
      month,
      amount: splitOut(v.amount),
      quantity: splitOut(v.quantity),
    })),
    bySupplier: [...suppliers.values()]
      .map((s) => ({ ...s, amount: round2(s.amount), purchases: s.purchases.size }))
      .sort((a, b) => b.amount - a.amount),
    byBrand: [...brands.values()]
      .map((b) => ({ ...b, amount: round2(b.amount) }))
      .sort((a, b) => b.quantity.main + b.quantity.external - (a.quantity.main + a.quantity.external)),
    bySize: [...sizes.values()]
      .sort((a, b) => b.quantity.main + b.quantity.external - (a.quantity.main + a.quantity.external))
      .slice(0, 12),
    priceComparison: [...prices.values()]
      .filter((p) => p.main.qty > 0 && p.external.qty > 0)
      .map((p) => {
        const mainAvg = p.main.total / p.main.qty;
        const externalAvg = p.external.total / p.external.qty;
        return {
          brand: p.brand,
          size: p.size,
          mainAvg: round2(mainAvg),
          mainQty: p.main.qty,
          externalAvg: round2(externalAvg),
          externalQty: p.external.qty,
          externalMin: round2(p.external.min),
          externalMinSupplier: p.external.minSupplier,
          diffPct: round2(((externalAvg - mainAvg) / mainAvg) * 100),
        };
      })
      .sort((a, b) => b.mainQty + b.externalQty - (a.mainQty + a.externalQty)),
  };
}
