// ── Provider Config ─────────────────────────────────────────────────────

const PERPLEXITY_MODEL = "sonar";
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── Types ───────────────────────────────────────────────────────────────

export type LLMSummary = {
  summary: string;
  insights: { label: string; value: string }[];
  action_steps: string[];
};

export type LLMKnowledgeResult = LLMSummary & {
  sources: { title: string; url: string; snippet: string }[];
};

// ── Key helpers ─────────────────────────────────────────────────────────

function getPerplexityKey(): string | null {
  return process.env.PERPLEXITY_API_KEY?.trim() || null;
}

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function getGroqKey(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null;
}

export function isLLMAvailable(): boolean {
  return getPerplexityKey() !== null || getGeminiKey() !== null || getGroqKey() !== null;
}

// ── Rate Limiter ────────────────────────────────────────────────────────

type ProviderLimits = { rpm: number; rpd: number };

const LIMITS: Record<string, ProviderLimits> = {
  perplexity: { rpm: 20, rpd: 1000 },
  gemini:     { rpm: 10, rpd: 1400 },
  groq:       { rpm: 25, rpd: 5500 },
};

const callLog: Record<string, number[]> = { perplexity: [], gemini: [], groq: [] };

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
  pruneLog("perplexity");
  pruneLog("gemini");
  pruneLog("groq");
  const now = Date.now();
  const stats = (p: string) => ({
    minute: (callLog[p] || []).filter((t) => t > now - 60_000).length,
    day: (callLog[p] || []).length,
  });
  return { perplexity: stats("perplexity"), gemini: stats("gemini"), groq: stats("groq") };
}

// ── Provider callers ────────────────────────────────────────────────────

async function callPerplexity(prompt: string, apiKey: string, label: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(PERPLEXITY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[LLM] Perplexity ${res.status} (${label}): ${body.slice(0, 150)}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error(`[LLM] Perplexity error (${label}):`, err instanceof Error ? err.message : err);
    return null;
  }
}

type PerplexityResponse = {
  content: string | null;
  citations: string[];
};

async function callPerplexityWithCitations(prompt: string, apiKey: string, label: string): Promise<PerplexityResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(PERPLEXITY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[LLM] Perplexity ${res.status} (${label}): ${body.slice(0, 150)}`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? null;
    const citations: string[] = Array.isArray(data?.citations) ? data.citations : [];

    return { content, citations };
  } catch (err) {
    console.error(`[LLM] Perplexity error (${label}):`, err instanceof Error ? err.message : err);
    return null;
  }
}

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

async function callGroq(prompt: string, apiKey: string, label: string): Promise<string | null> {
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
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
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
// Priority: Perplexity -> Gemini -> Groq

async function callLLM(prompt: string, label: string): Promise<string | null> {
  const pplxKey = getPerplexityKey();
  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();

  if (pplxKey && canCall("perplexity")) {
    const ok = await rateLimitedWait("perplexity");
    if (ok) {
      recordCall("perplexity");
      const result = await callPerplexity(prompt, pplxKey, label);
      if (result) return result;
      console.log(`[LLM] Perplexity failed for ${label}, trying Gemini...`);
    } else {
      console.log(`[LLM] Perplexity rate-limited for ${label}, skipping`);
    }
  }

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

// ── Prompts ─────────────────────────────────────────────────────────────

function buildSummarizePrompt(query: string, sources: { title: string; excerpt: string }[]): string {
  const combined = sources
    .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.excerpt}`)
    .join("\n\n");

  return `You are a student resource assistant for UC Berkeley. A student searched: "${query}"

Below are relevant excerpts from official Berkeley pages. Using ONLY this information, create a structured JSON response.

${combined}

Return JSON with:
1. "summary": 2-4 clear sentences directly answering the student's need. Include concrete details (locations, hours, deadlines). No preamble like "Based on..." — just answer directly.
2. "insights": Array of {"label", "value"} objects. Labels to use when info is available: Eligibility, How to access, What to bring, Cost, Hours, Location, Contact, Deadline. Values should be concise (1-2 sentences max). ONLY include labels where the excerpts contain real information.
3. "action_steps": 3-4 specific steps with real names/locations (e.g. "Visit the Food Pantry in bNorth, MLK Student Union" not "Visit the resource").

Respond with ONLY valid JSON.`;
}

