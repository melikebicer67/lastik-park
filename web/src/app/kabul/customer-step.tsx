"use client";

import { useEffect, useState } from "react";
import { api, Customer, LogoCustomer, Paged } from "@/lib/api";
import { errorBox, input, secondaryButton } from "@/components/ui/styles";

// LOGO carilerinde arar; seçilen cari uygulamaya alınır (yerel Customer kaydı)
export function CustomerStep({ customer, onSelect }: { customer: Customer | null; onSelect: (c: Customer | null) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ q: string; items: LogoCustomer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<number | null>(null);

  const q = search.trim();

  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<Paged<LogoCustomer>>(`/logo/customers?pageSize=8&search=${encodeURIComponent(q)}`)
        .then((d) => !cancelled && (setResults({ q, items: d.items }), setError(null)))
        .catch((e: Error) => !cancelled && setError(e.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const pick = async (c: LogoCustomer) => {
    setImporting(c.logoRef);
    setError(null);
    try {
      onSelect(await api<Customer>(`/customers/from-logo/${c.logoRef}`, { method: "POST" }));
      setSearch("");
      setResults(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(null);
    }
  };

  if (customer) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-zinc-500">
            {[customer.logoCode, customer.phone, customer.city].filter(Boolean).join(" · ")}
          </div>
        </div>
        <button type="button" onClick={() => onSelect(null)} className={secondaryButton}>
          Değiştir
        </button>
      </div>
    );
  }

  const items = q.length >= 2 && results?.q === q ? results.items : null;

  return (
    <div className="space-y-3">
      <input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Müşteri adı, cari kodu, telefon veya VKN/TCKN ile ara"
        className={input}
      />
      {error && <div className={errorBox}>{error}</div>}
      {items && items.length === 0 && <p className="text-sm text-zinc-500">{"LOGO'da eşleşen cari bulunamadı."}</p>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((c) => (
            <li key={c.logoRef}>
              <button
                type="button"
                onClick={() => pick(c)}
                disabled={importing !== null}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-900"
              >
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-xs text-zinc-500">
                    {[c.code, c.phone, c.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {importing === c.logoRef ? <span className="text-xs">Alınıyor…</span> : !c.active && <span className="text-xs text-zinc-400">Pasif</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
