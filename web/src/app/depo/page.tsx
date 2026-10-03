"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { errorBox, input } from "@/components/ui/styles";
import { api, Season, Warehouse, WarehouseMap } from "@/lib/api";
import { foldSearch as fold, formatPlate, SEASON_LABELS, SEASON_STYLES } from "@/lib/tire";

export default function DepotPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Yükleniyor…</p>}>
      <DepotMap />
    </Suspense>
  );
}



function DepotMap() {
  // ?goz=B-04-2 ile gelinirse o göz vurgulanır (takım detayındaki "Depoda göster")
  const focus = useSearchParams().get("goz")?.toUpperCase() ?? null;
  const [map, setMap] = useState<WarehouseMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const focusRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    api<Warehouse[]>("/storage/warehouses")
      .then((w) => {
        if (w.length === 0) throw new Error("Tanımlı depo yok");
        return api<WarehouseMap>(`/storage/warehouses/${w[0].id}/map`);
      })
      .then(setMap)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [map, focus]);

  const aisles = useMemo(() => {
    if (!map) return [];
    const groups = new Map<string, WarehouseMap["locations"]>();
    for (const l of map.locations) {
      const key = l.aisle ?? "-";
      groups.set(key, [...(groups.get(key) ?? []), l]);
    }
    return [...groups.entries()].map(([aisle, locs]) => ({
      aisle,
      racks: [...new Set(locs.map((l) => l.rack ?? ""))].sort(),
      levels: [...new Set(locs.map((l) => l.level ?? ""))].sort().reverse(), // üst kat üstte
      at: (rack: string, level: string) => locs.find((l) => l.rack === rack && l.level === level),
    }));
  }, [map]);

  if (error) return <div className={errorBox}>{error}</div>;
  if (!map) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;

  const q = fold(filter);
  const matches = (l: WarehouseMap["locations"][number]) =>
    q.length >= 2 && l.sets.some((s) => fold(`${s.plate ?? ""}${s.customer}${s.code}`).includes(q));
  const matchCount = q.length >= 2 ? map.locations.filter(matches).length : 0;

  const bySeason = map.locations
    .flatMap((l) => l.sets)
    .reduce<Record<Season, number>>((acc, s) => ({ ...acc, [s.season]: acc[s.season] + 1 }), {
      SUMMER: 0,
      WINTER: 0,
      ALL_SEASON: 0,
    });
  const fill = Math.round((map.summary.occupied / Math.max(1, map.summary.capacity)) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Depo</h1>
        <p className="text-sm text-zinc-500">
          {map.warehouse.branch} / {map.warehouse.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Doluluk" value={`%${fill}`}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-full bg-brand" style={{ width: `${fill}%` }} />
          </div>
        </Stat>
        <Stat label="Depodaki takım" value={map.summary.occupied} />
        <Stat label="Boş göz" value={map.summary.free} />
        <Stat label="Mevsim" value="">
          <div className="mt-1 space-y-0.5 text-xs">
            {(Object.keys(bySeason) as Season[]).map((s) => (
              <div key={s} className="flex justify-between">
                <span>{SEASON_LABELS[s]}</span>
                <span className="font-semibold">{bySeason[s]}</span>
              </div>
            ))}
          </div>
        </Stat>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Haritada plaka veya müşteri ara"
          className={`${input} max-w-xs`}
        />
        {q.length >= 2 && <span className="text-sm text-zinc-500">{matchCount} gözde eşleşme</span>}
        <div className="ml-auto flex flex-wrap gap-2 text-xs">
          {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
            <span key={s} className={`rounded px-2 py-0.5 font-medium ${SEASON_STYLES[s]}`}>
              {SEASON_LABELS[s]}
            </span>
          ))}
          <span className="rounded border border-dashed border-zinc-300 px-2 py-0.5 text-zinc-500 dark:border-zinc-600">Boş</span>
        </div>
      </div>

      {aisles.map((a) => (
        <section key={a.aisle} className="space-y-2">
          <h2 className="font-semibold">Koridor {a.aisle}</h2>
          <div className="overflow-x-auto pb-1">
            <table className="border-separate border-spacing-1">
              <thead>
                <tr>
                  <th />
                  {a.racks.map((r) => (
                    <th key={r} className="text-xs font-medium text-zinc-500">
                      Raf {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.levels.map((lvl) => (
                  <tr key={lvl}>
                    <td className="pr-1 text-right text-xs text-zinc-500">Kat {lvl}</td>
                    {a.racks.map((r) => {
                      const loc = a.at(r, lvl);
                      if (!loc) return <td key={r} />;
                      const set = loc.sets[0];
                      const focused = loc.code === focus;
                      const hit = matches(loc);
                      const ring = focused || hit ? "ring-4 ring-brand ring-offset-1" : "";
                      if (!set) {
                        return (
                          <td key={r}>
                            <div
                              className={`flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-zinc-300 font-mono text-[11px] text-zinc-400 dark:border-zinc-700 ${ring}`}
                            >
                              {loc.code}
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={r}>
                          <Link
                            ref={focused ? focusRef : undefined}
                            href={`/takim/${set.id}`}
                            title={`${set.code} · ${set.customer}`}
                            className={`flex h-16 w-24 flex-col justify-between rounded-md p-1.5 transition hover:scale-105 hover:shadow ${SEASON_STYLES[set.season]} ${ring} ${
                              q.length >= 2 && !hit ? "opacity-30" : ""
                            }`}
                          >
                            <span className="font-mono text-[10px] opacity-70">{loc.code}</span>
                            <span className="truncate font-mono text-[11px] font-bold">{set.plate ? formatPlate(set.plate) : "—"}</span>
                            <span className="truncate text-[10px]">{set.customer}</span>
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      {value !== "" && <div className="text-2xl font-bold">{value}</div>}
      {children}
    </div>
  );
}
