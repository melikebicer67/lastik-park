"use client";

import { useCallback, useEffect, useState } from "react";
import { QrScanner } from "./qr-scanner";
import { errorBox, input, primaryButton } from "./ui/styles";
import { api, Paged, TireSetListItem } from "@/lib/api";
import { formatPlate, formatTireSize, SEASON_LABELS, SEASON_STYLES } from "@/lib/tire";

const CODE_PATTERN = /^LP-\d{4}-\d{6}$/i;

// Depodaki bir takımı seçtirir: QR, etiket numarası (Enter), plaka veya müşteri adı ile
export function TireSetPicker({ onPick }: { onPick: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; items: TireSetListItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    api<Paged<TireSetListItem>>(`/tire-sets?status=IN_STORAGE&pageSize=8&search=${encodeURIComponent(query)}`)
      .then((d) => !cancelled && (setResults({ q: query, items: d.items }), setError(null)))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const openCode = useCallback(
    async (text: string) => {
      const code = text.trim();
      if (!CODE_PATTERN.test(code)) {
        setSearch(code);
        return;
      }
      try {
        onPick((await api<{ id: number }>(`/tire-sets/by-code/${encodeURIComponent(code)}`)).id);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [onPick],
  );

  const onScan = useCallback(
    (text: string) => {
      setScanning(false);
      openCode(text);
    },
    [openCode],
  );

  const items = query.length >= 2 && results?.q === query ? results.items : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          autoFocus
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (items?.length === 1) onPick(items[0].id);
            else openCode(search);
          }}
          placeholder="Etiket no, plaka veya müşteri adı"
          className={`${input} py-3 text-base`}
        />
        <button type="button" onClick={() => setScanning(true)} className={`${primaryButton} shrink-0`}>
          QR okut
        </button>
      </div>
      {error && <div className={errorBox}>{error}</div>}
      {items && items.length === 0 && <p className="text-sm text-zinc-500">Depoda eşleşen takım yok.</p>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPick(t.id)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="w-16 shrink-0 rounded bg-ink px-1.5 py-1 text-center font-mono text-xs font-bold text-white">
                  {t.location}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mr-2 font-mono font-bold">{t.vehicle ? formatPlate(t.vehicle.plate) : "—"}</span>
                  <span className="font-medium">{t.customer.name}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {t.tire ? `${t.tire.brand} · ${formatTireSize(t.tire)}` : ""} · {t.code}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEASON_STYLES[t.season]}`}>
                  {SEASON_LABELS[t.season]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {scanning && <QrScanner onResult={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
