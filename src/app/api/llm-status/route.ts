import { NextResponse } from "next/server";
import { getLLMUsage, isLLMAvailable } from "@/lib/llm-summarize";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    available: isLLMAvailable(),
    usage: getLLMUsage(),
    limits: {
      perplexity: { rpm: 20, rpd: 1000, note: "Primary — Sonar ~$0.006/query, searches live web" },
      gemini: { rpm: 10, rpd: 1400, note: "Free fallback: 15 RPM / 1500 RPD" },
      groq: { rpm: 25, rpd: 5500, note: "Free fallback: 30 RPM / 6000 RPD" },
    },
  });
}
