import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/berkeley-sources";
import {
  expandQuery,
  isLLMAvailable,
  llmKnowledgeFallback,
  llmSummarize,
  type QueryExpansion,
} from "@/lib/llm-summarize";

// ── Types ───────────────────────────────────────────────────────────────

export type AgentSearchResult = {
  query: string;
  summary: string;
  action_steps: string[];
  insights: { label: string; value: string }[];
  sources: { title: string; url: string; snippet?: string; category?: string }[];
  meta: {
    sourceCount: number;
    cached: boolean;
    durationMs: number;
    scrapedAt: string;
  };
};

type ScoredPage = {
  id: string;
  url: string;
  title: string;
  category: string;
  bodyText: string;
  score: number;
};

type CuratedMatch = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string | null;
  eligibility: string;
  whatToBring: string[];
  requirementsLink: string | null;
  isAppointmentRequired: boolean;
  walkInAllowed: boolean;
  websiteUrl: string | null;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  location: string | null;
  hoursFormatted: string | null;
  providerName: string | null;
  providerContactEmail: string | null;
  faqText: string | null;
  summaryText: string | null;
  score: number;
};

// ── Constants ───────────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const INSIGHT_RULES: { label: string; keywords: string[] }[] = [
  { label: "Eligibility", keywords: ["eligible", "eligibility", "qualify", "open to", "available to", "must be", "all students", "enrolled", "registered"] },
  { label: "How to access", keywords: ["apply", "application", "submit", "sign up", "register", "request", "fill out", "schedule", "appointment", "walk-in", "drop-in"] },
  { label: "What to bring", keywords: ["bring", "required document", "proof of", "photo id", "cal 1 card", "cal id", "transcript", "verification"] },
  { label: "Cost", keywords: ["free", "no cost", "no fee", "fee", "charge", "payment", "cost", "covered", "no charge", "complimentary"] },
  { label: "Hours", keywords: ["hours", "monday", "tuesday", "wednesday", "thursday", "friday", "am", "pm", "open", "close", "9:00", "10:00", "8:00"] },
  { label: "Location", keywords: ["located", "building", "floor", "room", "address", "suite", "hall", "center", "office", "mlk", "tang", "sproul"] },
  { label: "Contact", keywords: ["email", "phone", "call", "contact", "@berkeley.edu", "510-"] },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 350 && !s.toLowerCase().includes("cookie") && !s.toLowerCase().includes("javascript enabled"));
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((t) => t.length > 2);
}

// Strip junk words before scoring; these don't add signal.
const STOP_WORDS = new Set([
  "how", "what", "when", "where", "who", "why", "the", "and", "for", "with",
  "can", "get", "help", "need", "want", "find", "looking", "near", "from",
  "any", "some", "does", "berkeley", "cal", "campus", "student", "students",
]);

