"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QrScanner } from "@/components/qr-scanner";
import { Choice } from "@/components/ui/section";
import { errorBox, input, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api, Paged, TireSetListItem } from "@/lib/api";
import { daysSince, formatPlate, formatTireSize, SEASON_LABELS, SEASON_STYLES } from "@/lib/tire";

const PAGE_SIZE = 30;
const CODE_PATTERN = /^LP-\d{4}-\d{6}$/i;

const STATUS_FILTERS = { IN_STORAGE: "Depoda", DELIVERED: "Teslim edilenler", ALL: "Tümü" } as const;
const SEASON_FILTERS = { ALL: "Tüm mevsimler", ...SEASON_LABELS } as const;

export default function TireSetsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<keyof typeof STATUS_FILTERS>("IN_STORAGE");
  const [season, setSeason] = useState<keyof typeof SEASON_FILTERS>("ALL");
  const [page, setPage] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ key: string; data?: Paged<TireSetListItem>; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (query) params.set("search", query);
  if (status !== "ALL") params.set("status", status);
  if (season !== "ALL") params.set("season", season);
  const key = params.toString();

  useEffect(() => {
    let cancelled = false;
    api<Paged<TireSetListItem>>(`/tire-sets?${key}`)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult((r) => ({ key, data: r?.data, error: e.message })));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Etiket numarası (QR veya el tipi okuyucu) gelirse doğrudan takıma git
  const openCode = useCallback(
    async (text: string) => {
      const code = text.trim();
      if (!CODE_PATTERN.test(code)) {
        setSearch(code);
        return;
      }
      try {
        const set = await api<{ id: number }>(`/tire-sets/by-code/${encodeURIComponent(code)}`);
        router.push(`/takim/${set.id}`);
      } catch (e) {
        setNotice((e as Error).message);
      }
    },
    [router],
  );

  const onScan = useCallback(
    (text: string) => {
      setScanning(false);
      openCode(text);
    },
    [openCode],
  );

  const data = result?.data;
  const loading = result?.key !== key;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Lastik Bul</h1>
          <p className="text-sm text-zinc-500">Plaka, müşteri, telefon, marka, göz veya etiket numarasıyla arayın</p>
        </div>
        <div className="flex gap-2">
          <Link href="/etiketler" className={secondaryButton}>
            Etiketler
          </Link>
          <button type="button" onClick={() => setScanning(true)} className={primaryButton}>
            QR okut
          </button>
        </div>
      </div>

      <input
        autoFocus
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setNotice(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && openCode(search)}
        placeholder="Örn. 67 ABC 123, Yılmaz, 0532…, Michelin, B-04-2, LP-2026-000123"
        className={`${input} py-3 text-base`}
      />

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Choice
          value={status}
          options={STATUS_FILTERS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <Choice
          value={season}
          options={SEASON_FILTERS}
          onChange={(v) => {
            setSeason(v);
            setPage(1);
          }}
        />
      </div>

      {notice && <div className={errorBox}>{notice}</div>}
      {result?.error && <div className={errorBox}>{result.error}</div>}

      <div className={`space-y-2 ${loading ? "opacity-50" : ""}`}>
        {data?.items.map((t) => <Row key={t.id} item={t} />)}
        {data && data.items.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Kayıt bulunamadı
          </p>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{data.total} takım</span>
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

      {scanning && <QrScanner onResult={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}

function Row({ item: t }: { item: TireSetListItem }) {
  const inStorage = t.status === "IN_STORAGE";
  const days = daysSince(t.checkInAt);
  return (
    <Link
      href={`/takim/${t.id}`}
      className="flex items-stretch gap-4 rounded-lg border border-zinc-200 p-3 transition hover:border-brand hover:shadow-sm dark:border-zinc-800"
    >
      <div
        className={`flex w-24 shrink-0 flex-col items-center justify-center rounded-md px-2 py-2 text-center ${
          inStorage ? "bg-ink text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
        }`}
      >
        <span className="text-[10px] uppercase tracking-wide opacity-70">{inStorage ? "Göz" : "Durum"}</span>
        <span className={inStorage ? "font-mono text-lg font-bold leading-tight" : "text-xs font-semibold"}>
          {inStorage ? t.location : "Teslim edildi"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          {t.vehicle && <span className="font-mono text-base font-bold">{formatPlate(t.vehicle.plate)}</span>}
          <span className="truncate font-medium">{t.customer.name}</span>
        </div>
        <div className="truncate text-sm text-zinc-500">
          {[t.vehicle && [t.vehicle.brand, t.vehicle.model].filter(Boolean).join(" "), t.tire && `${t.tire.brand} ${t.tire.pattern ?? ""}`.trim(), t.tire && formatTireSize(t.tire)]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="mt-1 font-mono text-xs text-zinc-400">{t.code}</div>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-between sm:flex">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEASON_STYLES[t.season]}`}>{SEASON_LABELS[t.season]}</span>
        <span className="text-xs text-zinc-500">
          {inStorage
            ? days === 0
              ? "Bugün geldi"
              : `${days} gündür depoda`
            : `Teslim ${t.checkOutAt ? new Date(t.checkOutAt).toLocaleDateString("tr-TR") : ""}`}
        </span>
      </div>
    </Link>
  );
}
