import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { scrapeAllSources } from "@/lib/scrape-berkeley";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  try {
    const logs: string[] = [];

    const result = await scrapeAllSources((done, total, url, ok) => {
      logs.push(`[${done}/${total}] ${ok ? "OK" : "FAIL"} ${url}`);
    });

    // Invalidate all cached search results since the underlying data changed
    await prisma.searchCache.deleteMany();

    return NextResponse.json({
      message: `Scraping complete: ${result.success} succeeded, ${result.failed} failed out of ${result.total}.`,
      ...result,
      logs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const count = await prisma.scrapedPage.count();
  const pages = await prisma.scrapedPage.findMany({
    select: { url: true, title: true, category: true, scrapedAt: true },
    orderBy: { scrapedAt: "desc" },
  });

  return NextResponse.json({ totalPages: count, pages });
}
