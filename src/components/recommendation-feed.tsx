/**
 * Personalized recommendation feed.
 *
 * Pulls from /api/recommendations — server-side scoring against the user's
 * DB-backed search history (SearchEvent). Each card shows an explicit
 * "matched from: <past query>" attribution so users understand why it's
 * being recommended. No flip interaction — details are inline.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Recommendation = {
  id: string;
  name: string;
  shortDescription: string;
  eligibilityText: string;
  isAppointmentRequired: boolean;
  walkInAllowed: boolean;
  websiteUrl: string | null;
  requirementsLink: string | null;
  category: { name: string; slug: string; label: string };
  location: { buildingName: string | null; room: string | null; address: string } | null;
  hoursText: string | null;
  tags: string[];
  matchingQueries: string[];
  score: number;
};

type Payload = {
  items: Recommendation[];
  basedOn: string[];
  error?: string;
};

function formatLocation(loc: Recommendation["location"]): string | null {
  if (!loc) return null;
  if (loc.buildingName) {
    return loc.room ? `${loc.buildingName}, ${loc.room}` : loc.buildingName;
  }
  return loc.address?.trim() || null;
}

export function RecommendationFeed() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recommendations", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Recommendations request failed (${res.status})`);
        }
        const payload = (await res.json()) as Payload;
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load recommendations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface animate-pulse rounded-2xl p-5">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-5 w-3/4 rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-slate-50" />
              <div className="h-3 w-5/6 rounded bg-slate-50" />
            </div>
            <div className="mt-5 h-8 w-32 rounded bg-slate-50" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  // ── Empty: no search history ───────────────────────────────────────────
  if (!data || data.basedOn.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900">No recommendations yet</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Run a few searches first. We&apos;ll use your history to surface the most relevant resources here.
        </p>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--berkeley-blue)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)]"
        >
          Go to Search
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    );
  }

  // ── Empty: history but no matches ──────────────────────────────────────
  if (data.items.length === 0) {
    return (
      <section className="space-y-5">
        <BasedOnStrip queries={data.basedOn} />
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            We couldn&apos;t match your history to our curated directory yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try a few different queries — the directory is growing, and matches improve as it does.
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Browse all resources
          </Link>
        </div>
      </section>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────
  return (
    <section className="space-y-5">
      <BasedOnStrip queries={data.basedOn} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────

function BasedOnStrip({ queries }: { queries: string[] }) {
  if (queries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">
      <span className="shrink-0 font-medium text-slate-500">Based on</span>
      {queries.slice(0, 6).map((q) => (
        <Link
          key={q}
          href={`/search?q=${encodeURIComponent(q)}`}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[var(--berkeley-blue)]/30 hover:bg-[var(--berkeley-blue)]/5 hover:text-[var(--berkeley-blue)]"
          title={`Re-run search: ${q}`}
        >
          {q}
        </Link>
      ))}
    </div>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  const locationText = formatLocation(item.location);

  const accessLabel =
    item.isAppointmentRequired && !item.walkInAllowed
      ? "Appointment"
      : item.walkInAllowed && !item.isAppointmentRequired
        ? "Walk-in"
        : item.walkInAllowed && item.isAppointmentRequired
          ? "Walk-in or appt."
          : null;

  return (
    <article className="card-surface group flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block rounded-full bg-[var(--berkeley-blue)]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--berkeley-blue)]">
          {item.category.label}
        </span>
      </div>

      <h3 className="mt-3 font-serif text-lg font-semibold leading-snug text-slate-900">
        {item.name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 line-clamp-3">
        {item.shortDescription}
      </p>

      {/* Info chips */}
      {(accessLabel || locationText || item.hoursText) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {accessLabel && <InfoChip icon="access" text={accessLabel} />}
          {locationText && <InfoChip icon="pin" text={locationText} />}
          {item.hoursText && <InfoChip icon="clock" text={item.hoursText} />}
        </div>
      )}

      {/* Why recommended */}
      {item.matchingQueries.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--california-gold)]/30 bg-[var(--california-gold)]/5 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--berkeley-blue-700)]">
            Why we&apos;re suggesting this
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            Matches your search
            {item.matchingQueries.length > 1 ? "es " : " "}
            {item.matchingQueries.map((q, i) => (
              <span key={q}>
                {i > 0 && ", "}
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="font-medium text-[var(--berkeley-blue)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  &ldquo;{q}&rdquo;
                </Link>
              </span>
            ))}
            .
          </p>
        </div>
      )}

      {/* Spacer to push CTAs to bottom */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/resources/${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--berkeley-blue)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[var(--berkeley-blue-700)]"
        >
          View details
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {item.websiteUrl && (
          <a
            href={item.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Visit website
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M14 5h5v5M10 14L20 4M19 13v6H5V5h6" />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}

function InfoChip({ icon, text }: { icon: "clock" | "pin" | "access"; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
      <ChipIcon name={icon} />
      <span className="truncate">{text}</span>
    </span>
  );
}

function ChipIcon({ name }: { name: "clock" | "pin" | "access" }) {
  const common = "h-3 w-3 shrink-0";
  if (name === "clock") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}
