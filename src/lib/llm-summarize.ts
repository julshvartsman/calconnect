// ── Provider Config ─────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq Llama 3.1 8B is faster/cheaper — used for lightweight helper calls
// like query expansion where throughput matters more than quality.
const GROQ_FAST_MODEL = "llama-3.1-8b-instant";

// ── Types ───────────────────────────────────────────────────────────────

export type LLMSummary = {
  summary: string;
  insights: { label: string; value: string }[];
  action_steps: string[];
};

export type LLMKnowledgeResult = LLMSummary & {
  sources: { title: string; url: string; snippet: string }[];
};

export type QueryExpansion = {
  canonicalTerms: string[];
  category: string | null;
};

// ── Key helpers ─────────────────────────────────────────────────────────

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function getGroqKey(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null;
}

export function isLLMAvailable(): boolean {
  return getGeminiKey() !== null || getGroqKey() !== null;
}

// ── Rate Limiter ────────────────────────────────────────────────────────

type ProviderLimits = { rpm: number; rpd: number };

const LIMITS: Record<string, ProviderLimits> = {
  gemini: { rpm: 10, rpd: 1400 },
  groq: { rpm: 25, rpd: 5500 },
};

const callLog: Record<string, number[]> = { gemini: [], groq: [] };

function pruneLog(provider: string) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  callLog[provider] = (callLog[provider] || []).filter((t) => t > dayAgo);
}

function canCall(provider: string): boolean {
  pruneLog(provider);
  const limits = LIMITS[provider];
  if (!limits) return true;

  const now = Date.now();
  const log = callLog[provider];
  const recentMinute = log.filter((t) => t > now - 60_000).length;
  const recentDay = log.length;

  return recentMinute < limits.rpm && recentDay < limits.rpd;
}

function recordCall(provider: string) {
  if (!callLog[provider]) callLog[provider] = [];
  callLog[provider].push(Date.now());
}

function waitTimeMs(provider: string): number {
  pruneLog(provider);
  const limits = LIMITS[provider];
  if (!limits) return 0;

  const now = Date.now();
  const log = callLog[provider];
  const minuteCalls = log.filter((t) => t > now - 60_000);

  if (minuteCalls.length >= limits.rpm) {
    return minuteCalls[0] + 60_000 - now + 500;
  }
  if (log.length >= limits.rpd) {
    return Infinity;
  }
  return 0;
}

async function rateLimitedWait(provider: string): Promise<boolean> {
  const wait = waitTimeMs(provider);
  if (wait === Infinity) return false;
  if (wait > 0 && wait < 30_000) {
    console.log(`[RateLimit] ${provider}: waiting ${Math.round(wait / 1000)}s`);
    await new Promise((r) => setTimeout(r, wait));
  } else if (wait >= 30_000) {
    return false;
  }
  return true;
}

export function getLLMUsage() {
  pruneLog("gemini");
  pruneLog("groq");
  const now = Date.now();
  const stats = (p: string) => ({
    minute: (callLog[p] || []).filter((t) => t > now - 60_000).length,
    day: (callLog[p] || []).length,
  });
  return { gemini: stats("gemini"), groq: stats("groq") };
}

// ── Provider callers ────────────────────────────────────────────────────

