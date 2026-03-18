/**
 * Server-side database queries that produce browse-ready resource data.
 *
 * This is the single gateway between the Prisma Resource table and every
 * UI surface (browse page, urgent banner, search chips, agent search).
 * It converts the DB hoursJson into the client-side DirectoryResource shape
 * so that all real-time status computations happen on the client with one
 * unified type.
 */

import { prisma } from "@/lib/prisma";
import { runSeedIfNeeded } from "@/lib/seed-resources";
import type {
  DirectoryResource,
  ResourceCategory,
  ResourceHours,
} from "@/lib/resource-directory";

function isDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    /Can't reach database server|Connection refused|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(msg) ||
    /prepared statement.*does not exist|ConnectorError|P1001|P1017/i.test(msg)
  );
}

// ── Category icon mapping (display-only, not stored in DB) ──────────────

export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽",
  health: "🏥",
  "mental-health": "🧠",
  safety: "🛡️",
  housing: "🏠",
  financial: "💰",
  academic: "📚",
  career: "💼",
  legal: "⚖️",
  disability: "♿",
  technology: "💻",
  international: "🌏",
  community: "🤝",
  "student-life": "🎓",
  wellness: "🏃",
  transportation: "🚌",
};

// ── Hours normalisation ─────────────────────────────────────────────────

const DAY_NAMES_ORDERED = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

/**
 * Converts any DB hoursJson value into the client-side
 * `ResourceHours[] | "24/7" | null` shape used by getResourceStatus /
 * getDisplayHours.
 *
 * Handles:
 *   - null / undefined
 *   - { type: "24/7" }
 *   - { type: "scheduled", slots: [...] }
 *   - Day-keyed { monday: { open, close }, ... }
 */
function normalizeHours(
  hoursJson: unknown,
): ResourceHours[] | "24/7" | null {
  if (!hoursJson || typeof hoursJson !== "object") return null;

  const obj = hoursJson as Record<string, unknown>;

  if (obj.type === "24/7") return "24/7";

  if (obj.type === "scheduled" && Array.isArray(obj.slots)) {
    return obj.slots as ResourceHours[];
  }

  // Day-keyed format → group days sharing the same open/close into slots
  const groups = new Map<string, string[]>();
  for (const day of DAY_NAMES_ORDERED) {
    const entry = obj[day];
    if (!entry || typeof entry !== "object") continue;
    const d = entry as { open?: string; close?: string; closed?: boolean };
    if (d.closed || !d.open || !d.close) continue;
    const key = `${d.open}|${d.close}`;
    const existing = groups.get(key) ?? [];
    existing.push(day.charAt(0).toUpperCase() + day.slice(1));
    groups.set(key, existing);
  }

  if (groups.size === 0) return null;

  const slots: ResourceHours[] = [];
  for (const [key, days] of groups) {
    const [open, close] = key.split("|");
    slots.push({ days: days.join(", "), open, close });
  }
  return slots;
}

// ── Location formatting ─────────────────────────────────────────────────

function formatLocation(
  loc: { buildingName: string | null; room: string | null; address: string } | null,
): string {
  if (!loc) return "Online";
  return (
    [loc.buildingName, loc.room, loc.address].filter(Boolean).join(" · ") ||
    "Online"
  );
}

// ── Public queries ──────────────────────────────────────────────────────

/**
 * Returns all active resources grouped by category, ready for the browse
 * page and urgent banner.
 * Falls back to empty array when DB is unreachable (e.g. restricted network).
 */
export async function getBrowseData(): Promise<ResourceCategory[]> {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        resources: {
          where: { isActive: true },
          include: {
            location: true,
            resourceTags: { include: { tag: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    const categoriesWithResources = categories.filter((c) => c.resources.length > 0);
    if (categoriesWithResources.length === 0) {
      const seeded = await runSeedIfNeeded();
      if (seeded) {
        categories = await prisma.category.findMany({
          orderBy: { name: "asc" },
          include: {
            resources: {
              where: { isActive: true },
              include: {
                location: true,
                resourceTags: { include: { tag: true } },
              },
              orderBy: { name: "asc" },
            },
          },
        });
      }
    }

    return categories
    .map((cat) => ({
      id: cat.slug,
      name: cat.name,
      icon: CATEGORY_ICONS[cat.slug] ?? "📋",
      resources: cat.resources.map(
        (r): DirectoryResource => ({
          id: r.id,
          name: r.name,
          category: cat.slug,
          hours: normalizeHours(r.hoursJson),
          location: formatLocation(r.location),
          description: r.shortDescription,
          url: r.websiteUrl ?? r.officialUrl ?? undefined,
          tags: r.resourceTags.map((rt) => rt.tag.name),
        }),
      ),
    }))
    .filter((cat) => cat.resources.length > 0);
  } catch (err) {
    if (isDbError(err)) {
      console.warn("[resource-queries] Database error — using empty data:", err instanceof Error ? err.message : err);
      return [];
    }
    throw err;
  }
}

/**
 * Returns lightweight category chip data for the search landing page.
 * Falls back to empty array when DB is unreachable.
 */
export async function getCategoryChips(): Promise<
  { icon: string; label: string; query: string }[]
> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      where: { resources: { some: { isActive: true } } },
    });

    return categories.map((cat) => ({
      icon: CATEGORY_ICONS[cat.slug] ?? "📋",
      label: cat.name.replace(/ & .*/, ""),
      query: cat.name,
    }));
  } catch (err) {
    if (isDbError(err)) {
      console.warn("[resource-queries] Database error — using empty data.");
      return [];
    }
    throw err;
  }
}
