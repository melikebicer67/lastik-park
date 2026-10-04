import { buildPurchaseReport, ReportLine } from './purchase-report.js';

const line = (p: Partial<ReportLine>): ReportLine => ({
  date: new Date('2026-03-10'),
  purchaseId: 1,
  supplierId: 1,
  supplierName: 'Ana Bayi',
  supplierType: 'MAIN_DEALER',
  brand: 'Lassa',
  pattern: null,
  width: 205,
  aspectRatio: 55,
  rimDiameter: 16,
  quantity: 4,
  unitPrice: 1000,
  vatRate: 20,
  ...p,
});

describe('buildPurchaseReport', () => {
  const lines = [
    line({}),
    line({ purchaseId: 2, date: new Date('2026-04-02'), quantity: 4, unitPrice: 1100 }),
    line({ purchaseId: 3, supplierId: 2, supplierName: 'Dış A', supplierType: 'EXTERNAL', quantity: 8, unitPrice: 900 }),
    line({ purchaseId: 3, supplierId: 2, supplierName: 'Dış A', supplierType: 'EXTERNAL', brand: 'Michelin', quantity: 2, unitPrice: 2000 }),
  ];
  const r = buildPurchaseReport(lines, new Date('2026-02-01'), new Date('2026-04-30'));

  it('ana bayi payını tutar üzerinden hesaplar', () => {
    // ana: 4000 + 4400 = 8400; dış: 7200 + 4000 = 11200
    expect(r.share.amount).toEqual({ main: 8400, external: 11200 });
    expect(r.share.mainAmountPct).toBeCloseTo(42.86, 1);
    expect(r.totals.amountWithVat).toBeCloseTo(19600 * 1.2, 2);
    expect(r.share.purchases).toEqual({ main: 2, external: 1 });
  });

  it('boş ayları da listeler', () => {
    expect(r.monthly.map((m) => m.month)).toEqual(['2026-02', '2026-03', '2026-04']);
    expect(r.monthly[0].amount).toEqual({ main: 0, external: 0 });
  });

  it('aynı marka ve ebatta adet ağırlıklı fiyat karşılaştırır', () => {
    expect(r.priceComparison).toHaveLength(1); // Michelin sadece dışta, karşılaştırılmaz
    const p = r.priceComparison[0];
    expect(p.mainAvg).toBe(1050);
    expect(p.externalAvg).toBe(900);
    expect(p.diffPct).toBeCloseTo(-14.29, 1);
    expect(p.externalMinSupplier).toBe('Dış A');
  });
});
