import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ConnectionBadge } from "@/components/connection-badge";
import { NavLink } from "@/components/nav-link";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const DEALER = process.env.NEXT_PUBLIC_DEALER_NAME;
const BRANCH = process.env.NEXT_PUBLIC_DEALER_BRANCH;

export const metadata: Metadata = {
  title: DEALER ? `LastikPark · ${DEALER}` : "LastikPark",
  description: "Lastik oteli yönetimi",
};

const NAV = [
  { href: "/lastikler", label: "Lastik Bul" },
  { href: "/kabul", label: "Lastik Kabul" },
  { href: "/teslim", label: "Lastik Teslim" },
  { href: "/depo", label: "Depo" },
  { href: "/musteriler", label: "Müşteriler" },
  { href: "/personel", label: "Personel" },
  { href: "/ayarlar/logo", label: "LOGO Ayarları" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col print:min-h-0">
        <header className="flex items-center gap-4 bg-brand-bright px-4 py-3 text-white md:px-6 print:hidden">
          <Link href="/lastikler" className="shrink-0">
            <BrandLogo />
          </Link>
          {DEALER && (
            <div className="hidden border-l border-white/40 pl-4 leading-tight sm:block">
              <div className="text-sm font-bold">{DEALER}</div>
              {BRANCH && <div className="text-xs text-white/85">{BRANCH} Bayi</div>}
            </div>
          )}
          <div className="ml-auto">
            <ConnectionBadge />
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto bg-ink [scrollbar-width:none] px-2 py-2 md:hidden print:hidden">
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-1">
          <aside className="hidden w-56 shrink-0 bg-ink p-3 md:block print:hidden">
            <nav className="space-y-1">
              {NAV.map((n) => (
                <NavLink key={n.href} href={n.href}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 p-4 md:p-6 print:p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
