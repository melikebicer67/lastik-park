import { customerSearchKey, foldSearch } from './search.js';

describe('foldSearch', () => {
  it('Türkçe harfleri ve büyük/küçük farkını yok sayar', () => {
    expect(foldSearch('AÇIKGÖZ OTOMOTİV')).toBe(foldSearch('açıkgöz otomotiv'));
    expect(foldSearch('IŞIK')).toBe('isik');
    expect(foldSearch('İsmail')).toBe('ismail');
  });

  it('telefon boşluklarını atar', () => {
    const key = customerSearchKey({ name: 'Acun Yorulmaz', phone: '0532 210 90 71' });
    expect(key).toContain(foldSearch('0532 210'));
    expect(key).toContain(foldSearch('yorulmaz'));
  });
});
