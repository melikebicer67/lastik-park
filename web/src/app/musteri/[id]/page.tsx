"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerHistoryTable } from "@/components/customer-history-table";
import { errorBox, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api, CustomerHistory } from "@/lib/api";
import { formatDate, formatMoney, formatPlate } from "@/lib/tire";

// Müşteri geçmişi raporu: sezon değişiminde müşteriye gösterilebilir / yazdırılabilir
export default function CustomerHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<{ id: string; data?: CustomerHistory; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<CustomerHistory>(`/customers/${id}/history`)
      .then((data) => !cancelled && setResult({ id, data }))
      .catch((e: Error) => !cancelled && setResult({ id, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (result?.error) return <div className={errorBox}>{result.error}</div>;
  const data = result?.id === id ? result.data : undefined;
  if (!data) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  const { customer: c, summary: s } = data;

  return (
    <div className="max-w-6xl space-y-5 print:max-w-none">
      <style>{`@media print { @page { size: A4; margin: 12mm; } }`}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Müşteri geçmişi</div>
          <h1 className="text-xl font-semibold">{c.name}</h1>
          <p className="text-sm text-zinc-500">
            {[c.logoCode, c.phone, c.email, c.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href={`/kabul?musteri=${c.id}`} className={secondaryButton}>
            Lastik kabul
          </Link>
          <button type="button" onClick={() => window.print()} className={primaryButton}>
            Raporu yazdır
          </button>
        </div>
        <div className="hidden text-right text-xs print:block">
          <div className="font-extrabold italic">LastikPark{process.env.NEXT_PUBLIC_DEALER_NAME ? ` · ${process.env.NEXT_PUBLIC_DEALER_NAME}` : ""}</div>
          <div>{formatDate(new Date())}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 print:grid-cols-5">
        <Stat label="Toplam kayıt" value={s.stays} />
        <Stat label="Şu an depoda" value={s.inStorage} />
        <Stat label="Ort. kalış" value={s.avgDays != null ? `${s.avgDays} gün` : "—"} />
        <Stat label="Toplam ücret" value={formatMoney(s.totalBilled)} />
        <Stat label="Ödenmemiş" value={formatMoney(s.unpaid)} warn={s.unpaid > 0} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500">Araçlar:</span>
        {data.vehicles.map((v) => (
          <span key={v.id} className="rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-700">
            <span className="font-mono font-bold">{formatPlate(v.plate)}</span>{" "}
            <span className="text-zinc-500">{[v.brand, v.model].filter(Boolean).join(" ")}</span>
          </span>
        ))}
        {s.firstCheckInAt && <span className="ml-auto text-zinc-500">İlk kayıt: {formatDate(s.firstCheckInAt)}</span>}
      </div>

      <CustomerHistoryTable items={data.items} />
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 print:border-zinc-400">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className={`text-xl font-bold ${warn ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}
