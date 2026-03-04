import { NextRequest, NextResponse } from "next/server";
import { runAgentSearch } from "@/lib/agent-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── Simple per-IP sliding-window rate limiter ───────────────────────────

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const ipLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipLog.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  ipLog.set(ip, timestamps);

  if (timestamps.length >= MAX_PER_WINDOW) return true;
  timestamps.push(now);
  return false;
}

// Periodically prune stale entries so the map doesn't grow unbounded
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of ipLog) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) ipLog.delete(ip);
    else ipLog.set(ip, fresh);
  }
}, 5 * 60_000);

// ── Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before searching again." },
      { status: 429 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing q parameter." }, { status: 400 });
  }

  try {
    const result = await runAgentSearch(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json(
      {
        query,
        summary: "Search agents could not complete right now. Please try again.",
        action_steps: [],
        insights: [],
        sources: [],
        meta: { sourceCount: 0, cached: false, durationMs: 0, scrapedAt: new Date().toISOString() },
        error: message,
      },
      { status: 500 },
    );
  }
}