async function callGemini(prompt: string, apiKey: string, label: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[LLM] Gemini ${res.status} (${label}): ${body.slice(0, 150)}`);
      return null;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error(`[LLM] Gemini error (${label}):`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function callGroq(
  prompt: string,
  apiKey: string,
  label: string,
  options?: { model?: string; maxTokens?: number; temperature?: number },
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[LLM] Groq ${res.status} (${label}): ${body.slice(0, 150)}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error(`[LLM] Groq error (${label}):`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Unified LLM caller (for JSON prompts) ───────────────────────────────
// Priority: Gemini (higher quality) -> Groq (fast fallback)

async function callLLM(prompt: string, label: string): Promise<string | null> {
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();

  if (geminiKey && canCall("gemini")) {
    const ok = await rateLimitedWait("gemini");
    if (ok) {
      recordCall("gemini");
      const result = await callGemini(prompt, geminiKey, label);
      if (result) return result;
      console.log(`[LLM] Gemini failed for ${label}, trying Groq...`);
    }
  }

  if (groqKey && canCall("groq")) {
    const ok = await rateLimitedWait("groq");
    if (ok) {
      recordCall("groq");
      const result = await callGroq(prompt, groqKey, label);
      if (result) return result;
    }
  }

  console.error(`[LLM] All providers failed/rate-limited for ${label}`);
  return null;
}

// ── JSON parsing ────────────────────────────────────────────────────────

function parseJSON(text: string): Record<string, unknown> | null {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("[LLM] JSON parse failed:", cleaned.slice(0, 200));
    return null;
  }
}

// ── Local pre-processing ────────────────────────────────────────────────

function extractRelevantParagraphs(text: string, query: string, maxChars = 1200): string {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const actionWords = [
    "eligible", "eligibility", "apply", "application", "hours", "open", "close",
    "located", "location", "building", "room", "bring", "required", "free",
    "cost", "fee", "walk-in", "appointment", "email", "phone", "contact",
    "deadline", "schedule", "monday", "tuesday", "wednesday", "thursday", "friday",
  ];

  const paragraphs = text
    .split(/(?:\.\s{2,}|\n\s*\n|\.\s+(?=[A-Z]))/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30 && p.length < 500);

  const scored = paragraphs.map((p) => {
    const lower = p.toLowerCase();
    let score = 0;
    for (const w of queryWords) {
      if (lower.includes(w)) score += 3;
    }
    for (const w of actionWords) {
      if (lower.includes(w)) score += 1;
    }
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  let result = "";
  for (const { p, score } of scored) {
    if (score < 2) break;
    if (result.length + p.length > maxChars) break;
    result += p + " ";
  }

  return result.trim() || text.slice(0, maxChars);
}

// ── Query expansion ─────────────────────────────────────────────────────
// Uses the fastest LLM we have to rewrite the user's natural-language query
// into a compact set of canonical Berkeley resource terms, plus a guess at
// the category. Powers the retrieval layer — the scoring function scans for
// these terms, not just the raw user tokens.
//
// Always falls back safely: if the LLM is unavailable or returns junk, we
// return the original tokens only. Retrieval quality never regresses.

const KNOWN_CATEGORIES = [
  "food",
  "health",
  "mental-health",
  "safety",
  "housing",
  "financial",
  "academic",
  "career",
  "legal",
  "disability",
  "technology",
  "international",
  "community",
  "student-life",
];

const EXPANSION_TIMEOUT_MS = 6000;

export async function expandQuery(query: string): Promise<QueryExpansion> {
  const baseTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  if (baseTerms.length === 0 || !isLLMAvailable()) {
    return { canonicalTerms: baseTerms, category: null };
  }

  const prompt = `You translate a UC Berkeley student's natural-language query into retrieval terms for a campus resource index.

Student query: "${query}"

Known categories (pick at most one, or null if unclear):
${KNOWN_CATEGORIES.join(", ")}

Return JSON with:
- "canonical_terms": array of 4-10 short lowercase terms or phrases most likely to match a Berkeley resource record. Include synonyms, common resource names (e.g. "CAPS" for counseling, "Food Pantry" for food, "FAFSA" for financial aid, "DSP" for disability, "Tang Center" for health, "Berkeley Law" for legal). Include the most specific terms first. Do NOT include generic words like "help", "need", "how", "get".
- "category": best-guess category slug from the list above, or null.

Respond with ONLY valid JSON.`;

  // Prefer Groq's fast model for this — it's cheap and returns in <1s.
  const groqKey = getGroqKey();
  const geminiKey = getGeminiKey();

  let raw: string | null = null;

  if (groqKey && canCall("groq")) {
    const ok = await rateLimitedWait("groq");
    if (ok) {
      recordCall("groq");
      try {
        const fastPromise = callGroq(prompt, groqKey, "expand-query", {
          model: GROQ_FAST_MODEL,
          maxTokens: 400,
          temperature: 0.1,
        });
        raw = await Promise.race([
          fastPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), EXPANSION_TIMEOUT_MS)),
        ]);
      } catch {
        raw = null;
      }
    }
  }

  if (!raw && geminiKey && canCall("gemini")) {
    const ok = await rateLimitedWait("gemini");
    if (ok) {
      recordCall("gemini");
      raw = await callGemini(prompt, geminiKey, "expand-query");
    }
  }

  if (!raw) {
    return { canonicalTerms: baseTerms, category: null };
  }

  const parsed = parseJSON(raw);
  if (!parsed) {
    return { canonicalTerms: baseTerms, category: null };
  }

  const rawTerms = Array.isArray(parsed.canonical_terms) ? parsed.canonical_terms : [];
  const expanded = rawTerms
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && t.length < 60);

  // Always include the base terms so we never lose signal.
  const merged = Array.from(new Set([...baseTerms, ...expanded]));

  const rawCategory = typeof parsed.category === "string" ? parsed.category.trim().toLowerCase() : null;
  const category = rawCategory && KNOWN_CATEGORIES.includes(rawCategory) ? rawCategory : null;

  return { canonicalTerms: merged, category };
}

// ── Prompts ─────────────────────────────────────────────────────────────

function buildSummarizePrompt(
  query: string,
  curatedBlock: string,
  scrapedSources: { title: string; excerpt: string }[],
): string {
  const scrapedBlock = scrapedSources.length
    ? scrapedSources
        .map((s, i) => `[Web ${i + 1}: ${s.title}]\n${s.excerpt}`)
        .join("\n\n")
    : "(none)";

  const hasCurated = curatedBlock.trim().length > 0;
  const curatedSection = hasCurated ? curatedBlock : "(no curated resources matched)";

  return `You are a UC Berkeley student resource assistant. You answer in a concrete, factual, non-generic way. Never invent facts.

Student query: "${query}"

== PRIMARY SOURCES — hand-curated CalConnect resources ==
These are canonical, verified Berkeley resources. When they contain the answer, prefer them over web excerpts.

${curatedSection}

== SUPPORTING SOURCES — scraped Berkeley web pages ==
${scrapedBlock}

Return JSON with exactly these keys:

1. "summary": 2-4 sentences that directly answer the student's question using the sources above.
   - Lead with the single best-matching resource name (e.g. "The Food Pantry offers...").
   - Include concrete facts: building name, floor, hours, eligibility, cost — but ONLY if present in the sources.
   - Do NOT start with "Based on...", "According to...", or filler. Just answer.
   - If the sources do not clearly answer the question, write exactly: "I don't have verified info on this in our directory yet — try the resources below or search a different term."

2. "insights": array of {"label", "value"} objects. Use ONLY these labels when the data is present in the sources:
   - "Eligibility"
   - "Hours"
   - "Location"
   - "Cost"
   - "What to bring"
   - "How to access"
   - "Contact"
   - "Deadline"
   Omit labels with no data. Each value should be 1 short sentence. Do NOT hallucinate missing hours or locations.

3. "action_steps": array of 3-4 concrete steps. Each step must name a specific resource, building, URL, or contact — not generic advice like "contact the office". If the sources don't support a specific action, write "Open the first source below for details" and stop.

Rules:
- When curated data conflicts with scraped data, trust curated.
- Do NOT fabricate hours, eligibility rules, URLs, or contact info.
- Use plain text; no markdown.

Respond with ONLY valid JSON.`;
}

function buildKnowledgePrompt(query: string): string {
  return `You are a UC Berkeley student resource assistant. A student searched: "${query}"

Our indexed Berkeley directory has no confident match for this query.

Using your general knowledge of UC Berkeley campus resources (berkeley.edu domain), provide a best-effort answer. Be explicit about uncertainty — prefer "I'm not sure" over guessing.

Return JSON with:
1. "summary": 2-4 sentences. Start with "Not in our directory, but" if you are answering from general knowledge.
2. "insights": array of {"label","value"}. Labels: Eligibility, How to access, Hours, Location, Contact, Cost. Include only labels where you are reasonably confident.
3. "action_steps": 3-4 steps. Name specific Berkeley offices/URLs only if you are confident they exist (e.g. basicneeds.berkeley.edu, caps.berkeley.edu, dsp.berkeley.edu).
4. "sources": array of {"title","url","snippet"} — 2-4 real berkeley.edu pages. Do NOT invent URLs; only include ones you are confident exist.

Respond with ONLY valid JSON.`;
}

// ── Public API ──────────────────────────────────────────────────────────

export async function llmSummarize(
  query: string,
  curatedBlock: string,
  scrapedPageTexts: { title: string; text: string }[],
): Promise<LLMSummary | null> {
  const maxPerPage = scrapedPageTexts.length > 3 ? 800 : 1200;
  const scrapedSources = scrapedPageTexts.slice(0, 5).map((page) => ({
    title: page.title,
    excerpt: extractRelevantParagraphs(page.text, query, maxPerPage),
  }));

  const prompt = buildSummarizePrompt(query, curatedBlock, scrapedSources);
  console.log(
    `[LLM] Summarize: ${prompt.length} chars (curated=${curatedBlock.length > 0 ? "yes" : "no"}, ${scrapedSources.length} scraped)`,
  );

  const text = await callLLM(prompt, "summarize");
  if (!text) return null;

  const parsed = parseJSON(text);
  if (!parsed || typeof parsed.summary !== "string") return null;

  const result: LLMSummary = {
    summary: parsed.summary as string,
    insights: Array.isArray(parsed.insights)
      ? (parsed.insights as { label: string; value: string }[]).filter(
          (i) => i && typeof i === "object" && "label" in i && "value" in i,
        )
      : [],
    action_steps: Array.isArray(parsed.action_steps)
      ? (parsed.action_steps as string[]).filter((s) => typeof s === "string")
      : [],
  };

  console.log(`[LLM] Summarize success: ${result.insights.length} insights, ${result.action_steps.length} steps`);
  return result;
}

export async function llmKnowledgeFallback(query: string): Promise<LLMKnowledgeResult | null> {
  const prompt = buildKnowledgePrompt(query);
  console.log(`[LLM] Knowledge fallback for: "${query}"`);

  const text = await callLLM(prompt, "knowledge");
  if (!text) return null;

  const parsed = parseJSON(text);
  if (!parsed || typeof parsed.summary !== "string") return null;

  console.log(`[LLM] Knowledge fallback success`);

  return {
    summary: parsed.summary as string,
    insights: Array.isArray(parsed.insights)
      ? (parsed.insights as { label: string; value: string }[]).filter(
          (i) => i && typeof i === "object" && "label" in i && "value" in i,
        )
      : [],
    action_steps: Array.isArray(parsed.action_steps)
      ? (parsed.action_steps as string[]).filter((s) => typeof s === "string")
      : [],
    sources: Array.isArray(parsed.sources)
      ? (parsed.sources as { title: string; url: string; snippet: string }[]).filter(
          (s) => s && typeof s === "object" && "title" in s && "url" in s,
        )
      : [],
  };
}

type ResourceChatInput = {
  query: string;
  selectedTitle: string;
  selectedUrl: string;
  question: string;
  messages: { role: "user" | "assistant"; content: string }[];
  contextSources: { title: string; url: string; snippet: string }[];
};

type ResourceChatOutput = {
  answer: string;
  insights: { label: string; value: string; sourceIndex: number }[];
};

const broadPhrases = [
  "it depends",
  "generally",
  "typically",
  "in most cases",
  "you may want to",
  "consider reaching out",
  "for more information",
];

function hasSpecificInsights(output: ResourceChatOutput): boolean {
  if (output.insights.length < 3) return false;
  const genericCount = output.insights.filter((item) =>
    broadPhrases.some((phrase) => item.value.toLowerCase().includes(phrase)),
  ).length;
  return genericCount <= 1;
}

function buildResourceChatPrompt(input: ResourceChatInput): string {
  const sourceText = input.contextSources
    .map(
      (source, index) =>
        `[Source ${index + 1}] ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet}`,
    )
    .join("\n\n");

  const history = input.messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return `You are a UC Berkeley advising assistant focused on one selected resource plus closely related resources.

