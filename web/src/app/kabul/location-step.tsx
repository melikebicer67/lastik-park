"use client";

import { useEffect, useState } from "react";
import { api, StorageLocation, Warehouse } from "@/lib/api";
import { Field } from "@/components/ui/section";
import { errorBox, input } from "@/components/ui/styles";

// Depo ve boş göz seçimi. Varsayılan olarak ilk boş göz önerilir.
export function LocationStep({
  locationId,
  onChange,
}: {
  locationId: number | null;
  onChange: (id: number | null, code?: string) => void;
}) {
  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [locations, setLocations] = useState<{ warehouseId: number; items: StorageLocation[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Warehouse[]>("/storage/warehouses")
      .then((w) => {
        setWarehouses(w);
        if (w.length > 0) setWarehouseId(w[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (warehouseId === null) return;
    let cancelled = false;
    api<StorageLocation[]>(`/storage/warehouses/${warehouseId}/locations?onlyAvailable=true`)
      .then((items) => {
        if (cancelled) return;
        setLocations({ warehouseId, items });
        onChange(items[0]?.id ?? null, items[0]?.code);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // onChange her render'da yeni; sadece depo değişince öneri yapılmalı
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  if (error) return <div className={errorBox}>{error}</div>;
  if (warehouses && warehouses.length === 0) {
    return <p className="text-sm text-zinc-500">Tanımlı depo yok. Önce depo ve göz tanımlanmalı.</p>;
  }

  const items = locations?.warehouseId === warehouseId ? locations.items : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Depo">
        <select
          value={warehouseId ?? ""}
          onChange={(e) => setWarehouseId(Number(e.target.value))}
          className={input}
        >
          {warehouses?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.branch} / {w.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Göz" hint={items ? `${items.length} boş göz` : "Yükleniyor…"}>
        <select
          value={locationId ?? ""}
          onChange={(e) => {
            const loc = items?.find((l) => l.id === Number(e.target.value));
            onChange(loc?.id ?? null, loc?.code);
          }}
          className={`${input} font-mono`}
          disabled={!items || items.length === 0}
        >
          {items?.length === 0 && <option value="">Boş göz yok</option>}
          {items?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code}
              {l.capacity > 1 ? ` (${l.occupied}/${l.capacity})` : ""}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
