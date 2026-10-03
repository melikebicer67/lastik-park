import { tireSetCode } from './tire-set-code.js';

describe('tireSetCode', () => {
  it('yıl ve sıfırla doldurulmuş numara üretir', () => {
    expect(tireSetCode(123, new Date('2026-10-04'))).toBe('LP-2026-000123');
  });
});
