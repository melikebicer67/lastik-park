"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryButton } from "@/components/ui/styles";

const TABS = [
  { href: "/satinalma", label: "Rapor" },
  { href: "/satinalma/alimlar", label: "Alımlar" },
  { href: "/satinalma/tedarikciler", label: "Tedarikçiler" },
];

export function PurchasingTabs() {
  const path = usePathname();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 print:hidden dark:border-zinc-800">
      <nav className="flex gap-1">
        {TABS.map((t) => {
          const active = t.href === "/satinalma" ? path === t.href : path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
                active ? "border-brand text-foreground" : "border-transparent text-zinc-500 hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/satinalma/yeni" className={`${primaryButton} mb-2`}>
        + Yeni alım
      </Link>
    </div>
  );
}
