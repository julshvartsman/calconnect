"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  callbackUrl: string;
};

function isBerkeleyEmail(email: string): boolean {
  return /^[^\s@]+@berkeley\.edu$/i.test(email.trim());
}

/**
 * Translate Supabase auth error strings into something users can act on.
 * Supabase's built-in SMTP caps at ~4 emails/hr — a real user will hit
 * this in a beta and needs to know what to do.
 */
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many")) {
    return "Too many sign-in emails in a short window. Please wait a few minutes and try again. If this keeps happening, ask an admin to enable custom SMTP in Supabase.";
  }
  if (lower.includes("invalid email") || lower.includes("not allowed")) {
    return "That email address was rejected. Make sure you're using your @berkeley.edu address.";
  }
  return message;
}

export function EmailSignInForm({ callbackUrl }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!isBerkeleyEmail(trimmed)) {
      setError("Please use your @berkeley.edu email.");
      return;
    }

    setStatus("sending");
    try {
      const supabase = getSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError(friendlyAuthError(otpError.message));
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error sending link.";
      setError(message);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="text-sm font-semibold text-emerald-900">Check your Berkeley email</h2>
        <p className="mt-1 text-xs text-emerald-800">
          We sent a sign-in link to <strong>{email}</strong>. Click the link in the email to finish
          signing in. The link expires in about an hour.
        </p>
        <p className="mt-2 text-xs text-emerald-800">
          Don&apos;t see it? Check your spam folder, then{" "}
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
            }}
            className="font-medium underline"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Berkeley email
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@berkeley.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sending"}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-[var(--berkeley-blue)] focus:ring-1 focus:ring-[var(--berkeley-blue)] disabled:opacity-60"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="block w-full rounded-lg bg-[var(--berkeley-blue)] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending link…" : "Send sign-in link"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        We&apos;ll email you a secure sign-in link. No password needed.
      </p>
    </form>
  );
}
