"use client";

import { useState } from "react";
import { api, Customer, Vehicle } from "@/lib/api";
import { formatPlate } from "@/lib/tire";
import { Field } from "@/components/ui/section";
import { errorBox, idleChoice, input, secondaryButton, selectedChoice } from "@/components/ui/styles";

export function VehicleStep({
  customer,
  vehicleId,
  mileageKm,
  onVehicleChange,
  onVehicleAdded,
  onMileageChange,
}: {
  customer: Customer | null;
  vehicleId: number | null;
  mileageKm: string;
  onVehicleChange: (id: number | null) => void;
  onVehicleAdded: (v: Vehicle) => void;
  onMileageChange: (v: string) => void;
}) {
  const vehicles = customer?.vehicles ?? [];
  const [adding, setAdding] = useState(false);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showForm = adding || (customer !== null && vehicles.length === 0);

  const save = async () => {
    if (!customer) return;
    setSaving(true);
    setError(null);
    try {
      const v = await api<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify({ customerId: customer.id, plate, brand: brand || undefined, model: model || undefined }),
      });
      onVehicleAdded(v);
      setAdding(false);
      setPlate("");
      setBrand("");
      setModel("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {vehicles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onVehicleChange(v.id)}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                vehicleId === v.id
                  ? selectedChoice
                  : idleChoice
              }`}
            >
              <div className="font-mono font-medium">{formatPlate(v.plate)}</div>
              <div className="text-xs opacity-70">{[v.brand, v.model].filter(Boolean).join(" ") || "—"}</div>
            </button>
          ))}
          {!showForm && (
            <button type="button" onClick={() => setAdding(true)} className={secondaryButton}>
              + Yeni araç
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Plaka">
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="34 ABC 123"
                className={`${input} font-mono`}
              />
            </Field>
            <Field label="Marka">
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Renault" className={input} />
            </Field>
            <Field label="Model">
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Clio" className={input} />
            </Field>
          </div>
          {error && <div className={errorBox}>{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving || plate.trim().length < 5} className={secondaryButton}>
              {saving ? "Kaydediliyor…" : "Aracı ekle"}
            </button>
            {vehicles.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="px-2 text-sm text-zinc-500">
                Vazgeç
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-xs">
        <Field label="Araç kilometresi" hint="İsteğe bağlı">
          <input
            type="number"
            min={0}
            value={mileageKm}
            onChange={(e) => onMileageChange(e.target.value)}
            placeholder="45000"
            className={input}
          />
        </Field>
      </div>
    </div>
  );
}
