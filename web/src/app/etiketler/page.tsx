"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { labelFromListItem, TireSetLabel } from "@/components/tire-set-label";
import { errorBox, input, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api, Paged, TireSetListItem } from "@/lib/api";
import { foldSearch } from "@/lib/tire";

// Depodaki takımların etiketleri. Yazdırınca her etiket ayrı sayfa (100 × 60 mm) çıkar.
export default function LabelsPage() {
  const [items, setItems] = useState<TireSetListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api<Paged<TireSetListItem>>("/tire-sets?status=IN_STORAGE&pageSize=500")
      .then((d) => setItems([...d.items].sort((a, b) => (a.location ?? "").localeCompare(b.location ?? ""))))
      .catch((e: Error) => setError(e.message));
  }, []);

  const q = foldSearch(filter);
  const shown = items?.filter(
    (t) => q.length < 2 || foldSearch(`${t.location}${t.vehicle?.plate ?? ""}${t.customer.name}${t.code}`).includes(q),
  );

  return (
    <div className="space-y-4">
      <style>{`@media print { @page { size: 100mm 60mm; margin: 0; } }`}</style>
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Etiketler</h1>
          <p className="text-sm text-zinc-500">Depodaki takımlar, göz sırasına göre</p>
        </div>
        <div className="flex gap-2">
          <Link href="/lastikler" className={secondaryButton}>
            Lastik Bul
          </Link>
          <button type="button" onClick={() => window.print()} disabled={!shown?.length} className={primaryButton}>
            {shown ? `${shown.length} etiketi yazdır` : "Yazdır"}
          </button>
        </div>
      </div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Göz (B-04), plaka veya müşteri ile süz"
        className={`${input} max-w-sm print:hidden`}
      />
      {error && <div className={errorBox}>{error}</div>}
      {!items && !error && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
      <div className="flex flex-wrap gap-4 print:block">
        {shown?.map((t) => <TireSetLabel key={t.id} label={labelFromListItem(t)} />)}
      </div>
    </div>
  );
}
