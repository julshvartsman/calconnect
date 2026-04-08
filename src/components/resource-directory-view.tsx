"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getResourceStatus,
  getDisplayHours,
  type DirectoryResource,
  type ResourceCategory,
  type ResourceStatus,
} from "@/lib/resource-directory";

// ── Filter chips ────────────────────────────────────────────────────────

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open now" },
  { id: "closing-soon", label: "Closing soon" },
  { id: "free-food", label: "Free food" },
  { id: "emergency", label: "Emergency" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

/** Deterministic tint per category so rows feel varied, not random. */
function categoryStyleKey(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 6;
  return h;
}

const AVATAR_STYLES = [
  "bg-gradient-to-br from-sky-400/25 to-blue-600/35 text-blue-950 ring-1 ring-blue-500/20",
  "bg-gradient-to-br from-amber-300/35 to-orange-500/40 text-amber-950 ring-1 ring-amber-500/25",
  "bg-gradient-to-br from-emerald-400/25 to-teal-600/35 text-emerald-950 ring-1 ring-emerald-500/20",
  "bg-gradient-to-br from-violet-400/25 to-indigo-600/35 text-indigo-950 ring-1 ring-violet-500/20",
  "bg-gradient-to-br from-rose-300/30 to-pink-500/35 text-rose-950 ring-1 ring-rose-400/25",
  "bg-gradient-to-br from-slate-300/40 to-slate-500/35 text-slate-900 ring-1 ring-slate-400/30",
];

// ── Status badge ────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: ResourceStatus; label: string }) {
  const styles: Record<ResourceStatus, string> = {
    open: "bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-400/35",
    "closing-soon": "bg-amber-400/20 text-amber-950 ring-1 ring-amber-500/35",
    closed: "bg-slate-200/60 text-slate-700 ring-1 ring-slate-300/80",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}

// ── Single resource row ─────────────────────────────────────────────────

function ResourceRow({ resource }: { resource: DirectoryResource }) {
  const { status, label } = getResourceStatus(resource);
  const hours = getDisplayHours(resource);
  const initial = resource.name.trim().charAt(0).toUpperCase() || "?";
  const avatarClass = AVATAR_STYLES[categoryStyleKey(resource.category)];

  return (
    <button
      onClick={() => {
        if (resource.url) window.open(resource.url, "_blank");
      }}
      className="group flex w-full items-center gap-4 border-b border-slate-100/90 px-5 py-4 text-left transition hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-white last:border-b-0"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold shadow-sm transition group-hover:scale-[1.03] ${avatarClass}`}
      >
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 truncate transition group-hover:text-[var(--berkeley-blue)]">
          {resource.name}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {hours}
        </p>
      </div>

      <StatusBadge status={status} label={label} />

      <svg
        className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--berkeley-blue)]/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Category section ────────────────────────────────────────────────────

function CategorySection({ category, resources }: { category: ResourceCategory; resources: DirectoryResource[] }) {
  if (resources.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(0,50,98,0.12)] ring-1 ring-slate-900/[0.03]">
      <div className="relative border-b border-slate-100/90 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 px-5 py-4 pl-5">
        <div
          className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-[var(--california-gold)] to-[var(--berkeley-blue)]"
          aria-hidden
        />
        <h3 className="pl-2 text-base font-semibold tracking-tight text-slate-900">{category.name}</h3>
        <p className="mt-1 pl-2 text-xs font-medium text-slate-500">
          {resources.length} resource{resources.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div>
        {resources.map((r) => (
          <ResourceRow key={r.id} resource={r} />
        ))}
      </div>
    </div>
  );
}

// ── Main directory view ─────────────────────────────────────────────────

type ResourceDirectoryViewProps = {
  categories: ResourceCategory[];
};

export function ResourceDirectoryView({ categories: dbCategories }: ResourceDirectoryViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredCategories = useMemo(() => {
    return dbCategories.map((cat) => {
      const filtered = cat.resources.filter((r) => {
        const { status } = getResourceStatus(r);

        if (activeFilter === "open" && status !== "open") return false;
        if (activeFilter === "closing-soon" && status !== "closing-soon") return false;
        if (activeFilter === "free-food" && !r.tags.includes("free-food")) return false;
        if (activeFilter === "emergency" && !r.tags.includes("emergency")) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.location.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
          );
        }

        return true;
      });
      return { category: cat, resources: filtered };
    }).filter((c) => c.resources.length > 0);
  }, [dbCategories, activeFilter, searchQuery]);

  const totalVisible = filteredCategories.reduce((acc, c) => acc + c.resources.length, 0);
  const totalResources = dbCategories.reduce((acc, c) => acc + c.resources.length, 0);

  return (
    <div>
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-slate-900/10 bg-[var(--berkeley-blue)] px-4 pb-7 pt-7 md:px-6">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--california-gold)]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-24 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-[1] mx-auto max-w-3xl">
          <p className="mb-3 text-center text-sm font-medium text-[var(--california-gold)]/95 md:text-left">
            Campus resources, organized
          </p>
          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--california-gold)]/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Filter by name, topic, or location…"
              className="w-full rounded-xl border-0 bg-white/12 py-3.5 pl-12 pr-4 text-white shadow-inner shadow-black/10 placeholder-white/50 outline-none ring-1 ring-white/20 transition focus:bg-white/18 focus:ring-2 focus:ring-[var(--california-gold)]/35"
            />
          </div>

          {/* Filter chips */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                type="button"
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === f.id
                    ? "bg-white text-[var(--berkeley-blue)] shadow-md ring-2 ring-[var(--california-gold)]/50"
                    : "bg-white/10 text-white/90 ring-1 ring-white/15 hover:bg-white/18"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {activeFilter === "all" ? "All resources" : FILTERS.find((f) => f.id === activeFilter)?.label}
          </h2>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600">
            {activeFilter === "all"
              ? "Browse by category. Tap a row to open the site, or use the map to see what’s nearby."
              : `${totalVisible} match${totalVisible !== 1 ? "es" : ""}`}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {filteredCategories.map(({ category, resources }) => (
            <CategorySection key={category.id} category={category} resources={resources} />
          ))}

          {filteredCategories.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              {totalResources === 0 ? (
                <>
                  <p className="text-lg font-medium text-slate-400">No resources loaded yet</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Visit{" "}
                    <a href="/api/seed" className="font-semibold text-[var(--berkeley-blue)] hover:underline">
                      /api/seed
                    </a>{" "}
                    to load 50+ Berkeley resources.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-slate-400">No resources match this filter</p>
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-2 text-sm font-semibold text-[var(--berkeley-blue)] hover:underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Deep search CTA */}
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-slate-900/10 bg-gradient-to-br from-[#003262] via-[#002a52] to-[#001a33] p-7 text-center text-white shadow-[0_12px_40px_-16px_rgba(0,50,98,0.45)]">
          <div
            className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-[var(--california-gold)]/25 blur-2xl"
            aria-hidden
          />
          <p className="relative text-lg font-semibold">Need something more specific?</p>
          <p className="relative mt-2 text-sm text-white/80">
            AI search pulls eligibility, hours, and sources from across the web.
          </p>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="relative mt-6 inline-flex items-center justify-center rounded-full bg-[var(--california-gold)] px-6 py-2.5 text-sm font-semibold text-[var(--berkeley-blue)] shadow-md transition hover:brightness-105 active:scale-[0.98]"
          >
            Open AI search
          </button>
        </div>
      </div>
    </div>
  );
}
