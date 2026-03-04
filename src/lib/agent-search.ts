import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/berkeley-sources";
import { llmSummarize, llmKnowledgeFallback, perplexityKnowledgeSearch, isLLMAvailable } from "@/lib/llm-summarize";

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

// ── Constants ───────────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — preserve API quota

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

// ── Cache ───────────────────────────────────────────────────────────────

async function getCached(queryKey: string): Promise<AgentSearchResult | null> {
  try {
    const row = await prisma.searchCache.findUnique({ where: { queryKey } });
    if (!row || row.expiresAt < new Date()) {
      if (row) await prisma.searchCache.delete({ where: { queryKey } }).catch(() => {});
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

// ── Search Logic ────────────────────────────────────────────────────────

function scorePageForQuery(bodyText: string, keywords: string[], category: string, queryWords: string[]): number {
  const lower = bodyText.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    if (keywords.includes(word)) score += 5;

    const occurrences = lower.split(word).length - 1;
    score += Math.min(occurrences, 10) * 2;

    if (category.includes(word)) score += 8;
  }

  // Boost common category aliases
  const categoryAliases: Record<string, string[]> = {
    food: ["food", "pantry", "meal", "hungry", "eat", "calfresh", "snap", "groceries", "dining"],
    housing: ["housing", "apartment", "dorm", "residence", "rent", "shelter", "homeless", "room"],
    financial: ["financial", "aid", "scholarship", "grant", "loan", "fafsa", "tuition", "money", "fee"],
    health: ["health", "medical", "doctor", "clinic", "sick", "prescription", "insurance", "ship"],
    "mental-health": ["mental", "counseling", "therapy", "therapist", "anxiety", "depression", "stress", "crisis"],
    career: ["career", "job", "internship", "resume", "interview", "employer", "work", "employment"],
    academic: ["tutoring", "tutor", "study", "academic", "writing", "library", "learning", "homework", "gpa"],
    tutoring: ["tutoring", "tutor", "study", "help", "math", "science", "writing"],
    legal: ["legal", "lawyer", "law", "rights", "lease", "contract", "immigration"],
    safety: ["safety", "emergency", "police", "assault", "violence", "crisis", "danger"],
    emergency: ["emergency", "crisis", "urgent", "immediate", "help", "danger"],
    disability: ["disability", "disabled", "accommodations", "accessible", "dsp"],
    undocumented: ["undocumented", "daca", "dreamer", "immigration", "undocu"],
    technology: ["technology", "laptop", "wifi", "computer", "software", "internet"],
  };

  for (const [cat, aliases] of Object.entries(categoryAliases)) {
    if (category !== cat) continue;
    for (const alias of aliases) {
      if (queryWords.includes(alias)) score += 10;
    }
  }

  return score;
}

async function findRelevantPages(query: string): Promise<ScoredPage[]> {
  const queryWords = normalizeQuery(query).split(/\s+/).filter((w) => w.length > 2);

  if (queryWords.length === 0) return [];

  // Phase 1: Lightweight scoring using keywords and category only (no bodyText)
  const lightPages = await prisma.scrapedPage.findMany({
    select: { id: true, url: true, title: true, category: true, keywords: true },
  });

  if (lightPages.length === 0) return [];

  const candidates = lightPages
    .map((page) => ({
      ...page,
      score: scorePageForQuery("", page.keywords, page.category, queryWords),
    }))
    .filter((p) => p.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (candidates.length === 0) return [];

  // Phase 2: Load full bodyText only for top candidates, refine scores
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
      score: scorePageForQuery(page.bodyText, page.keywords, page.category, queryWords),
    }))
    .filter((p) => p.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── Summarization ───────────────────────────────────────────────────────

function scoreSentence(sentence: string, queryWords: string[]): number {
  const lower = sentence.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    if (lower.includes(word)) score += 3;
  }

  const signals = ["student", "eligible", "apply", "free", "open", "available",
    "walk-in", "appointment", "bring", "hour", "located", "contact", "deadline"];
  for (const s of signals) {
    if (lower.includes(s)) score += 1;
  }

  return score;
}

function buildSummary(pages: ScoredPage[], query: string): string {
  const queryWords = normalizeQuery(query).split(/\s+/).filter((w) => w.length > 2);
  const allText = pages.map((p) => p.bodyText).join(" ");
  const sentences = splitSentences(allText);

  const scored = sentences.map((s) => ({ s, score: scoreSentence(s, queryWords) }));
  scored.sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const entry of scored) {
    if (picked.length >= 4) break;
    if (entry.score < 2) continue;
    const isDup = picked.some((p) => p.slice(0, 50) === entry.s.slice(0, 50));
    if (!isDup) picked.push(entry.s);
  }

  if (picked.length > 0) return picked.join(" ");
  return `Found ${pages.length} Berkeley resource page(s) related to "${query}". Check the source links for details.`;
}

