// LOGO tablo adları firma ve dönem numarasını içerir (LG_001_CLCARD, LG_001_01_CLFLINE ...).
// Bu adlar sorguya parametre olarak verilemediği için burada doğrulanarak üretilir.
export interface LogoTables {
  firmNo: string;
  periodNo: string;
  customers: string;
  salesmen: string;
  personnel: string;
}

export function normalizeFirmNo(firmNo: string): string {
  if (!/^\d{1,3}$/.test(firmNo)) {
    throw new Error(`Geçersiz firma numarası: ${firmNo}`);
  }
  return firmNo.padStart(3, '0');
}

export function normalizePeriodNo(periodNo: string): string {
  if (!/^\d{1,2}$/.test(periodNo)) {
    throw new Error(`Geçersiz dönem numarası: ${periodNo}`);
  }
  return periodNo.padStart(2, '0');
}

export function logoTables(firmNo: string, periodNo: string): LogoTables {
  const firm = normalizeFirmNo(firmNo);
  const period = normalizePeriodNo(periodNo);
  return {
    firmNo: firm,
    periodNo: period,
    customers: `LG_${firm}_CLCARD`,
    salesmen: 'LG_SLSMAN',
    personnel: `LH_${firm}_PERSON`,
  };
}