function buildRetrievalTerms(expansion: QueryExpansion): string[] {
  const filtered = expansion.canonicalTerms.filter((t) => !STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : expansion.canonicalTerms;
}

// ── Cache ───────────────────────────────────────────────────────────────

async function getCached(queryKey: string): Promise<AgentSearchResult | null> {
  try {
    const row = await prisma.searchCache.findUnique({ where: { queryKey } });
    if (!row || row.expiresAt < new Date()) {
      if (row) {
        await prisma.searchCache.delete({ where: { queryKey } }).catch((err) => {
          console.warn("[AgentSearch] Cache eviction failed:", err instanceof Error ? err.message : err);
        });
      }
      return null;
    }
    const result = row.resultJson as unknown as AgentSearchResult;
    result.meta = { ...result.meta, cached: true };
    return result;
  } catch {
    return null;
  }
}

async function setCache(queryKey: string, result: AgentSearchResult): Promise<void> {
  try {
    const json = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await prisma.searchCache.upsert({
      where: { queryKey },
      update: { resultJson: json, sourceCount: result.sources.length, scrapedAt: new Date(), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
      create: { queryKey, resultJson: json, sourceCount: result.sources.length, expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    });
  } catch {
    // Non-critical
  }
}

// ── Scoring ─────────────────────────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string[]> = {
  food: ["food", "pantry", "meal", "hungry", "eat", "calfresh", "snap", "groceries", "dining", "hunger"],
  housing: ["housing", "apartment", "dorm", "residence", "rent", "shelter", "homeless", "room", "lease"],
  financial: ["financial", "aid", "scholarship", "grant", "loan", "fafsa", "tuition", "money", "fee"],
  health: ["health", "medical", "doctor", "clinic", "sick", "prescription", "insurance", "ship", "tang"],
  "mental-health": ["mental", "counseling", "therapy", "therapist", "anxiety", "depression", "stress", "crisis", "caps", "wellness"],
  career: ["career", "job", "internship", "resume", "interview", "employer", "work", "employment", "handshake"],
  academic: ["tutoring", "tutor", "study", "academic", "writing", "library", "learning", "homework", "gpa", "advising"],
  legal: ["legal", "lawyer", "law", "rights", "lease", "contract", "immigration"],
  safety: ["safety", "emergency", "police", "assault", "violence", "crisis", "danger"],
  disability: ["disability", "disabled", "accommodations", "accessible", "dsp", "accommodation"],
  technology: ["technology", "laptop", "wifi", "computer", "software", "internet"],
  international: ["international", "visa", "iso", "i-20", "f-1", "opt", "cpt"],
  community: ["community", "identity", "lgbtq", "transfer", "first-generation", "cultural"],
  "student-life": ["student life", "life", "wellbeing", "recreation", "recsports"],
};

function scorePageForQuery(bodyText: string, keywords: string[], category: string, queryTerms: string[]): number {
  const lower = bodyText.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (keywords.some((k) => k.toLowerCase() === term)) score += 5;

    if (bodyText) {
      const parts = lower.split(term);
      const occurrences = Math.max(parts.length - 1, 0);
      score += Math.min(occurrences, 10) * 2;
    }

    if (category.toLowerCase().includes(term)) score += 8;
  }

  const aliases = CATEGORY_ALIASES[category];
  if (aliases) {
    for (const alias of aliases) {
      if (queryTerms.some((t) => t === alias || t.includes(alias) || alias.includes(t))) {
        score += 10;
      }
    }
  }

  return score;
}

async function findRelevantPages(queryTerms: string[]): Promise<ScoredPage[]> {
  if (queryTerms.length === 0) return [];

  const lightPages = await prisma.scrapedPage.findMany({
    select: { id: true, url: true, title: true, category: true, keywords: true },
  });

  if (lightPages.length === 0) return [];

  const candidates = lightPages
    .map((page) => ({
      ...page,
      score: scorePageForQuery("", page.keywords, page.category, queryTerms),
    }))
    .filter((p) => p.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (candidates.length === 0) return [];

  const fullPages = await prisma.scrapedPage.findMany({
    where: { id: { in: candidates.map((c) => c.id) } },
  });

  return fullPages
    .map((page) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      category: page.category,
      bodyText: page.bodyText,
      score: scorePageForQuery(page.bodyText, page.keywords, page.category, queryTerms),
    }))
    .filter((p) => p.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── Curated Resource retrieval ──────────────────────────────────────────
// Full, structured data from the hand-curated Resource table. We pass every
// useful column into the LLM context so answers can cite real hours,
// eligibility, and location instead of guessing from scraped prose.

type HoursEntry = { days?: unknown; open?: unknown; close?: unknown };

function formatHoursJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return null;

  const lines: string[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as HoursEntry;
    const days = typeof e.days === "string" ? e.days : null;
    const open = typeof e.open === "string" ? e.open : null;
    const close = typeof e.close === "string" ? e.close : null;
    if (days && open && close) {
      lines.push(`${days}: ${open}–${close}`);
    }
  }
  return lines.length ? lines.join("; ") : null;
}

function formatFaqJson(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const parts: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const q = (item as Record<string, unknown>).question;
    const a = (item as Record<string, unknown>).answer;
    if (typeof q === "string" && typeof a === "string") {
      parts.push(`Q: ${q} A: ${a}`);
    }
  }
  return parts.length ? parts.join(" | ") : null;
}

function formatSummaryJson(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.trim()) parts.push(`${k}: ${v}`);
  }
  return parts.length ? parts.join(". ") : null;
}

