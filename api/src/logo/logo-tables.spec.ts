import { logoTables } from './logo-tables.js';

describe('logoTables', () => {
  it('firma ve dönem numarasını sıfırla doldurur', () => {
    const t = logoTables('1', '1');
    expect(t.customers).toBe('LG_001_CLCARD');
    expect(t.personnel).toBe('LH_001_PERSON');
    expect(t.periodNo).toBe('01');
  });

  it('tablo adına SQL enjekte edilmesini engeller', () => {
    expect(() => logoTables('1; DROP TABLE x', '01')).toThrow();
    expect(() => logoTables('001', '1a')).toThrow();
    expect(() => logoTables('1000', '01')).toThrow();
  });
});
