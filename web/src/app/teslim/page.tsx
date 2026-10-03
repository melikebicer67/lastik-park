"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CustomerHistoryTable } from "@/components/customer-history-table";
import { EmployeeSelect } from "@/components/employee-select";
import { TireSetPicker } from "@/components/tire-set-picker";
import { Field, Section } from "@/components/ui/section";
import { errorBox, input, primaryButton, secondaryButton } from "@/components/ui/styles";
import { api, CustomerHistory, TireSetDetail } from "@/lib/api";
import { daysSince, formatDate, formatPlate, formatTireSize, RIM_LABELS, SEASON_LABELS, SEASON_STYLES } from "@/lib/tire";

export default function CheckOutPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Yükleniyor…</p>}>
      <CheckOut />
    </Suspense>
  );
}

function CheckOut() {
  const router = useRouter();
  // Takım sayfasındaki "Teslim et" butonu ?takim=ID ile gelir
  const selectedId = Number(useSearchParams().get("takim")) || null;
  const [loaded, setLoaded] = useState<{ id: number; set?: TireSetDetail; error?: string } | null>(null);
  const [delivered, setDelivered] = useState<{ set: TireSetDetail; location: string } | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    api<TireSetDetail>(`/tire-sets/${selectedId}`)
      .then((set) => !cancelled && setLoaded({ id: selectedId, set }))
      .catch((e: Error) => !cancelled && setLoaded({ id: selectedId, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const pick = (id: number) => {
    setDelivered(null);
    router.push(`/teslim?takim=${id}`);
  };
  const reset = () => {
    setDelivered(null);
    router.push("/teslim");
  };

  const current = selectedId && loaded?.id === selectedId ? loaded : null;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Lastik Teslim</h1>
        <p className="text-sm text-zinc-500">Depodaki lastikleri müşteriye teslim edin</p>
      </div>

      {delivered ? (
        <Delivered set={delivered.set} location={delivered.location} onNext={reset} />
      ) : !selectedId ? (
        <Section step={1} title="Takımı bulun">
          <TireSetPicker onPick={pick} />
        </Section>
      ) : !current ? (
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      ) : current.error ? (
        <div className="space-y-3">
          <div className={errorBox}>{current.error}</div>
          <button type="button" onClick={reset} className={secondaryButton}>
            Başka takım ara
          </button>
        </div>
      ) : current.set!.status !== "IN_STORAGE" ? (
        <div className="space-y-3">
          <div className={errorBox}>
            {current.set!.code} depoda değil
            {current.set!.stays[0]?.checkOutAt
              ? `, ${new Date(current.set!.stays[0].checkOutAt).toLocaleString("tr-TR")} tarihinde teslim edilmiş`
              : ""}
            .
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className={secondaryButton}>
              Başka takım ara
            </button>
            <Link href={`/takim/${current.set!.id}`} className={secondaryButton}>
              Takımı görüntüle
            </Link>
          </div>
        </div>
      ) : (
        <Confirm
          set={current.set!}
          onCancel={reset}
          onDone={(set, location) => setDelivered({ set, location })}
        />
      )}
    </div>
  );
}

function Confirm({
  set,
  onCancel,
  onDone,
}: {
  set: TireSetDetail;
  onCancel: () => void;
  onDone: (set: TireSetDetail, location: string) => void;
}) {
  const stay = set.stays.find((s) => !s.checkOutAt) ?? null;
  const location = set.currentLocation?.code ?? "—";
  const hasPrice = stay?.price != null;
  const extras = [set.hasBolts && "Bijonlar", set.hasHubcaps && "Jant kapakları"].filter(Boolean) as string[];

  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [paid, setPaid] = useState(stay?.paid ?? false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allChecked = extras.every((x) => checked[x]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<TireSetDetail>(`/tire-sets/${set.id}/check-out`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: employeeId ?? undefined,
          price: !hasPrice && price ? Number(price.replace(",", ".")) : undefined,
          paid,
          note: note || undefined,
        }),
      });
      onDone(updated, location);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const sizes = [...new Set(set.tires.map((t) => formatTireSize(t)))].join(", ");
  const brands = [...new Set(set.tires.map((t) => [t.brand, t.pattern].filter(Boolean).join(" ")))].join(", ");
  const worn = set.tires.filter((t) => t.condition !== "GOOD");

  return (
    <div className="space-y-4">
      {/* Personelin raftan alacağı yer: en üstte, büyük */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg bg-ink p-5 text-white">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/60">Raftan alın</div>
          <div className="font-mono text-5xl font-bold leading-none">{location}</div>
          <div className="mt-1 text-sm text-white/70">{set.currentLocation?.warehouse.name}</div>
        </div>
        <div className="min-w-0 flex-1">
          {set.vehicle && <div className="font-mono text-2xl font-bold">{formatPlate(set.vehicle.plate)}</div>}
          <div className="truncate text-lg font-semibold">{set.customer.name}</div>
          <div className="text-sm text-white/70">
            {[set.vehicle && [set.vehicle.brand, set.vehicle.model].filter(Boolean).join(" "), set.customer.phone]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {stay && (
          <div className="border-l border-white/20 pl-6">
            <div className="text-xs uppercase tracking-wide text-white/60">Kabul tarihi</div>
            <div className="text-xl font-bold">{formatDate(stay.checkInAt)}</div>
            <div className="text-sm text-white/80">
              <span className="text-2xl font-bold text-white">{daysSince(stay.checkInAt)}</span> gündür depoda
            </div>
          </div>
        )}
        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${SEASON_STYLES[set.season]}`}>
            {SEASON_LABELS[set.season]}
          </span>
          <div className="mt-2 font-mono text-xs text-white/60">{set.code}</div>
        </div>
      </div>

      <Section step={1} title="Takımı kontrol edin">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-1">
            <div>
              <span className="text-zinc-500">Lastik: </span>
              {set.quantity} adet {brands}
            </div>
            <div>
              <span className="text-zinc-500">Ebat: </span>
              <span className="font-mono">{sizes}</span>
            </div>
            <div>
              <span className="text-zinc-500">Jant: </span>
              {RIM_LABELS[set.rimType]}
            </div>
            {stay && (
              <div>
                <span className="text-zinc-500">Teslim alan: </span>
                {stay.checkInBy?.name ?? "—"}
                {stay.mileageKm ? ` · ${stay.mileageKm.toLocaleString("tr-TR")} km` : ""}
              </div>
            )}
            {set.note && (
              <div>
                <span className="text-zinc-500">Not: </span>
                {set.note}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {extras.length > 0 ? (
              <>
                <div className="font-medium">Takımla birlikte verilecekler</div>
                {extras.map((x) => (
                  <label key={x} className="flex items-center gap-2">
                    <input type="checkbox" checked={!!checked[x]} onChange={(e) => setChecked({ ...checked, [x]: e.target.checked })} />
                    {x}
                  </label>
                ))}
              </>
            ) : (
              <div className="text-zinc-500">Takımla birlikte ek parça yok.</div>
            )}
            {worn.length > 0 && (
              <div className="rounded-md bg-amber-50 p-2 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                {worn.length} lastik aşınmış/hasarlı olarak kayıtlı. Müşteriye bilgi verin.
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section step={2} title="Ödeme ve teslim">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ücret">
            {hasPrice ? (
              <div className="py-2 text-lg font-semibold">{Number(stay!.price).toLocaleString("tr-TR")} ₺</div>
            ) : (
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="1500" className={input} />
            )}
          </Field>
          <Field label="Tahsilat">
            {stay?.paid ? (
              <div className="py-2 font-medium text-emerald-600">Kabulde ödendi</div>
            ) : (
              <label className="flex items-center gap-2 py-2">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                Ücret tahsil edildi
              </label>
            )}
          </Field>
          <Field label="Teslim eden">
            <EmployeeSelect value={employeeId} onChange={setEmployeeId} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Not">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. balans yapıldı" className={input} />
          </Field>
        </div>
      </Section>

      <Section step={3} title="Müşteri geçmişi">
        <HistoryPanel customerId={set.customer.id} />
      </Section>

      {error && <div className={errorBox}>{error}</div>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!allChecked && <span className="text-sm text-zinc-500">Ek parçaları işaretleyin</span>}
        {!stay?.paid && !paid && <span className="text-sm text-amber-600">Ücret tahsil edilmedi olarak kaydedilecek</span>}
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Vazgeç
        </button>
        <button type="button" onClick={submit} disabled={saving || !allChecked} className={primaryButton}>
          {saving ? "Kaydediliyor…" : "Teslim et"}
        </button>
      </div>
    </div>
  );
}

// Değişimde müşteriye geçmişini göstermek için son kayıtlar; tam rapor ayrı sayfada
function HistoryPanel({ customerId }: { customerId: number }) {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CustomerHistory>(`/customers/${customerId}/history`)
      .then(setHistory)
      .catch((e: Error) => setError(e.message));
  }, [customerId]);

  if (error) return <div className={errorBox}>{error}</div>;
  if (!history) return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  const s = history.summary;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-zinc-500">Toplam kayıt:</span> <b>{s.stays}</b>
        </span>
        {s.firstCheckInAt && (
          <span>
            <span className="text-zinc-500">İlk kayıt:</span> <b>{formatDate(s.firstCheckInAt)}</b>
          </span>
        )}
        {s.avgDays != null && (
          <span>
            <span className="text-zinc-500">Ortalama kalış:</span> <b>{s.avgDays} gün</b>
          </span>
        )}
        {s.unpaid > 0 && (
          <span className="font-semibold text-amber-600">Ödenmemiş: {s.unpaid.toLocaleString("tr-TR")} ₺</span>
        )}
        <Link href={`/musteri/${customerId}`} className="ml-auto font-semibold text-brand hover:underline">
          Tam raporu aç →
        </Link>
      </div>
      <CustomerHistoryTable items={history.items.slice(0, 5)} compact />
    </div>
  );
}

function Delivered({ set, location, onNext }: { set: TireSetDetail; location: string; onNext: () => void }) {
  // Kışlık verildiyse araçtan yazlık sökülür (ve tersi)
  const incoming = set.season === "WINTER" ? "SUMMER" : "WINTER";
  const kabulHref = `/kabul?musteri=${set.customer.id}${set.vehicle ? `&arac=${set.vehicle.id}` : ""}&mevsim=${incoming}`;
  return (
    <div className="space-y-4 rounded-lg border border-emerald-200 p-6 dark:border-emerald-900">
      <div>
        <div className="text-lg font-semibold text-emerald-700">Teslim edildi</div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-mono">{set.code}</span> · {set.customer.name}
          {set.vehicle ? ` · ${formatPlate(set.vehicle.plate)}` : ""}. <span className="font-mono font-semibold">{location}</span> gözü
          boşaldı.
        </p>
      </div>
      <div className="rounded-md bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
        <div className="font-medium">Sezon değişimi mi?</div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Araçtan sökülen {set.season === "WINTER" ? "yazlık" : "kışlık"} lastikleri şimdi depoya alabilirsiniz. Müşteri ve araç seçili gelir.
        </p>
        <Link href={kabulHref} className={`${primaryButton} mt-3 inline-block`}>
          Araçtaki lastikleri depoya al
        </Link>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onNext} className={secondaryButton}>
          Yeni teslim
        </button>
        <Link href={`/takim/${set.id}`} className={secondaryButton}>
          Takım kaydını görüntüle
        </Link>
        <Link href={`/musteri/${set.customer.id}`} className={secondaryButton}>
          Müşteri geçmişi
        </Link>
      </div>
    </div>
  );
}