function scoreResource(match: Omit<CuratedMatch, "score">, queryTerms: string[]): number {
  const haystackParts = [
    match.name,
    match.shortDescription,
    match.fullDescription ?? "",
    match.eligibility,
    match.categoryName,
    ...match.tags,
    match.summaryText ?? "",
    match.faqText ?? "",
  ];
  const haystack = haystackParts.join(" ").toLowerCase();
  const nameLower = match.name.toLowerCase();

  let score = 0;

  for (const term of queryTerms) {
    // Name match is the strongest signal — student looking for "CAPS" should rank CAPS first.
    if (nameLower === term) score += 20;
    if (nameLower.includes(term)) score += 8;

    const occurrences = Math.max(haystack.split(term).length - 1, 0);
    score += Math.min(occurrences, 5) * 2;

    // Exact category or tag match
    if (match.categorySlug === term) score += 10;
    if (match.tags.some((tag) => tag.toLowerCase() === term)) score += 6;
  }

  // Category alias boost
  const aliases = CATEGORY_ALIASES[match.categorySlug];
  if (aliases) {
    for (const alias of aliases) {
      if (queryTerms.some((t) => t === alias)) score += 8;
    }
  }

  return score;
}

async function findCuratedResources(
  queryTerms: string[],
  preferredCategory: string | null,
): Promise<CuratedMatch[]> {
  if (queryTerms.length === 0) return [];

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      fullDescription: true,
      eligibilityText: true,
      whatToBring: true,
      requirementsLink: true,
      isAppointmentRequired: true,
      walkInAllowed: true,
      websiteUrl: true,
      officialUrl: true,
      hoursJson: true,
      faqJson: true,
      summaryJson: true,
      category: { select: { name: true, slug: true } },
      location: { select: { buildingName: true, room: true, address: true } },
      provider: { select: { name: true, contactEmail: true } },
      resourceTags: { select: { tag: { select: { name: true } } } },
    },
  });

  const enriched = resources.map((r) => {
    const locationParts = r.location
      ? [r.location.buildingName, r.location.room, r.location.address].filter(Boolean)
      : [];
    const location = locationParts.length ? locationParts.join(" · ") : null;

    const base: Omit<CuratedMatch, "score"> = {
      id: r.id,
      name: r.name,
      shortDescription: r.shortDescription,
      fullDescription: r.fullDescription,
      eligibility: r.eligibilityText,
      whatToBring: r.whatToBring ?? [],
      requirementsLink: r.requirementsLink,
      isAppointmentRequired: r.isAppointmentRequired,
      walkInAllowed: r.walkInAllowed,
      websiteUrl: r.websiteUrl ?? r.officialUrl,
      categoryName: r.category.name,
      categorySlug: r.category.slug,
      tags: r.resourceTags.map((rt) => rt.tag.name),
      location,
      hoursFormatted: formatHoursJson(r.hoursJson),
      providerName: r.provider?.name ?? null,
      providerContactEmail: r.provider?.contactEmail ?? null,
      faqText: formatFaqJson(r.faqJson),
      summaryText: formatSummaryJson(r.summaryJson),
    };

    let score = scoreResource(base, queryTerms);
    if (preferredCategory && base.categorySlug === preferredCategory) score += 6;

    return { ...base, score };
  });

  return enriched
    .filter((m) => m.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── Curated-context formatting ──────────────────────────────────────────
// Produces the block we send to the LLM as "PRIMARY SOURCES". One entry per
// curated match with all known structured fields, formatted for easy reading.

function formatCuratedBlock(matches: CuratedMatch[]): string {
  if (matches.length === 0) return "";

  return matches
    .map((m, i) => {
      const lines: string[] = [];
      lines.push(`[Curated ${i + 1}: ${m.name}]`);
      lines.push(`Category: ${m.categoryName}`);
      if (m.tags.length) lines.push(`Tags: ${m.tags.join(", ")}`);

      lines.push(`Description: ${m.shortDescription}`);
      if (m.fullDescription) lines.push(`Details: ${m.fullDescription}`);

      lines.push(`Eligibility: ${m.eligibility}`);

      if (m.hoursFormatted) {
        lines.push(`Hours: ${m.hoursFormatted}`);
      } else {
        lines.push(`Hours: not listed`);
      }

      if (m.location) lines.push(`Location: ${m.location}`);

      const accessParts: string[] = [];
      if (m.walkInAllowed) accessParts.push("walk-ins accepted");
      if (m.isAppointmentRequired) accessParts.push("appointment required");
      if (accessParts.length) lines.push(`Access: ${accessParts.join("; ")}`);

      if (m.whatToBring.length) lines.push(`What to bring: ${m.whatToBring.join(", ")}`);
      if (m.requirementsLink) lines.push(`Requirements link: ${m.requirementsLink}`);

      if (m.providerName || m.providerContactEmail) {
        const contactBits = [m.providerName, m.providerContactEmail].filter(Boolean);
        lines.push(`Contact: ${contactBits.join(" — ")}`);
      }

      if (m.websiteUrl) lines.push(`Website: ${m.websiteUrl}`);

      if (m.summaryText) lines.push(`Summary notes: ${m.summaryText}`);
      if (m.faqText) lines.push(`FAQ: ${m.faqText}`);

      return lines.join("\n");
    })
    .join("\n\n");
}

// ── Extractive fallbacks (used when LLM is unavailable or fails) ────────

function scoreSentence(sentence: string, queryTerms: string[]): number {
  const lower = sentence.toLowerCase();
  let score = 0;
  for (const word of queryTerms) {
    if (lower.includes(word)) score += 3;
  }
  const signals = ["student", "eligible", "apply", "free", "open", "available",
    "walk-in", "appointment", "bring", "hour", "located", "contact", "deadline"];
  for (const s of signals) {
    if (lower.includes(s)) score += 1;
  }
  return score;
}

function buildExtractiveSummary(
  curatedMatches: CuratedMatch[],
  pages: ScoredPage[],
  queryTerms: string[],
): string {
  // Prefer curated data for extractive summary — it's structured and trustworthy.
  if (curatedMatches.length > 0) {
    const top = curatedMatches[0];
    const bits: string[] = [`${top.name}: ${top.shortDescription}`];
    if (top.hoursFormatted) bits.push(`Hours: ${top.hoursFormatted}.`);
    if (top.location) bits.push(`Located at ${top.location}.`);
    if (top.eligibility) bits.push(`Eligibility: ${top.eligibility}`);
    return bits.join(" ");
  }

  const allText = pages.map((p) => p.bodyText).join(" ");
  const sentences = splitSentences(allText);
  const scored = sentences.map((s) => ({ s, score: scoreSentence(s, queryTerms) }));
  scored.sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const entry of scored) {
    if (picked.length >= 4) break;
    if (entry.score < 2) continue;
    const isDup = picked.some((p) => p.slice(0, 50) === entry.s.slice(0, 50));
    if (!isDup) picked.push(entry.s);
  }

  if (picked.length > 0) return picked.join(" ");
  return `Found ${pages.length} Berkeley resource page(s). Check the source links for details.`;
}

