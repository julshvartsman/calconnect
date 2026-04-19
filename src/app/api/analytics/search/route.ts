import { NextRequest, NextResponse } from "next/server";
import { Prisma, SearchEventType } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  buildQueryKey,
  redactPii,
  searchEventSchema,
} from "@/lib/analytics/search-events";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const ipLog = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipLog.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  ipLog.set(ip, timestamps);

  if (timestamps.length >= MAX_PER_WINDOW) return true;
  timestamps.push(now);
  return false;
}

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of ipLog) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) ipLog.delete(ip);
    else ipLog.set(ip, fresh);
  }
}, 5 * 60_000);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many analytics events. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = searchEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const event = parsed.data;
  const query = redactPii(event.query);
  const queryKey = buildQueryKey(query);

  await prisma.searchEvent.create({
    data: {
      eventType: event.eventType as SearchEventType,
      query,
      queryKey,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      path: event.path,
      resultCount: event.resultCount,
      durationMs: event.durationMs,
      cached: event.cached,
      success: event.success,
      resultId: event.resultId,
      resultRank: event.resultRank,
      metadata: event.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