function extractInsights(pages: ScoredPage[]): AgentSearchResult["insights"] {
  const allText = pages.map((p) => p.bodyText).join(" ");
  const sentences = splitSentences(allText);
  const results: AgentSearchResult["insights"] = [];

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

function buildActionSteps(insights: AgentSearchResult["insights"]): string[] {
  const steps: string[] = [];
  const labels = new Set(insights.map((i) => i.label));

  if (labels.has("Eligibility")) {
    steps.push("Confirm you meet the eligibility requirements listed above.");
  } else {
    steps.push("Open the first source link to check if you're eligible.");
  }

  if (labels.has("How to access")) {
    steps.push("Follow the access steps described in the source.");
  } else {
    steps.push("Look for an 'Apply', 'Get Started', or 'Schedule' button on the page.");
  }

  if (labels.has("What to bring")) {
    steps.push("Gather the required documents before visiting.");
  }

  steps.push("Save the page or contact info for follow-up.");

  return steps;
}

function buildSnippet(bodyText: string, queryWords: string[]): string {
  const sentences = splitSentences(bodyText);
  const best = sentences.find((s) => {
    const lower = s.toLowerCase();
    return queryWords.some((w) => lower.includes(w));
  });
  return best?.slice(0, 200) ?? bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
}

// ── Curated Resource search ──────────────────────────────────────────────
// Searches the hand-curated Resource table so the AI pipeline can leverage
// admin-entered descriptions, eligibility, and location data — not just
// scraped web pages.

type CuratedMatch = {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  url: string | null;
  category: string;
  location: string | null;
};

async function findCuratedResources(queryWords: string[]): Promise<CuratedMatch[]> {
  if (queryWords.length === 0) return [];

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      eligibilityText: true,
      websiteUrl: true,
      officialUrl: true,
      category: { select: { name: true, slug: true } },
      location: { select: { buildingName: true, address: true } },
      resourceTags: { select: { tag: { select: { name: true } } } },
    },
  });

  return resources
    .map((r) => {
      const haystack = [
        r.name,
        r.shortDescription,
        r.eligibilityText,
        r.category.name,
        ...r.resourceTags.map((rt) => rt.tag.name),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const word of queryWords) {
        const occurrences = haystack.split(word).length - 1;
        score += Math.min(occurrences, 5) * 2;
      }

      return {
        resource: {
          id: r.id,
          name: r.name,
          description: r.shortDescription,
          eligibility: r.eligibilityText,
          url: r.websiteUrl ?? r.officialUrl,
          category: r.category.slug,
          location: r.location
            ? [r.location.buildingName, r.location.address].filter(Boolean).join(" · ")
            : null,
        },
        score,
      };
    })
    .filter((entry) => entry.score > 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.resource);
}

// ── Pipeline ────────────────────────────────────────────────────────────

// Scraped/curated results with a top score below this threshold are
// considered "weak" — Perplexity live web search will supplement them.
const CONFIDENCE_THRESHOLD = 25;