function buildExtractiveInsights(
  curatedMatches: CuratedMatch[],
  pages: ScoredPage[],
): AgentSearchResult["insights"] {
  const results: AgentSearchResult["insights"] = [];

  if (curatedMatches.length > 0) {
    const top = curatedMatches[0];
    if (top.eligibility) results.push({ label: "Eligibility", value: top.eligibility });
    if (top.hoursFormatted) results.push({ label: "Hours", value: top.hoursFormatted });
    if (top.location) results.push({ label: "Location", value: top.location });
    if (top.whatToBring.length) {
      results.push({ label: "What to bring", value: top.whatToBring.join(", ") });
    }
    if (top.providerContactEmail) {
      results.push({ label: "Contact", value: top.providerContactEmail });
    }
    if (top.walkInAllowed || top.isAppointmentRequired) {
      const how = [
        top.walkInAllowed ? "walk-ins accepted" : null,
        top.isAppointmentRequired ? "appointment required" : null,
      ]
        .filter(Boolean)
        .join("; ");
      results.push({ label: "How to access", value: how });
    }
    return results;
  }

  const allText = pages.map((p) => p.bodyText).join(" ");
  const sentences = splitSentences(allText);
  for (const rule of INSIGHT_RULES) {
    for (const kw of rule.keywords) {
      const match = sentences.find((s) => s.toLowerCase().includes(kw));
      if (match) {
        results.push({ label: rule.label, value: match });
        break;
      }
    }
  }
  return results;
}

