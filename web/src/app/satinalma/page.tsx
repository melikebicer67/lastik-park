"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Legend, SERIES } from "@/components/charts/legend";
import { MonthlyColumns } from "@/components/charts/monthly-columns";
import { ShareBar, SplitBars } from "@/components/charts/split-bars";
import { Choice } from "@/components/ui/section";
import { errorBox } from "@/components/ui/styles";
import { api } from "@/lib/api";
import {
  formatCompactTL,
  formatInt,
  formatTL,
  monthLabel,
  PurchaseReport,
  presetRange,
  RANGE_PRESETS,
  RangePreset,
  SUPPLIER_TYPE_LABELS,
} from "@/lib/purchasing";

export default function PurchasingReportPage() {
  const [preset, setPreset] = useState<RangePreset>("last12");
  const [result, setResult] = useState<{ key: string; data?: PurchaseReport; error?: string } | null>(null);
  const [metric, setMetric] = useState<"amount" | "quantity">("amount");

  const range = presetRange(preset);
  const key = `from=${range.from}&to=${range.to}`;

  useEffect(() => {
    let cancelled = false;
    api<PurchaseReport>(`/purchases/report?${key}`)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const r = result?.data;
  return (
    <div className={`space-y-6 ${result?.key !== key ? "opacity-60" : ""}`}>
      {/* Filtreler grafiklerin üstünde tek satırda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Choice value={preset} options={RANGE_PRESETS} onChange={setPreset} />
        <span className="text-xs text-zinc-500">
          {new Date(range.from).toLocaleDateString("tr-TR")} – {new Date(range.to).toLocaleDateString("tr-TR")} · tutarlar KDV hariç
        </span>
      </div>

      {result?.error && <div className={errorBox}>{result.error}</div>}
      {r && r.totals.purchases === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">Bu dönemde alım yok.</p>
      )}

      {r && r.totals.purchases > 0 && (
        <>
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Tek hero: ana bayi payı */}
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-xs uppercase text-zinc-500">Ana bayiden alım payı</div>
              <div className="text-5xl font-semibold tracking-tight">%{Math.round(r.share.mainAmountPct ?? 0)}</div>
              <div className="mt-3">
                <ShareBar main={r.share.amount.main} external={r.share.amount.external} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.main.color }} />
                  Ana bayi {formatCompactTL(r.share.amount.main)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.external.color }} />
                  Dış alım {formatCompactTL(r.share.amount.external)}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">Adet bazında %{Math.round(r.share.mainQuantityPct ?? 0)}</div>
            </div>
            <Stat label="Toplam alım" value={formatCompactTL(r.totals.amount)} sub={`KDV dahil ${formatCompactTL(r.totals.amountWithVat)}`} />
            <Stat label="Dış alım" value={formatCompactTL(r.share.amount.external)} sub={`${r.share.purchases.external} alım · ${formatInt(r.share.quantity.external)} adet`} />
            <Stat label="Toplam adet" value={formatInt(r.totals.quantity)} sub={`${r.totals.purchases} alım`} />
          </div>

          <Card
            title="Aylık alım"
            right={
              <div className="flex flex-wrap items-center gap-4">
                <Legend />
                <Choice value={metric} options={{ amount: "Tutar", quantity: "Adet" }} onChange={setMetric} />
              </div>
            }
          >
            <MonthlyColumns
              data={r.monthly.map((m) => ({
                key: m.month,
                label: monthLabel(m.month, false),
                title: monthLabel(m.month),
                main: m[metric].main,
                external: m[metric].external,
              }))}
              format={metric === "amount" ? formatTL : (n) => `${formatInt(n)} adet`}
              formatAxis={metric === "amount" ? formatCompactTL : formatInt}
            />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-zinc-500">Tablo olarak göster</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="py-1 text-left">Ay</th>
                      <th>Ana bayi (₺)</th>
                      <th>Dış alım (₺)</th>
                      <th>Ana bayi (adet)</th>
                      <th>Dış alım (adet)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.monthly.map((m) => (
                      <tr key={m.month} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-1 text-left">{monthLabel(m.month)}</td>
                        <td>{formatInt(m.amount.main)}</td>
                        <td>{formatInt(m.amount.external)}</td>
                        <td>{formatInt(m.quantity.main)}</td>
                        <td>{formatInt(m.quantity.external)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Markaya göre adet" right={<Legend />}>
              <SplitBars data={r.byBrand.map((b) => ({ label: b.brand, ...b.quantity }))} format={formatInt} unit="adet" />
            </Card>
            <Card title="En çok alınan ebatlar" right={<Legend />}>
              <SplitBars data={r.bySize.map((z) => ({ label: z.size, ...z.quantity }))} format={formatInt} unit="adet" />
            </Card>
          </div>

          <Card title="Fiyat karşılaştırma" right={<span className="text-xs text-zinc-500">Aynı marka ve ebat, adet ağırlıklı ortalama birim fiyat</span>}>
            {r.priceComparison.length === 0 ? (
              <p className="text-sm text-zinc-500">Bu dönemde hem ana bayiden hem dışarıdan alınan aynı marka/ebat yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="py-2 pr-3">Marka / ebat</th>
                      <th className="py-2 pr-3 text-right">Ana bayi</th>
                      <th className="py-2 pr-3 text-right">Dış ort.</th>
                      <th className="py-2 pr-3">En ucuz dış</th>
                      <th className="py-2 text-right">Fark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.priceComparison.map((p) => {
                      const cheaper = p.diffPct < 0;
                      return (
                        <tr key={p.brand + p.size} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="py-2 pr-3">
                            <span className="font-medium">{p.brand}</span> <span className="font-mono text-xs text-zinc-500">{p.size}</span>
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {formatTL(p.mainAvg)} <span className="text-xs text-zinc-500">({p.mainQty})</span>
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {formatTL(p.externalAvg)} <span className="text-xs text-zinc-500">({p.externalQty})</span>
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {formatTL(p.externalMin)} · <span className="text-zinc-500">{p.externalMinSupplier}</span>
                          </td>
                          <td className="py-2 text-right text-xs font-semibold whitespace-nowrap">
                            <span className={cheaper ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                              {cheaper ? "▼" : "▲"} %{Math.abs(p.diffPct).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
                            </span>{" "}
                            <span className="font-normal text-zinc-500">{cheaper ? "dışarısı ucuz" : "dışarısı pahalı"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Tedarikçiler" right={<Link href="/satinalma/tedarikciler" className="text-xs font-semibold text-brand hover:underline">Tümü →</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3">Tedarikçi</th>
                    <th className="py-2 pr-3 text-right">Alım</th>
                    <th className="py-2 pr-3 text-right">Adet</th>
                    <th className="py-2 pr-3 text-right">Tutar</th>
                    <th className="w-1/4 py-2 pr-3">Pay</th>
                    <th className="py-2">Son alım</th>
                  </tr>
                </thead>
                <tbody>
                  {r.bySupplier.map((s) => {
                    const pct = (s.amount / r.totals.amount) * 100;
                    const series = s.type === "MAIN_DEALER" ? SERIES.main : SERIES.external;
                    return (
                      <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 pr-3">
                          <Link href={`/satinalma/alimlar?tedarikci=${s.id}`} className="font-medium hover:text-brand">
                            {s.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <span className="h-2 w-2 rounded-sm" style={{ background: series.color }} />
                            {SUPPLIER_TYPE_LABELS[s.type]}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{s.purchases}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatInt(s.quantity)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatTL(s.amount)}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 flex-1">
                              <div className="h-full rounded-r-[4px]" style={{ width: `${pct}%`, background: series.color }} />
                            </div>
                            <span className="w-12 text-right text-xs tabular-nums">%{pct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span>
                          </div>
                        </td>
                        <td className="py-2 text-xs text-zinc-500">{new Date(s.lastDate).toLocaleDateString("tr-TR")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
