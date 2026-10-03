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
    return <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">API bağlantısı yok</span>;
  }
  if (!settings) return null;

  const demo = settings.source === "env";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        demo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
      }`}
      title={`${settings.server}/${settings.database}`}
    >
      {demo ? "Örnek veri" : "LOGO"} · {settings.database} · Firma {settings.firmNo}
    </span>
  );
}