function buildExtractiveSteps(
  curatedMatches: CuratedMatch[],
  insights: AgentSearchResult["insights"],
): string[] {
  const steps: string[] = [];

  if (curatedMatches.length > 0) {
    const top = curatedMatches[0];
    const where = top.location ?? "the listed location";
    if (top.walkInAllowed && !top.isAppointmentRequired) {
      steps.push(`Walk in to ${top.name} at ${where}.`);
    } else if (top.isAppointmentRequired) {
      steps.push(`Schedule an appointment with ${top.name} before visiting.`);
    } else {
      steps.push(`Visit ${top.name} at ${where}.`);
    }
    if (top.whatToBring.length) {
      steps.push(`Bring: ${top.whatToBring.join(", ")}.`);
    }
    if (top.websiteUrl) {
      steps.push(`Check ${top.websiteUrl} for current hours and requirements.`);
    }
    if (top.providerContactEmail) {
      steps.push(`Questions? Email ${top.providerContactEmail}.`);
    }
    return steps.slice(0, 4);
  }

  const labels = new Set(insights.map((i) => i.label));
  if (labels.has("Eligibility")) steps.push("Confirm you meet the eligibility requirements listed above.");
  else steps.push("Open the first source link to check if you're eligible.");
  if (labels.has("How to access")) steps.push("Follow the access steps described in the source.");
  else steps.push("Look for an 'Apply', 'Get Started', or 'Schedule' button on the page.");
  if (labels.has("What to bring")) steps.push("Gather the required documents before visiting.");
  steps.push("Save the page or contact info for follow-up.");
  return steps;
}

function buildSnippet(bodyText: string, queryTerms: string[]): string {
  const sentences = splitSentences(bodyText);
  const best = sentences.find((s) => {
    const lower = s.toLowerCase();
    return queryTerms.some((w) => lower.includes(w));
  });
  return best?.slice(0, 200) ?? bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
}

// ── Pipeline ────────────────────────────────────────────────────────────

// Minimum scores that qualify as "confident local match". Below both, we
// trigger the general-knowledge LLM fallback instead of summarizing noise.
const MIN_CURATED_SCORE_CONFIDENT = 8;
const MIN_SCRAPED_SCORE_CONFIDENT = 25;

