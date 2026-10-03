"use client";

import { RimType, Season, TireCondition, TirePosition } from "@/lib/api";
import { CONDITION_LABELS, POSITION_LABELS, RIM_LABELS, SEASON_LABELS, formatTireSize, parseTireSize } from "@/lib/tire";
import { Choice, Field } from "@/components/ui/section";
import { input } from "@/components/ui/styles";

export interface TireRow {
  position: TirePosition;
  brand: string;
  pattern: string;
  size: string;
  dot: string;
  treadDepthMm: string;
  condition: TireCondition;
}

export interface TireSetForm {
  season: Season;
  rimType: RimType;
  hasHubcaps: boolean;
  hasBolts: boolean;
  sameForAll: boolean;
  common: { brand: string; pattern: string; size: string };
  tires: TireRow[];
}

const BASE_POSITIONS: TirePosition[] = ["FRONT_LEFT", "FRONT_RIGHT", "REAR_LEFT", "REAR_RIGHT"];

export const emptyTire = (position: TirePosition): TireRow => ({
  position,
  brand: "",
  pattern: "",
  size: "",
  dot: "",
  treadDepthMm: "",
  condition: "GOOD",
});

export const initialTireSetForm = (): TireSetForm => ({
  season: "WINTER",
  rimType: "NONE",
  hasHubcaps: false,
  hasBolts: false,
  sameForAll: true,
  common: { brand: "", pattern: "", size: "" },
  tires: BASE_POSITIONS.map(emptyTire),
});

export function TiresStep({ form, onChange }: { form: TireSetForm; onChange: (f: TireSetForm) => void }) {
  const set = <K extends keyof TireSetForm>(key: K, value: TireSetForm[K]) => onChange({ ...form, [key]: value });
  const setTire = (i: number, patch: Partial<TireRow>) =>
    set("tires", form.tires.map((t, j) => (i === j ? { ...t, ...patch } : t)));
  const hasSpare = form.tires.some((t) => t.position === "SPARE");
  const toggleSpare = () =>
    set("tires", hasSpare ? form.tires.filter((t) => t.position !== "SPARE") : [...form.tires, emptyTire("SPARE")]);

  const commonSize = parseTireSize(form.common.size);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mevsim">
          <Choice value={form.season} options={SEASON_LABELS} onChange={(v) => set("season", v)} />
        </Field>
        <Field label="Jant">
          <Choice value={form.rimType} options={RIM_LABELS} onChange={(v) => set("rimType", v)} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.hasHubcaps} onChange={(e) => set("hasHubcaps", e.target.checked)} />
          Jant kapağı var
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.hasBolts} onChange={(e) => set("hasBolts", e.target.checked)} />
          Bijonlar teslim alındı
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasSpare} onChange={toggleSpare} />
          Stepne de var
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.sameForAll} onChange={(e) => set("sameForAll", e.target.checked)} />
          Tüm lastikler aynı marka ve ebat
        </label>
      </div>

      {form.sameForAll && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Marka">
            <input
              value={form.common.brand}
              onChange={(e) => set("common", { ...form.common, brand: e.target.value })}
              placeholder="Michelin"
              className={input}
            />
          </Field>
          <Field label="Desen">
            <input
              value={form.common.pattern}
              onChange={(e) => set("common", { ...form.common, pattern: e.target.value })}
              placeholder="Alpin 6"
              className={input}
            />
          </Field>
          <Field label="Ebat" hint={<SizeHint value={form.common.size} parsed={commonSize} />}>
            <input
              value={form.common.size}
              onChange={(e) => set("common", { ...form.common, size: e.target.value })}
              placeholder="205/55 R16 91H"
              className={`${input} font-mono`}
            />
          </Field>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-3">Konum</th>
              {!form.sameForAll && (
                <>
                  <th className="py-2 pr-3">Marka</th>
                  <th className="py-2 pr-3">Ebat</th>
                </>
              )}
              <th className="py-2 pr-3">DOT</th>
              <th className="py-2 pr-3">Diş (mm)</th>
              <th className="py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {form.tires.map((t, i) => (
              <tr key={t.position} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-3 font-medium whitespace-nowrap">{POSITION_LABELS[t.position]}</td>
                {!form.sameForAll && (
                  <>
                    <td className="py-2 pr-3">
                      <input value={t.brand} onChange={(e) => setTire(i, { brand: e.target.value })} className={input} />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={t.size}
                        onChange={(e) => setTire(i, { size: e.target.value })}
                        placeholder="205/55 R16"
                        className={`${input} font-mono ${t.size && !parseTireSize(t.size) ? "border-red-400" : ""}`}
                      />
                    </td>
                  </>
                )}
                <td className="py-2 pr-3">
                  <input
                    value={t.dot}
                    onChange={(e) => setTire(i, { dot: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="2423"
                    inputMode="numeric"
                    className={`${input} w-24 font-mono`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={t.treadDepthMm}
                    onChange={(e) => setTire(i, { treadDepthMm: e.target.value.replace(",", ".") })}
                    placeholder="6.5"
                    inputMode="decimal"
                    className={`${input} w-20`}
                  />
                </td>
                <td className="py-2">
                  <select
                    value={t.condition}
                    onChange={(e) => setTire(i, { condition: e.target.value as TireCondition })}
                    className={`${input} w-32`}
                  >
                    {(Object.keys(CONDITION_LABELS) as TireCondition[]).map((c) => (
                      <option key={c} value={c}>
                        {CONDITION_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">DOT: lastik yanağındaki son 4 hane (hafta + yıl). Örn. 2423 = 2023&apos;ün 24. haftası.</p>
    </div>
  );
}

function SizeHint({ value, parsed }: { value: string; parsed: ReturnType<typeof parseTireSize> }) {
  if (!value) return "Örn. 205/55 R16 91H";
  if (!parsed) return <span className="text-red-600">Ebat anlaşılamadı</span>;
  return <span className="text-emerald-600">{formatTireSize(parsed)}</span>;
}
