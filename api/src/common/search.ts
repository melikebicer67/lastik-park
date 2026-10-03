// Türkçe büyük/küçük harf ve aksan farkını yok sayan arama anahtarı.
// Postgres'in ILIKE'ı "I/ı" ve "İ/i" eşleşmesini doğru yapmadığı için arama bu anahtar üzerinden yapılır.
// Boşluk ve noktalama da atılır: "0532 210 90 71" ile "05322109071" eşleşir.
export function foldSearch(input: string): string {
  return input
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export function customerSearchKey(c: {
  name: string;
  logoCode?: string | null;
  phone?: string | null;
  taxNr?: string | null;
  tckn?: string | null;
}): string {
  return [c.name, c.logoCode, c.phone, c.taxNr, c.tckn]
    .filter(Boolean)
    .map((v) => foldSearch(v!))
    .join('|');
}
