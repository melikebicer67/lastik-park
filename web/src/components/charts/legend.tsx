export const SERIES = {
  main: { label: "Ana bayi", color: "var(--series-main)" },
  external: { label: "Dış alım", color: "var(--series-external)" },
} as const;

export function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
      {Object.values(SERIES).map((s) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
