"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ConnectionTestResult, LogoSettings } from "@/lib/api";

interface Form {
  server: string;
  port: string;
  database: string;
  user: string;
  password: string;
  firmNo: string;
  periodNo: string;
  encrypt: boolean;
}

const toForm = (s: LogoSettings): Form => ({
  server: s.server,
  port: String(s.port),
  database: s.database,
  user: s.user,
  password: "",
  firmNo: s.firmNo,
  periodNo: s.periodNo,
  encrypt: s.encrypt,
});

export default function LogoSettingsPage() {
  const [settings, setSettings] = useState<LogoSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [test, setTest] = useState<ConnectionTestResult | null>(null);
  const [busy, setBusy] = useState<"test" | "save" | "reset" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const apply = (s: LogoSettings) => {
    setSettings(s);
    setForm(toForm(s));
    window.dispatchEvent(new Event("logo-settings-changed"));
  };

  useEffect(() => {
    api<LogoSettings>("/settings/logo")
      .then((s) => {
        setSettings(s);
        setForm(toForm(s));
      })
      .catch((e: Error) => setMessage({ ok: false, text: e.message }));
  }, []);

  if (!form) {
    return message ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message.text}</div> : null;
  }

  const body = () =>
    JSON.stringify({
      ...form,
      port: Number(form.port),
      password: form.password || undefined,
    });

  const run = async (kind: "test" | "save" | "reset", fn: () => Promise<void>) => {
    setBusy(kind);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const onTest = () =>
    run("test", async () => {
      setTest(null);
      setTest(await api<ConnectionTestResult>("/logo/connection/test", { method: "POST", body: body() }));
    });

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    run("save", async () => {
      apply(await api<LogoSettings>("/settings/logo", { method: "PUT", body: body() }));
      setMessage({ ok: true, text: "Bağlantı kaydedildi. Uygulama artık bu LOGO veritabanını kullanıyor." });
    });
  };

  const onReset = () =>
    run("reset", async () => {
      setConfirmReset(false);
      setTest(null);
      apply(await api<LogoSettings>("/settings/logo", { method: "DELETE" }));
      setMessage({ ok: true, text: "Kayıtlı bağlantı silindi, örnek veritabanına dönüldü." });
    });

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">LOGO Bağlantısı</h1>
        <p className="text-sm text-zinc-500">
          {settings?.source === "db"
            ? "Kayıtlı bağlantı kullanılıyor."
            : "Henüz bağlantı kaydedilmedi; .env'deki örnek veritabanı kullanılıyor."}{" "}
          {"Uygulama LOGO'ya sadece okuma yapar."}
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field label="SQL Server adresi">
            <input required value={form.server} onChange={set("server")} placeholder="192.168.1.10 veya SUNUCU\LOGO" className={input} />
          </Field>
          <Field label="Port">
            <input required type="number" value={form.port} onChange={set("port")} className={input} />
          </Field>
        </div>
        <Field label="Veritabanı">
          <input required value={form.database} onChange={set("database")} placeholder="LOGODB" className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kullanıcı">
            <input required value={form.user} onChange={set("user")} autoComplete="off" className={input} />
          </Field>
          <Field label="Şifre" hint={settings?.hasPassword ? "Boş bırakılırsa kayıtlı şifre kullanılır" : undefined}>
            <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" className={input} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Firma no" hint="Örn. 001 → LG_001_CLCARD">
            <input required value={form.firmNo} onChange={set("firmNo")} maxLength={3} className={input} />
          </Field>
          <Field label="Dönem no">
            <input required value={form.periodNo} onChange={set("periodNo")} maxLength={2} className={input} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.encrypt} onChange={set("encrypt")} />
          Şifreli bağlantı (TLS)
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={onTest} disabled={busy !== null} className={secondary}>
            {busy === "test" ? "Deneniyor…" : "Bağlantıyı test et"}
          </button>
          <button type="submit" disabled={busy !== null} className={primary}>
            {busy === "save" ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {settings?.source === "db" &&
            (confirmReset ? (
              <span className="flex items-center gap-2 text-sm">
                Kayıtlı bağlantı silinsin mi?
                <button type="button" onClick={onReset} disabled={busy !== null} className={danger}>
                  Evet, sil
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className={secondary}>
                  Vazgeç
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className={secondary}>
                Örnek veriye dön
              </button>
            ))}
        </div>
      </form>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {test && <TestResult result={test} />}
    </div>
  );
}

function TestResult({ result }: { result: ConnectionTestResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        <div className="font-medium">Bağlantı başarısız</div>
        <div>{result.error}</div>
      </div>
    );
  }
  const rows = result.tables ? [
    ["Müşteriler", result.tables.customers],
    ["Satış elemanları", result.tables.salesmen],
    ["Bordro personeli", result.tables.personnel],
  ] as const : [];
  return (
    <div className="space-y-3 rounded-md border border-emerald-200 p-4 text-sm dark:border-emerald-900">
      <div className="font-medium text-emerald-700">Bağlantı başarılı ({result.durationMs} ms)</div>
      <div className="text-xs text-zinc-500">{result.serverVersion}</div>
      <table className="w-full">
        <tbody>
          {rows.map(([label, t]) => (
            <tr key={t.name} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5">{label}</td>
              <td className="py-1.5 font-mono text-xs">{t.name}</td>
              <td className="py-1.5 text-right">
                {t.exists ? <span className="text-emerald-600">{t.rowCount} kayıt</span> : <span className="text-zinc-400">tablo yok</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

const input = "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";
const primary = "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";
const secondary = "rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700";
const danger = "rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50";
