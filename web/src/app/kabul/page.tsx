"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, Customer, TireSetDetail } from "@/lib/api";
import { parseTireSize } from "@/lib/tire";
import { Field, Section } from "@/components/ui/section";
import { errorBox, input, primaryButton } from "@/components/ui/styles";
import { CustomerStep } from "./customer-step";
import { LocationStep } from "./location-step";
import { initialTireSetForm, TireSetForm, TiresStep } from "./tires-step";
import { VehicleStep } from "./vehicle-step";

// Formu API'nin beklediği lastik listesine çevirir; eksik/hatalı alan varsa mesaj döner
function buildTires(form: TireSetForm) {
  const tires = [];
  for (const t of form.tires) {
    const brand = form.sameForAll ? form.common.brand : t.brand;
    const sizeText = form.sameForAll ? form.common.size : t.size;
    const pattern = form.sameForAll ? form.common.pattern : t.pattern;
    const size = parseTireSize(sizeText);
    if (!brand.trim()) return { error: "Lastik markası girilmeli" };
    if (!size) return { error: `Ebat anlaşılamadı: "${sizeText || "boş"}"` };
    if (t.dot && t.dot.length !== 4) return { error: "DOT 4 haneli olmalı" };
    tires.push({
      position: t.position,
      brand: brand.trim(),
      pattern: pattern.trim() || undefined,
      ...size,
      dot: t.dot || undefined,
      treadDepthMm: t.treadDepthMm ? Number(t.treadDepthMm) : undefined,
      condition: t.condition,
    });
  }
  return { tires };
}

export default function CheckInPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [mileageKm, setMileageKm] = useState("");
  const [tireForm, setTireForm] = useState<TireSetForm>(initialTireSetForm);
  const [location, setLocation] = useState<{ id: number | null; code?: string }>({ id: null });
  const [seasonLabel, setSeasonLabel] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectCustomer = (c: Customer | null) => {
    setCustomer(c);
    // Tek aracı varsa otomatik seç
    setVehicleId(c?.vehicles.length === 1 ? c.vehicles[0].id : null);
  };

  const submit = async () => {
    if (!customer) return setError("Müşteri seçilmeli");
    if (!location.id) return setError("Depo gözü seçilmeli");
    const built = buildTires(tireForm);
    if ("error" in built) return setError(built.error ?? null);

    setSaving(true);
    setError(null);
    try {
      const created = await api<TireSetDetail>("/tire-sets/check-in", {
        method: "POST",
        body: JSON.stringify({
          customerId: customer.id,
          vehicleId: vehicleId ?? undefined,
          season: tireForm.season,
          rimType: tireForm.rimType,
          hasHubcaps: tireForm.hasHubcaps,
          hasBolts: tireForm.hasBolts,
          locationId: location.id,
          mileageKm: mileageKm ? Number(mileageKm) : undefined,
          seasonLabel: seasonLabel || undefined,
          price: price ? Number(price.replace(",", ".")) : undefined,
          note: note || undefined,
          tires: built.tires,
        }),
      });
      router.push(`/takim/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Lastik Kabul</h1>
        <p className="text-sm text-zinc-500">Müşteriden lastik teslim alıp depoya yerleştirin</p>
      </div>

      <Section step={1} title="Müşteri">
        <CustomerStep customer={customer} onSelect={selectCustomer} />
      </Section>

      <Section step={2} title="Araç" disabled={!customer}>
        <VehicleStep
          customer={customer}
          vehicleId={vehicleId}
          mileageKm={mileageKm}
          onVehicleChange={setVehicleId}
          onVehicleAdded={(v) => {
            setCustomer((c) => (c ? { ...c, vehicles: [v, ...c.vehicles.filter((x) => x.id !== v.id)] } : c));
            setVehicleId(v.id);
          }}
          onMileageChange={setMileageKm}
        />
      </Section>

      <Section step={3} title="Lastikler" disabled={!customer}>
        <TiresStep form={tireForm} onChange={setTireForm} />
      </Section>

      <Section step={4} title="Depo yeri" disabled={!customer}>
        <LocationStep locationId={location.id} onChange={(id, code) => setLocation({ id, code })} />
      </Section>

      <Section step={5} title="Ücret ve not" disabled={!customer}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Dönem" hint="İsteğe bağlı">
            <input value={seasonLabel} onChange={(e) => setSeasonLabel(e.target.value)} placeholder="2026 Yaz" className={input} />
          </Field>
          <Field label="Ücret (₺)" hint="İsteğe bağlı">
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="1500" className={input} />
          </Field>
          <Field label="Not">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sağ arkada yanak çiziği" className={input} />
          </Field>
        </div>
      </Section>

      {error && <div className={errorBox}>{error}</div>}

      <div className="flex items-center justify-end gap-4">
        {location.code && customer && (
          <span className="text-sm text-zinc-500">
            Göz: <span className="font-mono font-bold text-brand">{location.code}</span>
          </span>
        )}
        <button type="button" onClick={submit} disabled={!customer || saving} className={primaryButton}>
          {saving ? "Kaydediliyor…" : "Kabulü tamamla ve etiket bas"}
        </button>
      </div>
    </div>
  );
}
