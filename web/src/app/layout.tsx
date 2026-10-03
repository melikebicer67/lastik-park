import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ConnectionBadge } from "@/components/connection-badge";
import { NavLink } from "@/components/nav-link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Lastik Park",
  description: "Lastik oteli yönetimi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 p-4 md:block dark:border-zinc-800">
          <div className="mb-6 px-3 text-lg font-semibold">Lastik Park</div>
          <nav className="space-y-1">
            <NavLink href="/musteriler">Müşteriler</NavLink>
            <NavLink href="/personel">Personel</NavLink>
            <NavLink href="/ayarlar/logo">LOGO Ayarları</NavLink>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 md:px-6 dark:border-zinc-800">
            <nav className="flex gap-3 text-sm md:hidden">
              <Link href="/musteriler">Müşteriler</Link>
              <Link href="/personel">Personel</Link>
              <Link href="/ayarlar/logo">Ayarlar</Link>
            </nav>
            <div className="ml-auto">
              <ConnectionBadge />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
