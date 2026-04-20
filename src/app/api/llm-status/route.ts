import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { getLLMUsage, isLLMAvailable } from "@/lib/llm-summarize";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  return NextResponse.json({
    available: isLLMAvailable(),
    usage: getLLMUsage(),
    limits: {
      gemini: { rpm: 10, rpd: 1400, note: "Primary — Gemini 2.5 Flash, free tier" },
      groq: { rpm: 25, rpd: 5500, note: "Fallback — Llama 3.3 70B, free tier" },
    },
  });
}
