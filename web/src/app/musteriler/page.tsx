"use client";

import { useEffect, useState } from "react";
import { api, LogoCustomer, Paged } from "@/lib/api";

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [includePassive, setIncludePassive] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: Paged<LogoCustomer>; error?: string } | null>(null);

  // Yazarken her tuşta LOGO'ya gitmemek için 300 ms bekle
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    includePassive: String(includePassive),
  });
  if (query) params.set("search", query);
  const key = params.toString();

  useEffect(() => {
    let cancelled = false;
    api<Paged<LogoCustomer>>(`/logo/customers?${key}`)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult((r) => ({ key, data: r?.data, error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Yeni sonuç gelene kadar önceki liste soluk gösterilir
  const loading = result?.key !== key;
  const data = result?.data;
  const error = result?.error;

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Müşteriler</h1>
          <p className="text-sm text-zinc-500">LOGO cari kartlarından okunur</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includePassive}
              onChange={(e) => {
                setIncludePassive(e.target.checked);
                setPage(1);
              }}
            />
            Pasifleri göster
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, kod, telefon, VKN/TCKN…"
            className="w-72 max-w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Kod</th>
              <th className="px-3 py-2">Ünvan</th>
              <th className="px-3 py-2">Tür</th>
              <th className="px-3 py-2">VKN / TCKN</th>
              <th className="px-3 py-2">Telefon</th>
              <th className="px-3 py-2">Şehir</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {data?.items.map((c) => (
              <tr key={c.logoRef} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{c.name}</div>
                  {c.email && <div className="text-xs text-zinc-500">{c.email}</div>}
                </td>
                <td className="px-3 py-2">{c.isPerson ? "Şahıs" : "Firma"}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {c.isPerson ? c.tckn : `${c.taxNr}${c.taxOffice ? ` · ${c.taxOffice}` : ""}`}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{c.phone}</td>
                <td className="px-3 py-2">{[c.city, c.town].filter(Boolean).join(" / ")}</td>
                <td className="px-3 py-2">
                  <span className={c.active ? "text-emerald-600" : "text-zinc-400"}>{c.active ? "Aktif" : "Pasif"}</span>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{data.total} kayıt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Önceki
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
