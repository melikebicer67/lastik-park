"use client";

import { ChartTooltipArea, useChartTooltip } from "./chart-tooltip";
import { SERIES } from "./legend";
import { niceScale } from "./scale";

export interface MonthlyDatum {
  key: string;
  label: string;
  title: string;
  main: number;
  external: number;
}

const HEIGHT = 220;

// Aylık yığılmış sütun: altta ana bayi, üstte dış alım. Tek eksen, temiz aralıklar.
export function MonthlyColumns({ data, format, formatAxis }: { data: MonthlyDatum[]; format: (n: number) => string; formatAxis: (n: number) => string }) {
  const totals = data.map((d) => d.main + d.external);
  const scale = niceScale(Math.max(...totals, 0));
  const peak = totals.indexOf(Math.max(...totals));

  return (
    <ChartTooltipArea>
      <div className="flex gap-2">
        {/* Y ekseni */}
        <div className="relative w-14 shrink-0 text-right text-[11px] text-zinc-500" style={{ height: HEIGHT }}>
          {scale.ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / scale.max) * 100}%` }}>
              {formatAxis(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: HEIGHT }}>
            {scale.ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-chart-grid" style={{ bottom: `${(t / scale.max) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end">
              {data.map((d, i) => (
                <Column key={d.key} d={d} max={scale.max} format={format} showLabel={i === peak && totals[i] > 0} />
              ))}
            </div>
          </div>
          <div className="mt-1 flex">
            {data.map((d) => (
              <div key={d.key} className="flex-1 text-center text-[11px] text-zinc-500">
                {d.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartTooltipArea>
  );
}

function Column({ d, max, format, showLabel }: { d: MonthlyDatum; max: number; format: (n: number) => string; showLabel: boolean }) {
  const { show } = useChartTooltip();
  const total = d.main + d.external;
  const rows = [
    { label: SERIES.main.label, value: format(d.main), swatch: SERIES.main.color },
    { label: SERIES.external.label, value: format(d.external), swatch: SERIES.external.color },
    { label: "Toplam", value: format(total) },
  ];
  const onShow = (e: React.PointerEvent | React.FocusEvent) => show(e, d.title, rows);
  const hMain = (d.main / max) * 100;
  const hExt = (d.external / max) * 100;
  // Hover alanı sütunun tamamı (işaretten büyük); işaret en fazla 24px
  return (
    <div
      tabIndex={0}
      onPointerMove={onShow}
      onFocus={onShow}
      aria-label={`${d.title}: ${rows.map((r) => `${r.label} ${r.value}`).join(", ")}`}
      className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
    >
      <div className="absolute inset-y-0 inset-x-1 rounded-sm bg-zinc-900/0 group-hover:bg-zinc-900/[0.04] group-focus-visible:ring-2 group-focus-visible:ring-brand dark:group-hover:bg-white/[0.05]" />
      {showLabel && (
        <span className="relative mb-1 whitespace-nowrap text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{format(total)}</span>
      )}
      <div className="relative flex w-full max-w-6 flex-col justify-end" style={{ height: `${hMain + hExt}%` }}>
        {d.external > 0 && (
          <div
            className={`w-full ${d.main > 0 ? "mb-[2px]" : ""} rounded-t-[4px]`}
            style={{ height: `${(hExt / (hMain + hExt)) * 100}%`, background: SERIES.external.color }}
          />
        )}
        {d.main > 0 && (
          <div
            className={`w-full ${d.external > 0 ? "" : "rounded-t-[4px]"}`}
            style={{ height: `${(hMain / (hMain + hExt)) * 100}%`, background: SERIES.main.color }}
          />
        )}
      </div>
    </div>
  );
}
