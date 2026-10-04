"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SERIES } from "@/components/charts/legend";
import { Choice } from "@/components/ui/section";
import { errorBox, input, secondaryButton } from "@/components/ui/styles";
import { api, Paged } from "@/lib/api";
import { formatInt, formatTL, presetRange, PurchaseListItem, RANGE_PRESETS, RangePreset, Supplier } from "@/lib/purchasing";

export default function PurchasesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Yükleniyor…</p>}>
      <Purchases />
    </Suspense>
  );
}

const TYPE_FILTERS = { ALL: "Tümü", MAIN_DEALER: "Ana bayi", EXTERNAL: "Dış alım" } as const;

function Purchases() {
  const initialSupplier = Number(useSearchParams().get("tedarikci")) || null;
  const [preset, setPreset] = useState<RangePreset>("last12");
  const [type, setType] = useState<keyof typeof TYPE_FILTERS>("ALL");
  const [supplierId, setSupplierId] = useState<number | null>(initialSupplier);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: Paged<PurchaseListItem>; error?: string } | null>(null);

  useEffect(() => {
    api<Supplier[]>("/suppliers").then(setSuppliers).catch(() => undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const range = presetRange(preset);
  const params = new URLSearchParams({ from: range.from, to: range.to, page: String(page), pageSize: "25" });
  if (type !== "ALL") params.set("type", type);
  if (supplierId) params.set("supplierId", String(supplierId));
  if (query) params.set("search", query);
  const key = params.toString();

  useEffect(() => {
    let cancelled = false;
    api<Paged<PurchaseListItem>>(`/purchases?${key}`)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const data = result?.data;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const sum = data?.items.reduce((n, p) => n + p.amount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Choice value={preset} options={RANGE_PRESETS} onChange={(v) => (setPreset(v), setPage(1))} />
        <Choice value={type} options={TYPE_FILTERS} onChange={(v) => (setType(v), setPage(1))} />
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={supplierId ?? ""}
          onChange={(e) => (setSupplierId(Number(e.target.value) || null), setPage(1))}
          className={`${input} max-w-xs`}
        >
          <option value="">Tüm tedarikçiler</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Belge no, tedarikçi, marka veya desen"
          className={`${input} max-w-sm`}
        />
      </div>

      {result?.error && <div className={errorBox}>{result.error}</div>}

      <div className={`overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 ${result?.key !== key ? "opacity-50" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Tedarikçi</th>
              <th className="px-3 py-2">Belge no</th>
              <th className="px-3 py-2">Markalar</th>
              <th className="px-3 py-2 text-right">Adet</th>
              <th className="px-3 py-2 text-right">Tutar (KDV hariç)</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                <td className="whitespace-nowrap px-3 py-2">
                  <Link href={`/satinalma/alim/${p.id}`} className="font-medium hover:text-brand">
                    {new Date(p.purchaseDate).toLocaleDateString("tr-TR")}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: p.supplier.type === "MAIN_DEALER" ? SERIES.main.color : SERIES.external.color }}
                      title={p.supplier.type === "MAIN_DEALER" ? "Ana bayi" : "Dış alım"}
                    />
                    {p.supplier.name}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{p.documentNo ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{p.brands.join(", ")}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatInt(p.quantity)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatTL(p.amount)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                  Alım bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            {data.total} alım · bu sayfa {formatTL(sum)}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={secondaryButton}>
              Önceki
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} className={secondaryButton}>
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