Selected resource:
- Title: ${input.selectedTitle}
- URL: ${input.selectedUrl}
- Original search: ${input.query}

Conversation history:
${history || "No prior chat history."}

Current user question:
${input.question}

Allowed evidence (use ONLY this):
${sourceText}

Return ONLY valid JSON with:
1) "answer": 2-4 concise sentences directly answering the question using specific details from sources.
2) "insights": array of 3-6 items with exact keys:
   - label: short category (Eligibility, Next step, Documents, Timeline, Cost, Contact, Location, Hours)
   - value: one concrete, decision-ready fact (no broad generic advice)
   - sourceIndex: integer index of supporting source (1-based)

Rules:
- Prioritize selected resource details first, then related resources.
- Every insight must be grounded in one source and include concrete facts when available.
- If a fact is not in sources, say "Not confirmed in source" for that insight value.
- Do not invent details.`;
}

export async function llmResourceChat(input: ResourceChatInput): Promise<ResourceChatOutput | null> {
  const prompt = buildResourceChatPrompt(input);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const text = await callLLM(prompt, `resource-chat-${attempt + 1}`);
    if (!text) continue;

    const parsed = parseJSON(text);
    if (
      !parsed ||
      typeof parsed.answer !== "string" ||
      !Array.isArray(parsed.insights)
    ) {
      continue;
    }

    const output: ResourceChatOutput = {
      answer: parsed.answer,
      insights: parsed.insights
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: typeof item.label === "string" ? item.label : "Detail",
          value: typeof item.value === "string" ? item.value : "Not confirmed in source",
          sourceIndex:
            typeof item.sourceIndex === "number" && Number.isInteger(item.sourceIndex)
              ? item.sourceIndex
              : 1,
        }))
        .slice(0, 6),
    };

    if (hasSpecificInsights(output)) {
      return output;
    }
  }

  return null;
}
