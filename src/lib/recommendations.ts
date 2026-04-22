import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/berkeley-sources";

// ─────────────────────────────────────────────────────────────────────────
// Personalized recommendations — computed from a user's actual DB-backed
// search history (SearchEvent rows, scoped by userEmail). Each recommended
// resource is returned with attribution — which past query it matched —
// so the UI can show "matched: media studies advisor" instead of a
// generic explanation.
// ─────────────────────────────────────────────────────────────────────────

const MAX_HISTORY_DAYS = 60;
const MAX_HISTORY_QUERIES = 15;
const DEFAULT_LIMIT = 6;

const STOP_WORDS: ReadonlySet<string> = new Set([
  "how", "what", "when", "where", "who", "why", "the", "and", "for", "with",
  "can", "get", "help", "need", "want", "find", "looking", "near", "from",
  "any", "some", "does", "berkeley", "cal", "campus", "student", "students",
  "a", "an", "is", "are", "my", "me", "i", "im", "to", "of", "on", "at", "in",
  "do", "have", "has", "this", "that", "about", "please",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// ── Resource shape returned to the client ───────────────────────────────

export type RecommendationItem = {
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
  /** Past queries this resource matched (deduped, ordered by recency). */
  matchingQueries: string[];
  /** Internal score; the UI doesn't need to read this but it's useful for debug. */
  score: number;
};

export type RecommendationsResult = {
  items: RecommendationItem[];
  /** Unique recent search queries used to compute these recommendations. */
  basedOn: string[];
};

// ── Scoring ─────────────────────────────────────────────────────────────

type ScorableResource = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string | null;
  eligibilityText: string;
  isAppointmentRequired: boolean;
  walkInAllowed: boolean;
  websiteUrl: string | null;
  requirementsLink: string | null;
  hoursJson: unknown;
  category: { name: string; slug: string };
  location: { buildingName: string | null; room: string | null; address: string } | null;
  resourceTags: { tag: { name: string } }[];
};

function scoreResourceAgainstTokens(resource: ScorableResource, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const name = resource.name.toLowerCase();
  const categoryName = resource.category.name.toLowerCase();
  const categorySlug = resource.category.slug.toLowerCase();
  const description = `${resource.shortDescription} ${resource.fullDescription ?? ""}`.toLowerCase();
  const tags = resource.resourceTags.map((rt) => rt.tag.name.toLowerCase());

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 8;                         // title match is strongest
    if (categoryName.includes(token) || categorySlug.includes(token)) score += 5;
    if (tags.some((t) => t.includes(token) || token.includes(t))) score += 4;
    if (description.includes(token)) score += 2;
  }
  return score;
}

