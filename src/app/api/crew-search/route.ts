import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runAgentSearch } from "@/lib/agent-search";
import { buildQueryKey, redactPii } from "@/lib/analytics/search-events";
import { prisma } from "@/lib/prisma";

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

  // Capture the user (if any) BEFORE running the search so we can persist
  // the event with their email. If there's no session we still serve the
  // search, but the event just won't be attributed to a user.
  let userEmail: string | null = null;
  try {
    const session = await auth();
    userEmail = session?.user?.email ?? null;
    if (!userEmail) {
      console.warn("[CrewSearch] No authenticated user — search event will not be recorded.");
    }
  } catch (err) {
    console.error(
      "[CrewSearch] auth() threw — search event will not be recorded:",
      err instanceof Error ? err.message : err,
    );
  }

  try {
    const result = await runAgentSearch(query);

    // Persist the search event server-side. This is the authoritative record
    // — client-side `trackSearchEvent` is unreliable (keepalive + rapid
    // navigation can drop the request, and any auth hiccup makes it 401).
    // We `await` the write so failures show up in logs with a stack. The
    // response still lands in ~ms because Prisma is fast; if it ever becomes
    // a bottleneck we'll move this to a non-awaited task.
    if (userEmail) {
      const safeQuery = redactPii(query);
      const queryKey = buildQueryKey(safeQuery);
      try {
        await prisma.searchEvent.create({
          data: {
            eventType: "search_submitted",
            query: safeQuery,
            queryKey,
            anonymousId: "server",
            sessionId: "server",
            userEmail,
            path: "/api/crew-search",
            resultCount: result.sources.length,
            durationMs: result.meta.durationMs,
            cached: result.meta.cached,
            success: true,
          },
        });
        console.log(
          `[CrewSearch] Recorded search_submitted for ${userEmail}: "${safeQuery}" (${result.sources.length} sources, ${result.meta.durationMs}ms)`,
        );
      } catch (err) {
        // Most likely cause on Vercel: the userEmail migration hasn't applied
        // yet, so the column doesn't exist on `SearchEvent`. Log loudly so
        // this is visible in Vercel runtime logs.
        console.error(
          "[CrewSearch] Failed to record search event. If this says 'column \"userEmail\" does not exist', run `prisma migrate deploy` or redeploy to apply migrations:",
          err instanceof Error ? err.message : err,
        );
      }
    }

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
