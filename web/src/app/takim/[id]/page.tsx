"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, TireSetDetail } from "@/lib/api";
import { CONDITION_LABELS, POSITION_LABELS, RIM_LABELS, SEASON_LABELS, STATUS_LABELS, formatPlate, formatTireSize } from "@/lib/tire";
import { errorBox, primaryButton, secondaryButton } from "@/components/ui/styles";
import { labelFromDetail, TireSetLabel } from "@/components/tire-set-label";

export default function TireSetPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<{ id: string; set?: TireSetDetail; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<TireSetDetail>(`/tire-sets/${id}`)
      .then((set) => !cancelled && setResult({ id, set }))
      .catch((e: Error) => !cancelled && setResult({ id, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (result?.error) return <div className={errorBox}>{result.error}</div>;
  const set = result?.id === id ? result.set : undefined;
  if (!set) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;

  const stay = set.stays[0];

  return (
    <div className="max-w-4xl space-y-6 print:space-y-0">
      {/* Yazdırırken sayfa boyutu etiket kadar olsun */}
      <style>{`@media print { @page { size: 100mm 60mm; margin: 0; } }`}</style>

      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-mono text-xl font-semibold">{set.code}</h1>
          <p className="text-sm text-zinc-500">
            {STATUS_LABELS[set.status]} · {set.currentLocation ? `${set.currentLocation.warehouse.name} / ${set.currentLocation.code}` : "Gözde değil"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {set.currentLocation && (
            <Link href={`/depo?goz=${set.currentLocation.code}`} className={secondaryButton}>
              Depoda göster
            </Link>
          )}
          <Link href="/kabul" className={secondaryButton}>
            Yeni kabul
          </Link>
          <button type="button" onClick={() => window.print()} className={primaryButton}>
            Etiketi yazdır
          </button>
        </div>
      </div>

      <TireSetLabel label={labelFromDetail(set)} />

      <div className="grid gap-4 md:grid-cols-2 print:hidden">
        <Info title="Müşteri">
          <div className="font-medium">{set.customer.name}</div>
          <div className="text-zinc-500">{[set.customer.logoCode, set.customer.phone].filter(Boolean).join(" · ")}</div>
          {set.vehicle && (
            <div className="mt-2 font-mono">
              {formatPlate(set.vehicle.plate)}{" "}
              <span className="font-sans text-zinc-500">{[set.vehicle.brand, set.vehicle.model].filter(Boolean).join(" ")}</span>
            </div>
          )}
        </Info>
        <Info title="Takım">
          <div>
            {SEASON_LABELS[set.season]} · {set.quantity} adet · {RIM_LABELS[set.rimType]}
          </div>
          <div className="text-zinc-500">
            {[set.hasHubcaps && "Jant kapağı", set.hasBolts && "Bijon"].filter(Boolean).join(", ") || "Ek parça yok"}
          </div>
          {stay && (
            <div className="mt-2 text-zinc-500">
              Giriş {new Date(stay.checkInAt).toLocaleString("tr-TR")}
              {stay.checkInBy ? ` · ${stay.checkInBy.name}` : ""}
              {stay.mileageKm ? ` · ${stay.mileageKm.toLocaleString("tr-TR")} km` : ""}
              {stay.price ? ` · ${Number(stay.price).toLocaleString("tr-TR")} ₺` : ""}
            </div>
          )}
          {stay?.checkOutAt && (
            <div className="text-zinc-500">
              Teslim {new Date(stay.checkOutAt).toLocaleString("tr-TR")}
              {stay.checkOutBy ? ` · ${stay.checkOutBy.name}` : ""}
            </div>
          )}
          {set.note && <div className="mt-2">Not: {set.note}</div>}
        </Info>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 print:hidden dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Konum</th>
              <th className="px-3 py-2">Marka / Desen</th>
              <th className="px-3 py-2">Ebat</th>
              <th className="px-3 py-2">DOT</th>
              <th className="px-3 py-2">Diş</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {set.tires.map((t) => (
              <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2">{POSITION_LABELS[t.position]}</td>
                <td className="px-3 py-2">{[t.brand, t.pattern].filter(Boolean).join(" ")}</td>
                <td className="px-3 py-2 font-mono">{formatTireSize(t)}</td>
                <td className="px-3 py-2 font-mono">{t.dot ?? "—"}</td>
                <td className="px-3 py-2">{t.treadDepthMm ? `${Number(t.treadDepthMm)} mm` : "—"}</td>
                <td className="px-3 py-2">{CONDITION_LABELS[t.condition]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <div className="mb-2 text-xs uppercase text-zinc-500">{title}</div>
      {children}
    </div>
  );
}
