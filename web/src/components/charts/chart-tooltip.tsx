"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// Grafiklerde tek bir hover kutusu: değer önde, etiket arkada. İçerik metin olarak verilir.
export interface TooltipRow {
  label: string;
  value: string;
  swatch?: string; // seri rengi (CSS değişkeni)
}

interface TooltipState {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: TooltipRow[];
}

const Ctx = createContext<{ show: (e: React.PointerEvent | React.FocusEvent, title: string, rows: TooltipRow[]) => void; hide: () => void } | null>(null);

export function useChartTooltip() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("ChartTooltipArea içinde kullanılmalı");
  return ctx;
}

export function ChartTooltipArea({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const show = useCallback((e: React.PointerEvent | React.FocusEvent, title: string, rows: TooltipRow[]) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    let x: number;
    let y: number;
    if ("clientX" in e) {
      x = e.clientX - box.left;
      y = e.clientY - box.top;
    } else {
      const r = (e.target as Element).getBoundingClientRect();
      x = r.left + r.width / 2 - box.left;
      y = r.top - box.top;
    }
    setTip({ x, y, width: box.width, title, rows });
  }, []);
  const hide = useCallback(() => setTip(null), []);

  return (
    <Ctx.Provider value={{ show, hide }}>
      <div ref={ref} className={`relative ${className}`} onPointerLeave={hide}>
        {children}
        {tip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 min-w-40 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              left: Math.min(Math.max(tip.x + 12, 0), Math.max(0, tip.width - 180)),
              top: Math.max(tip.y - 12, 0),
              transform: "translateY(-100%)",
            }}
          >
            <div className="mb-1 font-medium text-zinc-500">{tip.title}</div>
            {tip.rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                {r.swatch && <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.swatch }} />}
                <span className="font-semibold">{r.value}</span>
                <span className="text-zinc-500">{r.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
