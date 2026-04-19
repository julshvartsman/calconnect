import { NextResponse } from "next/server";
import { isLLMAvailable, llmResourceChat } from "@/lib/llm-summarize";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  type ResourceChatResponse,
  resourceChatRequestSchema,
  resourceChatResponseSchema,
} from "@/lib/resource-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const ipLog = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return "unknown";
  return forwardedFor.split(",")[0]?.trim() || "unknown";
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

type ChatSource = {
  title: string;
  url: string;
  snippet: string;
};

function makeFallbackResponse(selectedTitle: string, selectedUrl: string): ResourceChatResponse {
  return {
    answer:
      "I could not reach the chat model right now. Use the selected source below first, then check related resources if the first option does not match your needs.",
    insights: [
      { label: "Next step", value: `Open ${selectedTitle} and review eligibility and intake steps.`, sourceIndex: 1 },
      { label: "Documents", value: "Bring your Cal 1 Card and any requirement documents listed on the page.", sourceIndex: 1 },
      { label: "Support", value: "If details are unclear, use the contact method listed on the page for confirmation.", sourceIndex: 1 },
    ],
    sources: [{ title: selectedTitle, url: selectedUrl, snippet: "Selected resource from your search results." }],
    fallback: true,
  };
}

async function getContextSources(selectedUrl: string, selectedTitle: string): Promise<ChatSource[]> {
  const selectedPage = await prisma.scrapedPage.findFirst({
    where: {
      OR: [{ url: selectedUrl }, { title: { contains: selectedTitle, mode: "insensitive" } }],
    },
  });

  const sources: ChatSource[] = [
    {
      title: selectedTitle,
      url: selectedUrl,
      snippet: "Primary selected resource from search results.",
    },
  ];

  if (selectedPage) {
    sources[0].snippet = selectedPage.bodyText.slice(0, 320).replace(/\s+/g, " ").trim();

    const relatedPages = await prisma.scrapedPage.findMany({
      where: {
        id: { not: selectedPage.id },
        OR: [
          { category: selectedPage.category },
          { title: { contains: selectedPage.title.split(" ")[0] ?? "", mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    });

    for (const page of relatedPages) {
      sources.push({
        title: page.title,
        url: page.url,
        snippet: page.bodyText.slice(0, 280).replace(/\s+/g, " ").trim(),
      });
    }
  }

  return sources.slice(0, 6);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before asking another question." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resourceChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resource chat payload." }, { status: 400 });
  }

  const input = parsed.data;
  const contextSources = await getContextSources(input.selectedUrl, input.selectedTitle);

  if (!isLLMAvailable()) {
    const fallback = makeFallbackResponse(input.selectedTitle, input.selectedUrl);
    return NextResponse.json(fallback);
  }

  const llmResult = await llmResourceChat({
    query: input.query,
    selectedTitle: input.selectedTitle,
    selectedUrl: input.selectedUrl,
    question: input.question,
    messages: input.messages,
    contextSources,
  });

  const response: ResourceChatResponse = llmResult
    ? {
        answer: llmResult.answer,
        insights: llmResult.insights,
        sources: contextSources,
        fallback: false,
      }
    : makeFallbackResponse(input.selectedTitle, input.selectedUrl);

  const validated = resourceChatResponseSchema.safeParse(response);
  if (!validated.success) {
    return NextResponse.json(makeFallbackResponse(input.selectedTitle, input.selectedUrl));
  }

  return NextResponse.json(validated.data);
}
