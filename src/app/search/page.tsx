/**
 * Search page — landing hero with typewriter prompt (no query),
 * or search results powered by the agent pipeline (with query).
 *
 * Category chips are fetched from the database so they stay in sync
 * with whatever resources exist.
 */

import Link from "next/link";
import { SearchInput } from "@/components/search-input";
import { CrewSearchResults } from "@/components/crew-search-results";
import { TypewriterPrompt } from "@/components/typewriter-prompt";
import { getCategoryChips } from "@/lib/resource-queries";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const hasQuery = query.length > 0;

  if (hasQuery) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 md:px-6">
        <section className="mb-4">
          <p className="text-sm text-slate-400">Search results</p>
        </section>
        <SearchInput defaultValue={query} />
        <CrewSearchResults key={query} query={query} />
      </main>
    );
  }

  const categoryChips = await getCategoryChips();

  return (
    <section className="hero-gradient -mt-[1px] min-h-[calc(100vh-57px)] pb-16 pt-14 sm:pt-20">
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center md:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Search <span className="text-flow-gold">Berkeley</span> Resources
        </h1>

        <TypewriterPrompt variant="dark" />

        <div className="mt-8 w-full">
          <SearchInput defaultValue="" />
        </div>

        <p className="mx-auto mt-5 max-w-md text-sm text-white/40">
          Type any need. We search the web, read the pages, and give you everything in one place.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categoryChips.map((chip) => (
            <Link
              key={chip.label}
              href={`/search?q=${encodeURIComponent(chip.query)}`}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition hover:border-[var(--california-gold)]/40 hover:bg-white/15 hover:text-white"
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
