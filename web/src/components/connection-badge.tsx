"use client";

import { useEffect, useState } from "react";
import { api, LogoSettings } from "@/lib/api";

// Hangi LOGO'ya bağlı olunduğunu gösterir: demoda örnek veri mi gerçek veri mi karışmasın
export function ConnectionBadge() {
  const [settings, setSettings] = useState<LogoSettings | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = () =>
      api<LogoSettings>("/settings/logo")
        .then((s) => {
          setSettings(s);
          setError(false);
        })
        .catch(() => setError(true));
    load();
    window.addEventListener("logo-settings-changed", load);
    return () => window.removeEventListener("logo-settings-changed", load);
  }, []);

  if (error) {
    return <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand">API bağlantısı yok</span>;
  }
  if (!settings) return null;

  const demo = settings.source === "env";
  return (
    <span
      className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink"
      title={`${settings.server}/${settings.database}`}
    >
      <span className={`h-2 w-2 rounded-full ${demo ? "bg-amber-400" : "bg-emerald-500"}`} />
      {demo ? "Örnek veri" : "LOGO"}
      <span className="hidden sm:inline">
        · {settings.database} · Firma {settings.firmNo}
      </span>
    </span>
  );
}
