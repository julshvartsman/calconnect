"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackSearchEvent } from "@/lib/analytics/client";

type SearchInputProps = {
  defaultValue?: string;
};

const SEARCH_HISTORY_KEY = "calconnect.searchHistory";

function saveSearchQuery(query: string) {
  if (!query) return;
  try {
    const existing = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? "[]");
    const unique = [query, ...existing.filter((item: string) => item !== query)];
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(unique.slice(0, 15)));
  } catch {
    /* ignore */
  }
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      trackSearchEvent({
        eventType: "search_submitted",
        query: trimmed,
        path: window.location.pathname,
      });
    }
    saveSearchQuery(trimmed);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)] transition focus-within:border-[var(--berkeley-blue)]/25 focus-within:shadow-[0_8px_32px_-12px_rgba(0,50,98,0.18)] focus-within:ring-2 focus-within:ring-[var(--california-gold)]/25">
        <svg
          className="ml-3 h-5 w-5 shrink-0 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you need help with?"
          autoFocus={!defaultValue}
          className="w-full bg-transparent px-2 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-gradient-to-b from-[var(--berkeley-blue)] to-[#00254a] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