export async function runAgentSearch(query: string): Promise<AgentSearchResult> {
  const start = Date.now();
  const queryKey = normalizeQuery(query);

  // 1. Cache
  const cached = await getCached(queryKey);
  if (cached) {
    cached.meta.durationMs = Date.now() - start;
    return cached;
  }

  // 2. Expand the query via LLM (with safe fallback to raw tokens)
  const expansion = await expandQuery(query);
  const retrievalTerms = buildRetrievalTerms(expansion);
  console.log(
    `[AgentSearch] Query="${query}" terms=[${retrievalTerms.join(", ")}] category=${expansion.category ?? "null"}`,
  );

  // 3. Retrieval over scraped pages and curated resources (in parallel)
  const [pages, curatedMatches] = await Promise.all([
    findRelevantPages(retrievalTerms),
    findCuratedResources(retrievalTerms, expansion.category),
  ]);

  const topScrapedScore = pages.length > 0 ? pages[0].score : 0;
  const topCuratedScore = curatedMatches.length > 0 ? curatedMatches[0].score : 0;

  const haveConfidentCurated = topCuratedScore >= MIN_CURATED_SCORE_CONFIDENT;
  const haveConfidentScraped = topScrapedScore >= MIN_SCRAPED_SCORE_CONFIDENT;
  const hasLocalResults = pages.length > 0 || curatedMatches.length > 0;

  // 4. If we have zero data anywhere, emit a helpful onboarding message
  if (!hasLocalResults) {
    const [pageCount, resourceCount] = await Promise.all([
      prisma.scrapedPage.count(),
      prisma.resource.count({ where: { isActive: true } }),
    ]);
    if (pageCount === 0 && resourceCount === 0) {
      return {
        query,
        summary:
          "No resources loaded yet. Visit /api/seed to load the directory, or ask an admin to run the scraper.",
        action_steps: [
          "Visit /api/seed to load 50+ Berkeley resources.",
          "Or ask an admin to run the scraper from the admin panel.",
        ],
        insights: [],
        sources: [],
        meta: { sourceCount: 0, cached: false, durationMs: Date.now() - start, scrapedAt: new Date().toISOString() },
      };
    }
  }

  // 5. Decide whether to use the general-knowledge fallback
  // We only fall back when BOTH curated and scraped retrieval are weak — a
  // confident curated match alone is enough to answer directly.
  const shouldFallback = !haveConfidentCurated && !haveConfidentScraped && isLLMAvailable();

  let knowledge: import("@/lib/llm-summarize").LLMKnowledgeResult | null = null;
  if (shouldFallback) {
    console.log(
      `[AgentSearch] No confident local match (curated=${topCuratedScore}, scraped=${topScrapedScore}); using general-knowledge fallback`,
    );
    knowledge = await llmKnowledgeFallback(query);
  }

  // 6. Nothing at all: generic fallback with a couple of anchor links
  if (!hasLocalResults && !knowledge) {
    return {
      query,
      summary: `No Berkeley resources matched "${query}". Try different keywords or browse by category.`,
      action_steps: [
        "Try broader terms like 'food', 'housing', 'financial aid', or 'health'.",
        "Visit basicneeds.berkeley.edu for common student resources.",
      ],
      insights: [],
      sources: [
        { title: "UC Berkeley Basic Needs", url: "https://basicneeds.berkeley.edu", snippet: "Food, housing, and financial resources for students." },
        { title: "UC Berkeley Student Affairs", url: "https://studentaffairs.berkeley.edu", snippet: "Central hub for all student services." },
      ],
      meta: { sourceCount: 0, cached: false, durationMs: Date.now() - start, scrapedAt: new Date().toISOString() },
    };
  }

  // 7. Build the source list the UI renders — curated first, then scraped, then knowledge
  const sources: AgentSearchResult["sources"] = [];
  const seenUrls = new Set<string>();

  for (const cr of curatedMatches) {
    const url = cr.websiteUrl ?? `/resources/${cr.id}`;
    if (seenUrls.has(url)) continue;
    sources.push({
      title: cr.name,
      url,
      snippet: cr.shortDescription,
      category: CATEGORY_LABELS[cr.categorySlug] ?? cr.categoryName,
    });
    seenUrls.add(url);
  }

  for (const p of pages) {
    if (seenUrls.has(p.url)) continue;
    sources.push({
      title: p.title,
      url: p.url,
      snippet: buildSnippet(p.bodyText, retrievalTerms),
      category: CATEGORY_LABELS[p.category] ?? p.category,
    });
    seenUrls.add(p.url);
  }

  if (knowledge) {
    for (const ws of knowledge.sources) {
      if (!ws.url || seenUrls.has(ws.url)) continue;
      sources.push({ title: ws.title, url: ws.url, snippet: ws.snippet, category: "Web" });
      seenUrls.add(ws.url);
    }
  }

  // 8. Build the LLM context. Curated data is its own block — it is NEVER
  //    crowded out by scraped excerpts, which is the #1 former weakness.
  const curatedBlock = formatCuratedBlock(curatedMatches);
  const scrapedTexts = pages.map((p) => ({ title: p.title, text: p.bodyText }));

  // 9. Summarize. If the LLM is up, use it; otherwise extract.
  let summary: string;
  let insights: AgentSearchResult["insights"];
  let actionSteps: string[];

  const llmResult = isLLMAvailable() ? await llmSummarize(query, curatedBlock, scrapedTexts) : null;

  if (llmResult) {
    summary = llmResult.summary;
    insights = llmResult.insights;
    actionSteps = llmResult.action_steps;
  } else if (knowledge && !hasLocalResults) {
    summary = knowledge.summary;
    insights = knowledge.insights;
    actionSteps = knowledge.action_steps;
  } else {
    summary = buildExtractiveSummary(curatedMatches, pages, retrievalTerms);
    insights = buildExtractiveInsights(curatedMatches, pages);
    actionSteps = buildExtractiveSteps(curatedMatches, insights);
  }

  // If the knowledge fallback ran alongside a weak local result, surface its
  // extra insights (deduped by label) so users still see "Hours", "Location",
  // etc. when the local data is thin.
  if (knowledge && knowledge.insights.length > 0) {
    const existingLabels = new Set(insights.map((i) => i.label));
    for (const wi of knowledge.insights) {
      if (!existingLabels.has(wi.label)) {
        insights.push(wi);
        existingLabels.add(wi.label);
      }
    }
  }

  const result: AgentSearchResult = {
    query,
    summary,
    action_steps: actionSteps,
    insights,
    sources,
    meta: {
      sourceCount: sources.length,
      cached: false,
      durationMs: Date.now() - start,
      scrapedAt: new Date().toISOString(),
    },
  };

  await setCache(queryKey, result);

  return result;
}
