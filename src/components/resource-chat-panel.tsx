"use client";

import { useMemo, useState } from "react";
import { trackSearchEvent } from "@/lib/analytics/client";

type ChatSource = {
  title: string;
  url: string;
  snippet?: string;
};

type ChatInsight = {
  label: string;
  value: string;
  sourceIndex: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  insights?: ChatInsight[];
  sources?: ChatSource[];
  fallback?: boolean;
};

type ChatApiPayload = {
  answer?: string;
  insights?: ChatInsight[];
  sources?: ChatSource[];
  fallback?: boolean;
};

type Props = {
  query: string;
  source: ChatSource;
  onClose: () => void;
};

export function ResourceChatPanel({ query, source, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Ask me anything about "${source.title}". I will prioritize this resource and include related options when useful.`,
      sources: [source],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const history = useMemo(
    () => messages.filter((m) => m.role !== "assistant" || m.insights).slice(-8).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    trackSearchEvent({
      eventType: "chat_question_asked",
      query,
      path: "/search",
      metadata: { sourceUrl: source.url, sourceTitle: source.title },
    });

    try {
      const response = await fetch("/api/resource-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query,
          selectedUrl: source.url,
          selectedTitle: source.title,
          question,
          messages: history,
        }),
      });
      const payload = (await response.json()) as ChatApiPayload;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: payload.answer ?? "I could not generate a response right now.",
          insights: payload.insights ?? [],
          sources: payload.sources ?? [source],
          fallback: payload.fallback ?? false,
        },
      ]);
      trackSearchEvent({
        eventType: "chat_response_returned",
        query,
        path: "/search",
        success: response.ok,
        metadata: {
          sourceUrl: source.url,
          fallback: payload.fallback ?? false,
          insightCount: Array.isArray(payload.insights) ? payload.insights.length : 0,
        },
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not load chat right now. Please open the source link directly for details.",
          sources: [source],
          fallback: true,
        },
      ]);
      trackSearchEvent({
        eventType: "chat_fallback_served",
        query,
        path: "/search",
        success: false,
        metadata: { sourceUrl: source.url, reason: "request_failed" },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resource advisor chat</p>
          <p className="text-sm font-medium text-slate-800">{source.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
        {messages.map((message, idx) => (
          <div
            key={`${message.role}-${idx}`}
            className={`rounded-xl px-3 py-2 text-sm ${message.role === "user" ? "ml-8 bg-[var(--berkeley-blue)] text-white" : "mr-8 bg-white text-slate-700"}`}
          >
            <p>{message.content}</p>
            {message.insights && message.insights.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {message.insights.map((insight, insightIndex) => (
                  <li key={`${insight.label}-${insightIndex}`} className="rounded bg-slate-50 px-2 py-1 text-slate-700">
                    <span className="font-semibold">{insight.label}:</span> {insight.value}
                  </li>
                ))}
              </ul>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 space-y-1 text-xs">
                {message.sources.slice(0, 3).map((src) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noreferrer" className="block truncate text-[var(--berkeley-blue)] hover:underline">
                    {src.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-xs text-slate-500">Thinking about your question...</p>}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a specific advising question..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--berkeley-blue)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--berkeley-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </aside>
  );
}
