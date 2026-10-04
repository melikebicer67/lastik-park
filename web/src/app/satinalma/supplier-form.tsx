"use client";

import { useState } from "react";
import { Choice, Field } from "@/components/ui/section";
import { errorBox, input, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { Supplier, SUPPLIER_TYPE_LABELS, SupplierType } from "@/lib/purchasing";

// Tedarikçi ekleme/düzenleme (tedarikçiler sayfası ve alım formunda hızlı ekleme)
export function SupplierForm({
  supplier,
  onSaved,
  onCancel,
}: {
  supplier?: Supplier;
  onSaved: (s: Supplier) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    type: (supplier?.type ?? "EXTERNAL") as SupplierType,
    city: supplier?.city ?? "",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    taxNr: supplier?.taxNr ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await api<Supplier>(supplier ? `/suppliers/${supplier.id}` : "/suppliers", {
        method: supplier ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ünvan">
          <input autoFocus value={form.name} onChange={set("name")} className={input} />
        </Field>
        <Field label="Tür">
          <Choice value={form.type} options={SUPPLIER_TYPE_LABELS} onChange={(type) => setForm({ ...form, type })} />
        </Field>
        <Field label="Şehir">
          <input value={form.city} onChange={set("city")} className={input} />
        </Field>
        <Field label="Yetkili">
          <input value={form.contactName} onChange={set("contactName")} className={input} />
        </Field>
        <Field label="Telefon">
          <input value={form.phone} onChange={set("phone")} className={input} />
        </Field>
        <Field label="Vergi no">
          <input value={form.taxNr} onChange={set("taxNr")} className={input} />
        </Field>
      </div>
      {error && <div className={errorBox}>{error}</div>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving || !form.name.trim()} className={primaryButton}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Vazgeç
        </button>
      </div>
    </div>
  );
}
