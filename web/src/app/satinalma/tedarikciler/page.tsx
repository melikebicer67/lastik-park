"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SERIES } from "@/components/charts/legend";
import { errorBox, secondaryButton } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { formatInt, formatTL, Supplier, SUPPLIER_TYPE_LABELS } from "@/lib/purchasing";
import { SupplierForm } from "../supplier-form";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);

  const load = () =>
    api<Supplier[]>("/suppliers")
      .then(setSuppliers)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const saved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {editing !== "new" && (
          <button type="button" onClick={() => setEditing("new")} className={secondaryButton}>
            + Tedarikçi ekle
          </button>
        )}
      </div>
      {editing === "new" && <SupplierForm onSaved={saved} onCancel={() => setEditing(null)} />}
      {error && <div className={errorBox}>{error}</div>}
      <div className="space-y-2">
        {suppliers?.map((s) =>
          editing === s.id ? (
            <SupplierForm key={s.id} supplier={s} onSaved={saved} onCancel={() => setEditing(null)} />
          ) : (
            <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.type === "MAIN_DEALER" ? SERIES.main.color : SERIES.external.color }} />
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-zinc-500">{SUPPLIER_TYPE_LABELS[s.type]}</span>
                </div>
                <div className="text-sm text-zinc-500">{[s.city, s.contactName, s.phone].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-right text-sm">
                <div>
                  <div className="text-xs text-zinc-500">Alım</div>
                  <div className="font-semibold tabular-nums">{s.purchaseCount}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Adet</div>
                  <div className="font-semibold tabular-nums">{formatInt(s.quantity)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Toplam</div>
                  <div className="font-semibold tabular-nums">{formatTL(s.amount)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/satinalma/alimlar?tedarikci=${s.id}`} className={secondaryButton}>
                  Alımları
                </Link>
                <button type="button" onClick={() => setEditing(s.id)} className={secondaryButton}>
                  Düzenle
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
