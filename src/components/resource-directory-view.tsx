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

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽", health: "🏥", "mental-health": "🧠", safety: "🛡️",
  housing: "🏠", financial: "💰", academic: "📚", career: "💼",
  legal: "⚖️", disability: "♿", technology: "💻", international: "🌏",
  community: "🤝", "student-life": "🎓",
};

// ── Filter chips ────────────────────────────────────────────────────────

const FILTERS = [
  { id: "all", label: "All", icon: "" },
  { id: "open", label: "Open Now", icon: "🟢" },
  { id: "closing-soon", label: "Closing Soon", icon: "🟡" },
  { id: "free-food", label: "Free Food", icon: "🍽" },
  { id: "emergency", label: "Emergency", icon: "🚨" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// ── Status badge ────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: ResourceStatus; label: string }) {
  const styles: Record<ResourceStatus, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "closing-soon": "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {label}
    </span>
  );
}

// ── Single resource row ─────────────────────────────────────────────────

function ResourceRow({ resource }: { resource: DirectoryResource }) {
  const { status, label } = getResourceStatus(resource);
  const hours = getDisplayHours(resource);

  return (
    <button
      onClick={() => {
        if (resource.url) window.open(resource.url, "_blank");
      }}
      className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50/80 last:border-b-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
        {CATEGORY_ICONS[resource.category] ?? "📋"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 truncate">{resource.name}</p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {hours}
        </p>
      </div>

      <StatusBadge status={status} label={label} />

      <svg className="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Category section ────────────────────────────────────────────────────

function CategorySection({ category, resources }: { category: ResourceCategory; resources: DirectoryResource[] }) {
  if (resources.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[var(--berkeley-blue)] px-5 py-3.5">
        <h3 className="text-lg font-bold text-white">
          <span className="mr-2">{category.icon}</span>
          {category.name}
        </h3>
        <p className="text-sm font-medium text-[var(--california-gold)]">
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
      <div className="bg-[var(--berkeley-blue)] px-4 pb-6 pt-6 md:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--california-gold)]"
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
              placeholder="Search resources, food, care..."
              className="w-full rounded-xl border-0 bg-slate-700/50 py-3.5 pl-12 pr-4 text-white placeholder-slate-400 outline-none ring-1 ring-white/10 transition focus:bg-slate-700/70 focus:ring-[var(--california-gold)]"
            />
          </div>

          {/* Filter chips */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === f.id
                    ? "bg-white text-[var(--berkeley-blue)] shadow-sm"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {f.icon && <span>{f.icon}</span>}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {activeFilter === "all" ? "All Resources" : FILTERS.find((f) => f.id === activeFilter)?.label}
          </h2>
          <p className="text-sm text-slate-500">
            {activeFilter === "all"
              ? "Browse by category and tap to view on map"
              : `${totalVisible} resource${totalVisible !== 1 ? "s" : ""} found`}
          </p>
        </div>

        <div className="flex flex-col gap-5">
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
        <div className="mt-8 rounded-xl border border-slate-200 bg-gradient-to-r from-[var(--berkeley-blue)] to-[#0a4a83] p-6 text-center text-white shadow-sm">
          <p className="text-lg font-bold">Can&apos;t find what you need?</p>
          <p className="mt-1 text-sm text-slate-300">
            Our AI-powered search can find specific resources, eligibility info, and more
          </p>
          <button
            onClick={() => router.push("/search")}
            className="mt-4 rounded-lg bg-[var(--california-gold)] px-6 py-2.5 text-sm font-bold text-[var(--berkeley-blue)] transition hover:brightness-110"
          >
            🔍 Search with AI
          </button>
        </div>
      </div>
    </div>
  );
}