function buildKnowledgePrompt(query: string): string {
  return `You are a UC Berkeley student resource assistant. A student searched: "${query}"

Our indexed Berkeley pages didn't have a strong match for this query. Using your knowledge of UC Berkeley campus resources, student services, and the Bay Area:

1. Identify the most relevant UC Berkeley offices, programs, or campus resources for this need.
2. If this is something not covered by a specific Berkeley office, suggest the closest relevant campus resources.
3. Include real berkeley.edu URLs where possible. For off-campus resources, use real URLs too.

Return JSON with:
1. "summary": 2-4 clear sentences answering the student's need with concrete details. Be specific about Berkeley resources. No preamble.
2. "insights": Array of {"label", "value"} objects. Use labels: Eligibility, How to access, What to bring, Cost, Hours, Location, Contact as applicable. Keep values concise.
3. "action_steps": 3-4 specific actionable steps with real office/building names.
4. "sources": Array of {"title", "url", "snippet"} objects — suggest 2-4 real resource pages that would help. Use real berkeley.edu URLs when possible, but also include other helpful real URLs.

Respond with ONLY valid JSON.`;
}

// ── Perplexity Knowledge Search ─────────────────────────────────────────
// Uses Sonar's built-in web search for queries our index can't answer.
// Returns grounded answers with real citations from the live web.

export async function perplexityKnowledgeSearch(query: string): Promise<LLMKnowledgeResult | null> {
  const pplxKey = getPerplexityKey();
  if (!pplxKey) return null;

  if (!canCall("perplexity")) {
    console.log("[LLM] Perplexity rate-limited for knowledge search");
    return null;
  }

  const ok = await rateLimitedWait("perplexity");
  if (!ok) return null;

  const prompt = `A UC Berkeley student needs help with: "${query}"

Search for the most relevant UC Berkeley campus resources, offices, or programs for this need. Focus on berkeley.edu pages and official campus services. If this is something handled off-campus, include those resources too.

Provide a helpful, specific answer with:
1. A clear 2-4 sentence summary with concrete details (building names, hours, phone numbers, URLs)
2. Key details about eligibility, how to access the resource, hours, location, and cost
3. 3-4 specific action steps the student should take

Format your response as JSON with these exact keys:
- "summary": string (2-4 sentences, no preamble)
- "insights": array of {"label": string, "value": string} (use labels like Eligibility, How to access, Hours, Location, Contact, Cost)
- "action_steps": array of strings (3-4 specific steps)

Respond with ONLY valid JSON.`;

  console.log(`[LLM] Perplexity knowledge search for: "${query}"`);
  recordCall("perplexity");

  const response = await callPerplexityWithCitations(prompt, pplxKey, "knowledge-search");
  if (!response?.content) return null;

  const parsed = parseJSON(response.content);
  if (!parsed || typeof parsed.summary !== "string") return null;

  const sources = response.citations.map((url, i) => {
    let title: string;
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      const path = new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "";
      title = path ? `${hostname} — ${path.replace(/-/g, " ")}` : hostname;
    } catch {
      title = `Source ${i + 1}`;
    }
    return { title, url, snippet: "" };
  });

  console.log(`[LLM] Perplexity knowledge search success: ${sources.length} citations`);

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
    sources,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export async function llmSummarize(
  query: string,
  pageTexts: { title: string; text: string }[],
): Promise<LLMSummary | null> {
  const maxPerPage = pageTexts.length > 3 ? 800 : 1200;
  const sources = pageTexts.slice(0, 5).map((page) => ({
    title: page.title,
    excerpt: extractRelevantParagraphs(page.text, query, maxPerPage),
  }));

  const prompt = buildSummarizePrompt(query, sources);
  console.log(`[LLM] Summarize: ${prompt.length} chars (pre-filtered from ${pageTexts.length} pages)...`);

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
