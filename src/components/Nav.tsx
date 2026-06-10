"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/import", label: "Import" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4">
        <Link href="/" className="flex items-baseline gap-1 select-none">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            optra
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-emerald-100 text-slate-950"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
