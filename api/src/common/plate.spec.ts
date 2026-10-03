import { formatPlate, isValidPlate, normalizePlate } from './plate.js';

describe('plate', () => {
  it('boşluk ve tireyi kaldırıp büyük harfe çevirir', () => {
    expect(normalizePlate('34 abc 123')).toBe('34ABC123');
    expect(normalizePlate('06-ik-4521')).toBe('06IK4521');
  });

  it('Türk plaka formatını doğrular', () => {
    expect(isValidPlate('34ABC123')).toBe(true);
    expect(isValidPlate('06A1234')).toBe(true);
    expect(isValidPlate('81ZZ99')).toBe(true);
    expect(isValidPlate('00ABC123')).toBe(false);
    expect(isValidPlate('82ABC123')).toBe(false);
    expect(isValidPlate('34ABCD123')).toBe(false);
    expect(isValidPlate('34ABC12345')).toBe(false);
  });

  it('okunaklı biçimde gösterir', () => {
    expect(formatPlate('34ABC123')).toBe('34 ABC 123');
  });
});
