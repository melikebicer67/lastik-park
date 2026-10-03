"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { RimType, Season, TireSetDetail, TireSetListItem } from "@/lib/api";
import { formatPlate, formatTireSize, SEASON_LABELS } from "@/lib/tire";

export interface LabelData {
  code: string;
  location: string | null;
  plate: string | null;
  customer: string;
  tires: string; // "Michelin · 205/55 R16 91V"
  season: Season;
  quantity: number;
  rimType: RimType;
  date: string;
}

export function labelFromDetail(set: TireSetDetail): LabelData {
  const sizes = [...new Set(set.tires.map((t) => formatTireSize(t)))];
  const brands = [...new Set(set.tires.map((t) => t.brand))];
  return {
    code: set.code,
    location: set.currentLocation?.code ?? null,
    plate: set.vehicle?.plate ?? null,
    customer: set.customer.name,
    tires: `${brands.join(", ")} · ${sizes.join(", ")}`,
    season: set.season,
    quantity: set.quantity,
    rimType: set.rimType,
    date: set.createdAt,
  };
}

export function labelFromListItem(t: TireSetListItem): LabelData {
  return {
    code: t.code,
    location: t.location,
    plate: t.vehicle?.plate ?? null,
    customer: t.customer.name,
    tires: t.tire ? `${t.tire.brand} · ${formatTireSize(t.tire)}` : "",
    season: t.season,
    quantity: t.quantity,
    rimType: t.rimType,
    date: t.checkInAt,
  };
}

// 100 × 60 mm termal etiket. QR kodunda takım numarası var; rafta okutulunca takıma ulaşılır.
export function TireSetLabel({ label }: { label: LabelData }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(label.code, { margin: 0, width: 240, errorCorrectionLevel: "M" }).then(setQr);
  }, [label.code]);

  return (
    <div className="label flex h-[60mm] w-[100mm] gap-[4mm] overflow-hidden border border-dashed border-zinc-400 bg-white p-[4mm] text-black print:break-after-page print:border-0">
      <div className="flex w-[30mm] shrink-0 flex-col items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, optimizasyon gerekmez */}
        {qr ? <img src={qr} alt={label.code} className="h-[30mm] w-[30mm]" /> : <div className="h-[30mm] w-[30mm]" />}
        <div className="text-center font-mono text-[9pt] font-bold leading-tight">{label.code}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between text-[8pt]">
            <span className="uppercase tracking-wide">Göz</span>
            <span className="truncate pl-[2mm] font-extrabold italic">
              LastikPark{process.env.NEXT_PUBLIC_DEALER_NAME ? ` · ${process.env.NEXT_PUBLIC_DEALER_NAME}` : ""}
            </span>
          </div>
          <div className="font-mono text-[22pt] font-bold leading-none">{label.location ?? "—"}</div>
        </div>
        <div className="space-y-[1mm] text-[9pt] leading-tight">
          {label.plate && <div className="font-mono text-[12pt] font-bold">{formatPlate(label.plate)}</div>}
          <div className="truncate font-medium">{label.customer}</div>
          <div className="truncate">{label.tires}</div>
          <div>
            {SEASON_LABELS[label.season]} · {label.quantity} adet{label.rimType !== "NONE" ? " · jantlı" : ""}
          </div>
          <div className="text-[8pt]">{new Date(label.date).toLocaleDateString("tr-TR")}</div>
        </div>
      </div>
    </div>
  );
}
