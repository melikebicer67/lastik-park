"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dangerButton, errorBox, secondaryButton } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { formatInt, formatTL, PurchaseDetail, SUPPLIER_TYPE_LABELS } from "@/lib/purchasing";
import { formatTireSize, SEASON_LABELS } from "@/lib/tire";

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{ id: string; data?: PurchaseDetail; error?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<PurchaseDetail>(`/purchases/${id}`)
      .then((data) => !cancelled && setResult({ id, data }))
      .catch((e: Error) => !cancelled && setResult({ id, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (result?.error) return <div className={errorBox}>{result.error}</div>;
  const p = result?.id === id ? result.data : undefined;
  if (!p) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;

  const net = p.lines.reduce((n, l) => n + l.quantity * Number(l.unitPrice), 0);
  const vat = p.lines.reduce((n, l) => n + l.quantity * Number(l.unitPrice) * (l.vatRate / 100), 0);

  const remove = async () => {
    try {
      await api(`/purchases/${p.id}`, { method: "DELETE" });
      router.push("/satinalma/alimlar");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-zinc-500">{SUPPLIER_TYPE_LABELS[p.supplier.type]}</div>
          <h2 className="text-lg font-semibold">{p.supplier.name}</h2>
          <p className="text-sm text-zinc-500">
            {new Date(p.purchaseDate).toLocaleDateString("tr-TR")}
            {p.documentNo ? ` · Belge ${p.documentNo}` : ""}
            {p.createdBy ? ` · Giren: ${p.createdBy.name}` : ""}
          </p>
          {p.note && <p className="mt-1 text-sm">{p.note}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/satinalma/alimlar" className={secondaryButton}>
            Alımlar
          </Link>
          {confirmDelete ? (
            <>
              <span className="self-center text-sm">Alım silinsin mi?</span>
              <button type="button" onClick={remove} className={dangerButton}>
                Evet, sil
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={secondaryButton}>
                Vazgeç
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={secondaryButton}>
              Sil
            </button>
          )}
        </div>
      </div>
      {error && <div className={errorBox}>{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Marka / desen</th>
              <th className="px-3 py-2">Ebat</th>
              <th className="px-3 py-2">Mevsim</th>
              <th className="px-3 py-2 text-right">Adet</th>
              <th className="px-3 py-2 text-right">Birim fiyat</th>
              <th className="px-3 py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2">{[l.brand, l.pattern].filter(Boolean).join(" ")}</td>
                <td className="px-3 py-2 font-mono">{formatTireSize(l)}</td>
                <td className="px-3 py-2">{SEASON_LABELS[l.season]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatInt(l.quantity)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatTL(Number(l.unitPrice))}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatTL(l.quantity * Number(l.unitPrice))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-200 text-right dark:border-zinc-700">
            <tr>
              <td colSpan={5} className="px-3 py-1 text-zinc-500">Ara toplam</td>
              <td className="px-3 py-1 tabular-nums">{formatTL(net)}</td>
            </tr>
            <tr>
              <td colSpan={5} className="px-3 py-1 text-zinc-500">KDV</td>
              <td className="px-3 py-1 tabular-nums">{formatTL(vat)}</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={5} className="px-3 py-2">Genel toplam</td>
              <td className="px-3 py-2 tabular-nums">{formatTL(net + vat)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
