// Eksen için "temiz" üst sınır ve aralık: 0 / 500 B / 1 Mn / 1,5 Mn gibi
export function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { max: 1, step: 1, ticks: [0, 1] };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return { max: top, step, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}
