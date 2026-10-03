import Link from "next/link";
import { CustomerHistoryItem } from "@/lib/api";
import { formatDate, formatMoney, formatPlate, formatTireSize, SEASON_LABELS, SEASON_STYLES } from "@/lib/tire";

// Müşterinin konaklama geçmişi: kabul, teslim, süre, göz, ücret. Teslim ekranında ve raporda kullanılır.
export function CustomerHistoryTable({ items, compact = false }: { items: CustomerHistoryItem[]; compact?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-zinc-500">Geçmiş kayıt yok.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 print:overflow-visible print:border-zinc-400 dark:border-zinc-800">
      <table className="w-full text-left text-sm print:text-[9pt]">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 print:bg-transparent">
          <tr>
            <th className="px-3 py-2">Plaka</th>
            <th className="px-3 py-2">Mevsim</th>
            {!compact && <th className="px-3 py-2">Lastik</th>}
            <th className="px-3 py-2">Göz</th>
            <th className="px-3 py-2">Kabul</th>
            <th className="px-3 py-2">Teslim</th>
            <th className="px-3 py-2 text-right">Süre</th>
            <th className="px-3 py-2 text-right">Ücret</th>
            {!compact && <th className="px-3 py-2">Personel</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.stayId} className="border-t border-zinc-100 align-top dark:border-zinc-800 print:break-inside-avoid">
              <td className="whitespace-nowrap px-3 py-2">
                <Link href={`/takim/${i.tireSetId}`} className="font-mono font-bold hover:text-brand">
                  {i.plate ? formatPlate(i.plate) : "—"}
                </Link>
                <div className="font-mono text-[11px] text-zinc-400">{i.code}</div>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEASON_STYLES[i.season]}`}>{SEASON_LABELS[i.season]}</span>
                {i.seasonLabel && <div className="mt-1 text-[11px] text-zinc-500">{i.seasonLabel}</div>}
              </td>
              {!compact && (
                <td className="px-3 py-2">
                  {i.tire && (
                    <>
                      <div>{[i.tire.brand, i.tire.pattern].filter(Boolean).join(" ")}</div>
                      <div className="font-mono text-xs text-zinc-500">
                        {formatTireSize(i.tire)}
                        {i.minTreadDepthMm != null ? ` · en az ${i.minTreadDepthMm} mm` : ""}
                      </div>
                    </>
                  )}
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-2 font-mono">{i.location ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatDate(i.checkInAt)}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {i.checkOutAt ? formatDate(i.checkOutAt) : <span className="font-semibold text-brand">Depoda</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{i.days} gün</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                {i.price != null ? formatMoney(i.price) : "—"}
                <div className={`text-[11px] ${i.paid ? "text-emerald-600" : "text-amber-600"}`}>{i.paid ? "Ödendi" : "Ödenmedi"}</div>
              </td>
              {!compact && (
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {i.checkInBy && <div>Alan: {i.checkInBy}</div>}
                  {i.checkOutBy && <div>Veren: {i.checkOutBy}</div>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
