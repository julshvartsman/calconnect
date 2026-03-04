"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/search", label: "Search", icon: "🔍", exact: false },
  { href: "/browse", label: "Browse", icon: "📋", exact: false },
  { href: "/map", label: "Map", icon: "📍", exact: false },
  { href: "/recommendations", label: "For You", icon: "✨", exact: false },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/search" className="text-2xl font-bold leading-none tracking-tight">
          <span className="text-[var(--berkeley-blue)]">Cal</span>
          <span className="text-[var(--california-gold)]">Connect</span>
        </Link>

        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "text-[var(--berkeley-blue)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="mr-1.5 hidden sm:inline">{tab.icon}</span>
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-3 h-0.5 rounded-full bg-[var(--california-gold)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