// ── Hours formatting ────────────────────────────────────────────────────

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function formatHours(hoursJson: unknown): string | null {
  if (!hoursJson || typeof hoursJson !== "object") return null;
  const obj = hoursJson as Record<string, unknown>;

  // Prefer a "summary" or "displayText" field if present.
  for (const key of ["summary", "displayText", "text"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // Fallback: pick today's hours if present.
  const today = DAYS[new Date().getDay()];
  const todayEntry = obj[today];
  if (typeof todayEntry === "string" && todayEntry.trim()) {
    return `Today: ${todayEntry.trim()}`;
  }
  if (todayEntry && typeof todayEntry === "object") {
    const t = todayEntry as { open?: string; close?: string; closed?: boolean };
    if (t.closed) return "Closed today";
    if (t.open && t.close) return `Today: ${t.open}–${t.close}`;
  }

  return null;
}

// ── Main entry ──────────────────────────────────────────────────────────

export async function getRecommendationsForEmail(
  email: string,
  limit = DEFAULT_LIMIT,
): Promise<RecommendationsResult> {
  // 1. Pull recent distinct user queries, newest first.
  const since = new Date(Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  let events: { query: string; queryKey: string; createdAt: Date }[] = [];
  try {
    events = await prisma.searchEvent.findMany({
      where: {
        userEmail: email,
        eventType: "search_submitted",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { query: true, queryKey: true, createdAt: true },
    });
  } catch (error) {
    console.error("[Recommendations] Failed to load search history", error);
    return { items: [], basedOn: [] };
  }

  if (events.length === 0) {
    return { items: [], basedOn: [] };
  }

  // 2. De-duplicate by queryKey, keep most recent instance (query text).
  const seenKeys = new Set<string>();
  const orderedQueries: { query: string; queryKey: string; tokens: string[] }[] = [];
  for (const ev of events) {
    if (seenKeys.has(ev.queryKey)) continue;
    seenKeys.add(ev.queryKey);
    orderedQueries.push({
      query: ev.query,
      queryKey: ev.queryKey,
      tokens: tokenize(ev.query),
    });
    if (orderedQueries.length >= MAX_HISTORY_QUERIES) break;
  }

  const basedOn = orderedQueries.map((q) => q.query);

  // 3. Fetch active resources (small catalog — no need to paginate yet).
  let resources: ScorableResource[] = [];
  try {
    resources = await prisma.resource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        fullDescription: true,
        eligibilityText: true,
        isAppointmentRequired: true,
        walkInAllowed: true,
        websiteUrl: true,
        requirementsLink: true,
        hoursJson: true,
        category: { select: { name: true, slug: true } },
        location: { select: { buildingName: true, room: true, address: true } },
        resourceTags: { select: { tag: { select: { name: true } } } },
      },
    });
  } catch (error) {
    console.error("[Recommendations] Failed to load resources", error);
    return { items: [], basedOn };
  }

  if (resources.length === 0) {
    return { items: [], basedOn };
  }

  // 4. Score every resource against every recent query and keep attribution.
  // Score is weighted by recency — the most recent query counts most.
  type ScoreBag = {
    resource: ScorableResource;
    totalScore: number;
    matches: { query: string; score: number; order: number }[];
  };

  const bagById = new Map<string, ScoreBag>();
  for (const resource of resources) {
    bagById.set(resource.id, { resource, totalScore: 0, matches: [] });
  }

  orderedQueries.forEach(({ query, tokens }, idx) => {
    // Linear recency decay: newest query 1.0x, oldest ~0.3x
    const recencyWeight = 1 - (idx / orderedQueries.length) * 0.7;
    for (const resource of resources) {
      const raw = scoreResourceAgainstTokens(resource, tokens);
      if (raw <= 0) continue;
      const weighted = raw * recencyWeight;
      const bag = bagById.get(resource.id)!;
      bag.totalScore += weighted;
      bag.matches.push({ query, score: weighted, order: idx });
    }
  });

  // 5. Rank and project.
  const ranked = Array.from(bagById.values())
    .filter((b) => b.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  return {
    basedOn,
    items: ranked.map(({ resource, totalScore, matches }) => {
      // Keep the top 3 matching queries, ordered by recency (lowest order first).
      const topMatches = [...matches]
        .sort((a, b) => a.order - b.order || b.score - a.score)
        .slice(0, 3)
        .map((m) => m.query);

      return {
        id: resource.id,
        name: resource.name,
        shortDescription: resource.shortDescription,
        eligibilityText: resource.eligibilityText,
        isAppointmentRequired: resource.isAppointmentRequired,
        walkInAllowed: resource.walkInAllowed,
        websiteUrl: resource.websiteUrl,
        requirementsLink: resource.requirementsLink,
        category: {
          name: resource.category.name,
          slug: resource.category.slug,
          label: CATEGORY_LABELS[resource.category.slug] ?? resource.category.name,
        },
        location: resource.location,
        hoursText: formatHours(resource.hoursJson),
        tags: resource.resourceTags.map((rt) => rt.tag.name),
        matchingQueries: topMatches,
        score: Math.round(totalScore * 10) / 10,
      };
    }),
  };
}
