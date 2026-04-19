import { z } from "zod";

export type ResourceChatSource = {
  title: string;
  url: string;
  snippet: string;
};

export type ResourceChatInsight = {
  label: string;
  value: string;
  sourceIndex: number;
};

export type ResourceChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ResourceChatResponse = {
  answer: string;
  insights: ResourceChatInsight[];
  sources: ResourceChatSource[];
  fallback: boolean;
};

export const resourceChatRequestSchema = z.object({
  query: z.string().trim().min(1).max(300),
  selectedUrl: z.string().url(),
  selectedTitle: z.string().trim().min(1).max(300),
  question: z.string().trim().min(2).max(800),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1200),
      }),
    )
    .max(8)
    .default([]),
});

export type ResourceChatRequest = z.infer<typeof resourceChatRequestSchema>;

export const resourceChatResponseSchema = z.object({
  answer: z.string().trim().min(1),
  insights: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(240),
        sourceIndex: z.number().int().min(1).max(6),
      }),
    )
    .min(3)
    .max(6),
  sources: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(300),
        url: z.string().url(),
        snippet: z.string().trim().min(1).max(400),
      }),
    )
    .min(1)
    .max(6),
  fallback: z.boolean().default(false),
});
