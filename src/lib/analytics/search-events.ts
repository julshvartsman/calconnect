import { z } from "zod";

export const SEARCH_ANALYTICS_PATH = "/api/analytics/search";
export const MAX_QUERY_LENGTH = 300;

const piiPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g,
];

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function buildQueryKey(query: string): string {
  return normalizeQuery(query).toLowerCase();
}

export function redactPii(input: string): string {
  let output = input;
  for (const pattern of piiPatterns) {
    output = output.replace(pattern, "[redacted]");
  }
  return output;
}

export const searchEventSchema = z.object({
  eventType: z.enum([
    "search_submitted",
    "search_results",
    "search_no_results",
    "result_clicked",
    "chat_opened",
    "chat_question_asked",
    "chat_response_returned",
    "chat_fallback_served",
  ]),
  query: z.string().trim().min(1).max(MAX_QUERY_LENGTH),
  anonymousId: z.string().min(8).max(128),
  sessionId: z.string().min(8).max(128),
  path: z.string().trim().min(1).max(256).optional(),
  resultCount: z.number().int().min(0).max(200).optional(),
  durationMs: z.number().int().min(0).max(120_000).optional(),
  cached: z.boolean().optional(),
  success: z.boolean().optional(),
  resultId: z.string().trim().min(1).max(256).optional(),
  resultRank: z.number().int().min(1).max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SearchEventPayload = z.infer<typeof searchEventSchema>;
