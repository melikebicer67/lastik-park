"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmployeeSelect } from "@/components/employee-select";
import { Field, Section } from "@/components/ui/section";
import { errorBox, input, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api, Season } from "@/lib/api";
import { formatTL, PurchaseDetail, Supplier, SUPPLIER_TYPE_LABELS } from "@/lib/purchasing";
import { formatTireSize, parseTireSize, SEASON_LABELS } from "@/lib/tire";
import { SupplierForm } from "../supplier-form";

interface Line {
  key: number;
  brand: string;
  pattern: string;
  size: string;
  season: Season;
  quantity: string;
  unitPrice: string;
}

let nextKey = 1;
const emptyLine = (season: Season = "WINTER"): Line => ({ key: nextKey++, brand: "", pattern: "", size: "", season, quantity: "4", unitPrice: "" });
// Yerel tarih (UTC değil): gece yarısından sonra girilen alım bir önceki güne düşmesin
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// "3.800" (binlik), "3800,50" ve "3800.50" yazımlarının hepsi kabul edilir
const num = (input: string) => {
  const t = input.trim().replace(/\s|₺/g, "");
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  return Number(t);
};

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [date, setDate] = useState(today);
  const [documentNo, setDocumentNo] = useState("");
  const [note, setNote] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [vatRate, setVatRate] = useState("20");
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Supplier[]>("/suppliers")
      .then(setSuppliers)
      .catch((e: Error) => setError(e.message));
  }, []);

  const setLine = (key: number, patch: Partial<Line>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const lineTotal = (l: Line) => (num(l.quantity) || 0) * (num(l.unitPrice) || 0);
  const net = lines.reduce((n, l) => n + lineTotal(l), 0);
  const vat = net * ((Number(vatRate) || 0) / 100);
  const supplier = suppliers.find((s) => s.id === supplierId);

  const submit = async () => {
    if (!supplierId) return setError("Tedarikçi seçilmeli");
    const payload = [];
    for (const [i, l] of lines.entries()) {
      const size = parseTireSize(l.size);
      if (!l.brand.trim()) return setError(`${i + 1}. satırda marka eksik`);
      if (!size) return setError(`${i + 1}. satırda ebat anlaşılamadı: "${l.size || "boş"}"`);
      if (!(num(l.quantity) > 0)) return setError(`${i + 1}. satırda adet hatalı`);
      if (!(num(l.unitPrice) >= 0) || !l.unitPrice) return setError(`${i + 1}. satırda birim fiyat eksik`);
      payload.push({
        brand: l.brand.trim(),
        pattern: l.pattern.trim() || undefined,
        season: l.season,
        ...size,
        quantity: num(l.quantity),
        unitPrice: num(l.unitPrice),
        vatRate: Number(vatRate) || 0,
      });
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api<PurchaseDetail>("/purchases", {
        method: "POST",
        body: JSON.stringify({
          supplierId,
          purchaseDate: date,
          documentNo: documentNo || undefined,
          note: note || undefined,
          createdById: employeeId ?? undefined,
          lines: payload,
        }),
      });
      router.push(`/satinalma/alim/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section step={1} title="Tedarikçi ve belge">
        {addingSupplier ? (
          <SupplierForm
            onSaved={(s) => {
              setSuppliers([...suppliers, { ...s, purchaseCount: 0, quantity: 0, amount: 0, lastPurchaseDate: null }]);
              setSupplierId(s.id);
              setAddingSupplier(false);
            }}
            onCancel={() => setAddingSupplier(false)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Tedarikçi"
              hint={
                <button type="button" onClick={() => setAddingSupplier(true)} className="font-semibold text-brand hover:underline">
                  + Yeni tedarikçi
                </button>
              }
            >
              <select value={supplierId ?? ""} onChange={(e) => setSupplierId(Number(e.target.value) || null)} className={input}>
                <option value="">Seçin</option>
                {(["MAIN_DEALER", "EXTERNAL"] as const).map((t) => (
                  <optgroup key={t} label={SUPPLIER_TYPE_LABELS[t]}>
                    {suppliers
                      .filter((s) => s.type === t)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Tarih">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </Field>
            <Field label="Fatura / irsaliye no">
              <input value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} className={input} />
            </Field>
            <Field label="Giren">
              <EmployeeSelect value={employeeId} onChange={setEmployeeId} />
            </Field>
          </div>
        )}
        {supplier && !addingSupplier && (
          <p className="mt-3 text-sm text-zinc-500">
            {SUPPLIER_TYPE_LABELS[supplier.type]}
            {supplier.lastPurchaseDate ? ` · son alım ${new Date(supplier.lastPurchaseDate).toLocaleDateString("tr-TR")}` : ""}
          </p>
        )}
      </Section>

      <Section step={2} title="Lastikler">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Marka</th>
                <th className="py-2 pr-2">Desen</th>
                <th className="py-2 pr-2">Ebat</th>
                <th className="py-2 pr-2">Mevsim</th>
                <th className="py-2 pr-2">Adet</th>
                <th className="py-2 pr-2">Birim fiyat (₺, KDV hariç)</th>
                <th className="py-2 pr-2 text-right">Tutar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const size = parseTireSize(l.size);
                return (
                  <tr key={l.key} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                    <td className="py-2 pr-2">
                      <input value={l.brand} onChange={(e) => setLine(l.key, { brand: e.target.value })} placeholder="Lassa" className={input} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={l.pattern} onChange={(e) => setLine(l.key, { pattern: e.target.value })} placeholder="Snoways 4" className={input} />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={l.size}
                        onChange={(e) => setLine(l.key, { size: e.target.value })}
                        placeholder="205/55 R16 91H"
                        className={`${input} w-40 font-mono ${l.size && !size ? "border-red-400" : ""}`}
                      />
                      {size && <div className="mt-0.5 text-[11px] text-emerald-600">{formatTireSize(size)}</div>}
                    </td>
                    <td className="py-2 pr-2">
                      <select value={l.season} onChange={(e) => setLine(l.key, { season: e.target.value as Season })} className={`${input} w-28`}>
                        {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                          <option key={s} value={s}>
                            {SEASON_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} inputMode="numeric" className={`${input} w-20`} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} inputMode="decimal" placeholder="3800" className={`${input} w-32`} />
                    </td>
                    <td className="py-2 pr-2 pt-4 text-right tabular-nums">{formatTL(lineTotal(l))}</td>
                    <td className="py-2 pt-3">
                      {lines.length > 1 && (
                        <button type="button" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} className="px-2 text-zinc-400 hover:text-brand" aria-label="Satırı sil">
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setLines([...lines, emptyLine(lines.at(-1)?.season)])} className={`${secondaryButton} mt-3`}>
          + Satır ekle
        </button>
      </Section>

      <Section step={3} title="Toplam">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid w-full max-w-md gap-3 sm:grid-cols-[6rem_1fr]">
            <Field label="KDV %">
              <input value={vatRate} onChange={(e) => setVatRate(e.target.value)} inputMode="numeric" className={input} />
            </Field>
            <Field label="Not">
              <input value={note} onChange={(e) => setNote(e.target.value)} className={input} />
            </Field>
          </div>
          <div className="text-right text-sm">
            <div className="text-zinc-500">
              Ara toplam <span className="ml-2 tabular-nums text-foreground">{formatTL(net)}</span>
            </div>
            <div className="text-zinc-500">
              KDV <span className="ml-2 tabular-nums text-foreground">{formatTL(vat)}</span>
            </div>
            <div className="text-lg font-semibold">
              Genel toplam <span className="ml-2 tabular-nums">{formatTL(net + vat)}</span>
            </div>
          </div>
        </div>
      </Section>

      {error && <div className={errorBox}>{error}</div>}
      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={saving} className={primaryButton}>
          {saving ? "Kaydediliyor…" : "Alımı kaydet"}
        </button>
      </div>
    </div>
  );
}
