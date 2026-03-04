import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildResourceSummary, fetchAndExtractPage } from "@/lib/scrape";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: NextRequest, context: RouteContext) {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  const { id } = await context.params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, officialUrl: true },
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  if (!resource.officialUrl) {
    return NextResponse.json(
      { error: "officialUrl is required before summarizing." },
      { status: 400 },
    );
  }

  const extractedText = await fetchAndExtractPage(resource.officialUrl);
  const summary = buildResourceSummary(extractedText);

  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      summaryJson: summary,
      faqJson: summary.answers,
      lastScrapedAt: new Date(),
      lastSummarizedAt: new Date(),
      lastVerifiedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      summaryJson: true,
      faqJson: true,
      lastScrapedAt: true,
      lastSummarizedAt: true,
    },
  });

  return NextResponse.json(updated);
}
