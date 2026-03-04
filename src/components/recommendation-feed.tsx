/**
 * Personalized recommendation feed.
 *
 * Reads the user's local search history, fetches matching resources
 * from the API, and renders them as flippable cards. The visual style
 * mirrors the Search page's dark hero + gold accent aesthetic.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Resource = {
  id: string;
  name: string;
  shortDescription: string;
  eligibilityText: string;
  requirementsLink: string | null;
  category: { name: string };
  summaryJson: unknown;
};

const SEARCH_HISTORY_KEY = "calconnect.searchHistory";

function readSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function keyPoints(summaryJson: unknown): string[] {
  if (!summaryJson || typeof summaryJson !== "object") return [];
  const points = (summaryJson as { keyPoints?: string[] }).keyPoints;
  return Array.isArray(points) ? points.slice(0, 3) : [];
}

export function RecommendationFeed() {
  const [history] = useState<string[]>(() => readSearchHistory());
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!history.length) {
        setLoading(false);
        return;
      }

      const uniqueById = new Map<string, Resource>();
      const terms = history.slice(0, 6);

      for (let i = 0; i < terms.length; i += 2) {
        if (cancelled) return;
        const batch = terms.slice(i, i + 2);
        const responses = await Promise.all(
          batch.map(async (term) => {
            const response = await fetch(`/api/resources?search=${encodeURIComponent(term)}&limit=8`);
            if (!response.ok) return [];
            return (await response.json()) as Resource[];
          }),
        );
        for (const item of responses.flat()) {
          if (!uniqueById.has(item.id)) uniqueById.set(item.id, item);
        }
      }

      if (!cancelled) {
        setResults(Array.from(uniqueById.values()).slice(0, 20));
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [history]);

  const introText = useMemo(() => {
    if (!history.length) return null;
    return history.slice(0, 5).join(", ");
  }, [history]);

  // ── Empty state ────────────────────────────────────────────────────────

  if (!loading && !history.length) {
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
          Use the search page first. We&apos;ll use your history to surface relevant resources here.
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

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card-surface animate-pulse rounded-2xl p-5"
          >
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-5 w-3/4 rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-slate-50" />
              <div className="h-3 w-5/6 rounded bg-slate-50" />
            </div>
            <div className="mt-5 h-3 w-24 rounded bg-slate-50" />
          </div>
        ))}
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────

  return (
    <section className="space-y-5">
      {introText && (
        <p className="text-sm text-slate-500">
          Based on your recent searches: <span className="font-medium text-slate-700">{introText}</span>
        </p>
      )}

      {results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-lg font-medium text-slate-400">No matching resources found</p>
          <p className="mt-1 text-sm text-slate-400">Try searching for different topics to get recommendations.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((resource) => {
          const isFlipped = Boolean(flipped[resource.id]);
          const points = keyPoints(resource.summaryJson);
          return (
            <div
              key={resource.id}
              className={`flip-card ${isFlipped ? "flipped" : ""}`}
              onClick={() =>
                setFlipped((current) => ({ ...current, [resource.id]: !current[resource.id] }))
              }
            >
              <div className="flip-card-inner">
                {/* Front */}
                <article className="flip-face card-surface rounded-2xl p-5">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {resource.category.name}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                    {resource.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {resource.shortDescription}
                  </p>
                  <p className="mt-4 text-xs text-slate-400">
                    Tap for details
                  </p>
                </article>

                {/* Back */}
                <article className="flip-face flip-back card-surface rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-[var(--berkeley-blue)]">
                    Why this may help
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {resource.eligibilityText}
                  </p>
                  {points.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {points.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--california-gold)]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/resources/${resource.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-[var(--berkeley-blue)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--berkeley-blue)] transition hover:bg-[var(--berkeley-blue)]/5"
                    >
                      Learn more
                    </Link>
                    {resource.requirementsLink && (
                      <a
                        href={resource.requirementsLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-[var(--berkeley-blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--berkeley-blue-700)]"
                      >
                        Open form
                      </a>
                    )}
                  </div>
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
