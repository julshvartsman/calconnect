"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "calconnect.onboardingBanner.dismissed";
const HIDDEN_PATHS = ["/signin", "/onboarding", "/auth"];

export function OnboardingBannerClient() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed === null || dismissed) return null;
  if (HIDDEN_PATHS.some((prefix) => pathname.startsWith(prefix))) return null;

  const next = pathname || "/search";

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // localStorage unavailable — just hide for this session.
    }
    setDismissed(true);
  }

  return (
    <div className="border-b border-[var(--california-gold)]/40 bg-gradient-to-r from-[var(--california-gold)]/15 via-[var(--california-gold)]/10 to-transparent">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--california-gold)]/25 text-[var(--berkeley-blue-700)]">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </span>
          <p className="text-xs leading-relaxed text-slate-700 md:text-sm">
            <span className="font-semibold text-[var(--berkeley-blue-700)]">Finish your profile</span>
            <span className="hidden md:inline"> — </span>
            <span className="md:ml-0 ml-0 block md:inline">
              a one-minute survey helps us recommend resources tailored to your year and interests.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Link
            href={`/onboarding?next=${encodeURIComponent(next)}`}
            className="rounded-md bg-[var(--berkeley-blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--berkeley-blue-700)]"
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/50 hover:text-slate-700"
            aria-label="Dismiss"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
