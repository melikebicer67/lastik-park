"use client";

import { useEffect, useState } from "react";
import { api, LogoPerson, LogoSalesman } from "@/lib/api";

export default function PersonnelPage() {
  const [salesmen, setSalesmen] = useState<LogoSalesman[] | null>(null);
  const [personnel, setPersonnel] = useState<{ available: boolean; items: LogoPerson[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<LogoSalesman[]>("/logo/salesmen"),
      api<{ available: boolean; items: LogoPerson[] }>("/logo/personnel"),
    ])
      .then(([s, p]) => {
        setSalesmen(s);
        setPersonnel(p);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Personel</h1>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-2">
        <h2 className="font-medium">Satış elemanları <span className="text-sm text-zinc-500">(LG_SLSMAN)</span></h2>
        <List
          rows={salesmen?.map((s) => ({ key: s.logoRef, code: s.code, name: s.name, extra: s.position || s.phone, active: s.active }))}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Bordro personeli <span className="text-sm text-zinc-500">(Bordro Plus)</span></h2>
        {personnel && !personnel.available ? (
          <p className="text-sm text-zinc-500">Bu firmada Bordro Plus personel tablosu bulunamadı.</p>
        ) : (
          <List
            rows={personnel?.items.map((p) => ({ key: p.logoRef, code: p.code, name: `${p.firstName} ${p.lastName}`, extra: "", active: p.active }))}
          />
        )}
      </section>
    </div>
  );
}

function List({ rows }: { rows?: { key: number; code: string; name: string; extra: string; active: boolean }[] }) {
  if (!rows) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  if (rows.length === 0) return <p className="text-sm text-zinc-500">Kayıt yok</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
              <td className="w-28 px-3 py-2 font-mono text-xs">{r.code}</td>
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2 text-zinc-500">{r.extra}</td>
              <td className="px-3 py-2 text-right">
                <span className={r.active ? "text-emerald-600" : "text-zinc-400"}>{r.active ? "Aktif" : "Pasif"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
