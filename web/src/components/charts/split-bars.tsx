"use client";

import { ChartTooltipArea, useChartTooltip } from "./chart-tooltip";
import { SERIES } from "./legend";

export interface SplitDatum {
  label: string;
  main: number;
  external: number;
}

// Yatay yığılmış çubuk (marka/ebat): ana bayi + dış alım, toplam çubuğun ucunda
export function SplitBars({ data, format, unit }: { data: SplitDatum[]; format: (n: number) => string; unit: string }) {
  const max = Math.max(...data.map((d) => d.main + d.external), 1);
  return (
    <ChartTooltipArea>
      <div className="space-y-1.5">
        {data.map((d) => (
          <Row key={d.label} d={d} max={max} format={format} unit={unit} />
        ))}
      </div>
    </ChartTooltipArea>
  );
}

function Row({ d, max, format, unit }: { d: SplitDatum; max: number; format: (n: number) => string; unit: string }) {
  const { show } = useChartTooltip();
  const total = d.main + d.external;
  const onShow = (e: React.PointerEvent | React.FocusEvent) =>
    show(e, d.label, [
      { label: SERIES.main.label, value: `${format(d.main)} ${unit}`, swatch: SERIES.main.color },
      { label: SERIES.external.label, value: `${format(d.external)} ${unit}`, swatch: SERIES.external.color },
      { label: "Dış pay", value: total ? `%${Math.round((d.external / total) * 100)}` : "—" },
    ]);
  return (
    <div
      tabIndex={0}
      onPointerMove={onShow}
      onFocus={onShow}
      className="grid grid-cols-[7.5rem_1fr] items-center gap-3 rounded px-1 py-0.5 outline-none hover:bg-zinc-900/[0.04] focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/[0.05]"
    >
      <span className="truncate text-sm">{d.label}</span>
      <div className="flex items-center gap-2">
        <div className="flex h-3.5 items-stretch" style={{ width: `${(total / max) * 85}%` }}>
          {d.main > 0 && (
            <div
              className={`h-full ${d.external > 0 ? "mr-[2px]" : "rounded-r-[4px]"}`}
              style={{ width: `${(d.main / total) * 100}%`, background: SERIES.main.color }}
            />
          )}
          {d.external > 0 && (
            <div className="h-full rounded-r-[4px]" style={{ width: `${(d.external / total) * 100}%`, background: SERIES.external.color }} />
          )}
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">{format(total)}</span>
      </div>
    </div>
  );
}

// Tek çubukta oran (ana bayi payı)
export function ShareBar({ main, external }: { main: number; external: number }) {
  const total = main + external || 1;
  return (
    <div className="flex h-3 w-full items-stretch">
      {main > 0 && (
        <div
          className={`h-full rounded-l-[4px] ${external > 0 ? "mr-[2px]" : "rounded-r-[4px]"}`}
          style={{ width: `${(main / total) * 100}%`, background: SERIES.main.color }}
        />
      )}
      {external > 0 && (
        <div className={`h-full rounded-r-[4px] ${main > 0 ? "" : "rounded-l-[4px]"}`} style={{ width: `${(external / total) * 100}%`, background: SERIES.external.color }} />
      )}
    </div>
  );
}