export async function runAgentSearch(query: string): Promise<AgentSearchResult> {
  const start = Date.now();
  const queryKey = normalizeQuery(query);

  // 1. Check cache
  const cached = await getCached(queryKey);
  if (cached) {
    cached.meta.durationMs = Date.now() - start;
    return cached;
  }

  // 2. Find relevant pages from our scraped index AND curated resources
  const queryWords = normalizeQuery(query).split(/\s+/).filter((w) => w.length > 2);
  const [pages, curatedMatches] = await Promise.all([
    findRelevantPages(query),
    findCuratedResources(queryWords),
  ]);

  const topScrapedScore = pages.length > 0 ? pages[0].score : 0;
  const hasLocalResults = pages.length > 0 || curatedMatches.length > 0;
  const localResultsWeak = !hasLocalResults || topScrapedScore < CONFIDENCE_THRESHOLD;

  // 3. If no local results at all, check whether the index exists
  if (!hasLocalResults) {
    const pageCount = await prisma.scrapedPage.count();
    if (pageCount === 0) {
      return {
        query,
        summary: "The resource index hasn't been built yet. An admin needs to run the scraper first.",
        action_steps: ["Ask an admin to run the scraper from the admin panel."],
        insights: [],
        sources: [],
        meta: { sourceCount: 0, cached: false, durationMs: Date.now() - start, scrapedAt: new Date().toISOString() },
      };
    }
  }

  // 4. If local results are weak or missing, supplement with Perplexity
  let webKnowledge: import("@/lib/llm-summarize").LLMKnowledgeResult | null = null;
  if (localResultsWeak && isLLMAvailable()) {
    console.log(`[AgentSearch] Local results weak (top score ${topScrapedScore}, threshold ${CONFIDENCE_THRESHOLD}) — supplementing with Perplexity`);
    webKnowledge = await perplexityKnowledgeSearch(query) ?? await llmKnowledgeFallback(query);
  }

  // 5. If we have absolutely nothing (no local, no web), return a static fallback
  if (!hasLocalResults && !webKnowledge) {
    return {
      query,
      summary: `No Berkeley resources matched "${query}". Try different keywords or browse by category.`,
      action_steps: ["Try broader terms like 'food', 'housing', 'financial aid', or 'health'.", "Visit basicneeds.berkeley.edu for common student resources."],
      insights: [],
      sources: [
        { title: "UC Berkeley Basic Needs", url: "https://basicneeds.berkeley.edu", snippet: "Food, housing, and financial resources for students." },
        { title: "UC Berkeley Student Affairs", url: "https://studentaffairs.berkeley.edu", snippet: "Central hub for all student services." },
      ],
      meta: { sourceCount: 0, cached: false, durationMs: Date.now() - start, scrapedAt: new Date().toISOString() },
    };
  }

  // 6. Build sources from scraped pages
  const sources = pages.map((p) => ({
    title: p.title,
    url: p.url,
    snippet: buildSnippet(p.bodyText, queryWords),
    category: CATEGORY_LABELS[p.category] ?? p.category,
  }));

  // 7. Merge curated resources (avoid URL duplicates)
  const existingUrls = new Set(sources.map((s) => s.url));
  for (const cr of curatedMatches) {
    const url = cr.url ?? `/resources/${cr.id}`;
    if (existingUrls.has(url)) continue;
    sources.push({
      title: cr.name,
      url,
      snippet: cr.description,
      category: CATEGORY_LABELS[cr.category] ?? cr.category,
    });
    existingUrls.add(url);
  }

  // 8. Merge Perplexity web knowledge sources (avoid URL duplicates)
  if (webKnowledge) {
    for (const ws of webKnowledge.sources) {
      if (existingUrls.has(ws.url)) continue;
      sources.push({ title: ws.title, url: ws.url, snippet: ws.snippet, category: "Web" });
      existingUrls.add(ws.url);
    }
  }

  // 9. Build combined text for summarisation
  const pageTextsForLLM = [
    ...pages.map((p) => ({ title: p.title, text: p.bodyText })),
    ...curatedMatches.map((cr) => ({
      title: cr.name,
      text: [cr.description, `Eligibility: ${cr.eligibility}`, cr.location ? `Location: ${cr.location}` : ""].filter(Boolean).join(". "),
    })),
  ];

  // If Perplexity returned a summary, inject it as an additional "page" for
  // the LLM summariser so it can synthesise local + web knowledge together.
  if (webKnowledge) {
    pageTextsForLLM.push({
      title: "Live Web Search Results",
      text: webKnowledge.summary,
    });
  }

  // 10. Summarize — try LLM first, fall back to extractive
  let summary: string;
  let insights: AgentSearchResult["insights"];
  let actionSteps: string[];

  const llmResult = isLLMAvailable()
    ? await llmSummarize(query, pageTextsForLLM)
    : null;

  if (llmResult) {
    summary = llmResult.summary;
    insights = llmResult.insights;
    actionSteps = llmResult.action_steps;
  } else if (webKnowledge && !hasLocalResults) {
    // No local results but Perplexity answered — use its output directly
    summary = webKnowledge.summary;
    insights = webKnowledge.insights;
    actionSteps = webKnowledge.action_steps;
  } else {
    summary = buildSummary(pages, query);
    if (pages.length === 0 && curatedMatches.length > 0) {
      summary = curatedMatches
        .map((cr) => `${cr.name}: ${cr.description}`)
        .join(" ");
    }
    insights = extractInsights(pages);
    actionSteps = buildActionSteps(insights);
  }

  // Merge Perplexity insights into local insights (deduplicate by label)
  if (webKnowledge && webKnowledge.insights.length > 0) {
    const existingLabels = new Set(insights.map((i) => i.label));
    for (const wi of webKnowledge.insights) {
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

  // 11. Cache
  await setCache(queryKey, result);

  return result;
}
