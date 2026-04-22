"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FINANCIAL_OPTIONS,
  IDENTITY_OPTIONS,
  TOPIC_OPTIONS,
  YEAR_OPTIONS,
  type OnboardingProfile,
} from "@/lib/onboarding";

type Props = {
  initial: OnboardingProfile | null;
  nextPath: string;
};

export function OnboardingForm({ initial, nextPath }: Props) {
  const router = useRouter();

  const [year, setYear] = useState<string>(initial?.year ?? "");
  const [topics, setTopics] = useState<Set<string>>(new Set(initial?.topics ?? []));
  const [identities, setIdentities] = useState<Set<string>>(new Set(initial?.identities ?? []));
  const [financialSituation, setFinancialSituation] = useState<string>(
    initial?.financialSituation ?? "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return year.length > 0 && topics.size > 0;
  }, [year, topics]);

  function toggleInSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          year,
          topics: Array.from(topics),
          identities: Array.from(identities),
          financialSituation: financialSituation || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Could not save (${res.status})`);
      }

      router.push(nextPath);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Year ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Where are you at Berkeley?
          </h2>
          <span className="text-[11px] text-slate-400">Required</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">We&apos;ll use this to suggest year-appropriate resources.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {YEAR_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              active={year === option.value}
              onClick={() => setYear(option.value)}
            />
          ))}
        </div>
      </section>

      {/* ── Topics ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            What would be most useful to you?
          </h2>
          <span className="text-[11px] text-slate-400">Pick at least one</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Choose as many as apply. We&apos;ll surface resources in these areas first.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {TOPIC_OPTIONS.map((option) => (
            <TopicChip
              key={option.value}
              label={option.label}
              hint={option.hint}
              active={topics.has(option.value)}
              onClick={() => toggleInSet(setTopics, option.value)}
            />
          ))}
        </div>
      </section>

      {/* ── Identities ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Anything else that applies?
          </h2>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          We use this to surface resources designed for specific groups. You can leave it blank.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {IDENTITY_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              active={identities.has(option.value)}
              onClick={() => toggleInSet(setIdentities, option.value)}
              align="start"
            />
          ))}
        </div>
      </section>

      {/* ── Financial situation ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Financial situation
          </h2>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          This helps us prioritize free, low-cost, or aid-eligible options. Private to you.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FINANCIAL_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              active={financialSituation === option.value}
              onClick={() =>
                setFinancialSituation((current) => (current === option.value ? "" : option.value))
              }
              align="start"
            />
          ))}
        </div>
      </section>

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="text-xs text-slate-500">
          {canSubmit ? (
            <span className="font-medium text-slate-700">Ready to save.</span>
          ) : (
            <>Pick a year and at least one topic to continue.</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(nextPath)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-400"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={!canSubmit || status === "saving"}
            className="rounded-lg bg-[var(--berkeley-blue)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--berkeley-blue-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Save & see my recommendations"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error} — try again, or skip and set this up later.
        </p>
      )}
    </form>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────

function ChoiceChip({
  label,
  active,
  onClick,
  align = "center",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: "center" | "start";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
        align === "start" ? "text-left" : "text-center"
      } ${
        active
          ? "border-[var(--berkeley-blue)] bg-[var(--berkeley-blue)]/10 text-[var(--berkeley-blue)] ring-1 ring-[var(--berkeley-blue)]/30"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function TopicChip({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border p-3 text-left transition ${
        active
          ? "border-[var(--berkeley-blue)] bg-[var(--berkeley-blue)]/10 ring-1 ring-[var(--berkeley-blue)]/30"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className={`text-sm font-semibold ${active ? "text-[var(--berkeley-blue)]" : "text-slate-800"}`}>
        {label}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
    </button>
  );
}
