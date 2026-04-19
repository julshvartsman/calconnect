"use client";

import { useEffect, useState } from "react";
import { trackSearchEvent } from "@/lib/analytics/client";
import { ResourceChatPanel } from "@/components/resource-chat-panel";

type SearchMeta = {
  sourceCount: number;
  cached: boolean;
  durationMs: number;
  scrapedAt: string;
};

type SearchResult = {
  query: string;
  summary: string;
  action_steps: string[];
  insights: { label: string; value: string }[];
  sources: { title: string; url: string; snippet?: string; category?: string }[];
  meta: SearchMeta;
  error?: string;
};

type Props = { query: string };

function domainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <div className="card-surface rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--berkeley-blue)] opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--berkeley-blue)]" />
          </span>
          <p className="text-sm text-slate-500">
            Searching Berkeley sources and summarizing...
          </p>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-slate-100" />
          <div className="h-4 w-4/6 animate-pulse rounded-md bg-slate-100" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CrewSearchResults({ query }: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeChatSource, setActiveChatSource] = useState<SearchResult["sources"][number] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const res = await fetch(`/api/crew-search?q=${encodeURIComponent(query)}`);
      const payload = (await res.json()) as SearchResult;
      if (!cancelled) {
        setResult(payload);
        setLoading(false);
        trackSearchEvent({
          eventType: payload.meta.sourceCount === 0 ? "search_no_results" : "search_results",
          query,
          path: "/search",
          resultCount: payload.meta.sourceCount,
          durationMs: payload.meta.durationMs,
          cached: payload.meta.cached,
          success: !payload.error && res.ok,
        });
      }
    }

    run().catch(() => {
      if (!cancelled) {
        trackSearchEvent({
          eventType: "search_results",
          query,
          path: "/search",
          resultCount: 0,
          durationMs: 0,
          cached: false,
          success: false,
        });
        setResult({
          query,
          summary: "Could not connect to search agents. Please try again.",
          action_steps: [],
          insights: [],
          sources: [],
          meta: { sourceCount: 0, cached: false, durationMs: 0, scrapedAt: new Date().toISOString() },
          error: "Request failed.",
        });
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [query]);

  if (loading) return <LoadingSkeleton />;
  if (!result) return null;

  const { meta } = result;

  return (
    <div className="mt-8">
      {/* Unified answer card */}
      <article className="card-surface overflow-hidden rounded-2xl">
        {/* Trust bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-6 py-2.5 text-xs text-slate-500">
          <span>{meta.sourceCount} source{meta.sourceCount !== 1 ? "s" : ""} analyzed</span>
          <span className="hidden sm:inline">·</span>
          <span>{meta.cached ? "Cached result" : `Scraped ${timeAgo(meta.scrapedAt)}`}</span>
          <span className="hidden sm:inline">·</span>
          <span>{meta.durationMs < 1000 ? `${meta.durationMs}ms` : `${(meta.durationMs / 1000).toFixed(1)}s`}</span>
        </div>

        <div className="p-6 sm:p-8">
          {/* Summary */}
          <h2 className="text-xl font-semibold text-slate-900">
            {result.query}
          </h2>
          <p className="mt-3 leading-relaxed text-slate-700">{result.summary}</p>
          {result.error && (
            <p className="mt-2 text-xs font-medium text-red-600">{result.error}</p>
          )}

          {/* Key insights grid */}
          {result.insights.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Key information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.insights.map((insight) => (
                  <div key={insight.label} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--berkeley-blue)]">
                      {insight.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {insight.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {result.action_steps.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                What to do next
              </h3>
              <ol className="space-y-2 pl-5 text-sm leading-relaxed text-slate-700" style={{ listStyleType: "decimal" }}>
                {result.action_steps.map((step, i) => (
                  <li key={i} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Sources
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.sources.map((source, i) => (
                  <div key={`${source.url}-${i}`} className="rounded-xl border border-slate-100 p-3 transition hover:border-[var(--berkeley-blue)]/20 hover:bg-blue-50/30">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackSearchEvent({
                          eventType: "result_clicked",
                          query,
                          path: "/search",
                          resultId: source.url,
                          resultRank: i + 1,
                          metadata: {
                            title: source.title,
                            category: source.category ?? null,
                          },
                        })
                      }
                      className="group flex items-start gap-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--berkeley-blue)]/10 text-[10px] font-bold text-[var(--berkeley-blue)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--berkeley-blue)] group-hover:underline">
                          {source.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="truncate text-xs text-slate-400">
                            {domainLabel(source.url)}
                          </span>
                          {source.category && (
                            <span className="shrink-0 rounded-full bg-[var(--california-gold)]/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {source.category}
                            </span>
                          )}
                        </div>
                        {source.snippet && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {source.snippet}
                          </p>
                        )}
                      </div>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChatSource(source);
                        trackSearchEvent({
                          eventType: "chat_opened",
                          query,
                          path: "/search",
                          metadata: { sourceTitle: source.title, sourceUrl: source.url, resultRank: i + 1 },
                        });
                      }}
                      className="mt-2 rounded-lg border border-[var(--berkeley-blue)]/25 px-2.5 py-1 text-xs font-semibold text-[var(--berkeley-blue)] hover:bg-[var(--berkeley-blue)]/5"
                    >
                      Ask about this
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeChatSource && (
            <ResourceChatPanel
              query={query}
              source={activeChatSource}
              onClose={() => setActiveChatSource(null)}
            />
          )}
        </div>
      </article>
    </div>
  );
}
