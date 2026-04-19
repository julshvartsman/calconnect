"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  callbackUrl: string;
};

export function GoogleSignInButton({ callbackUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            hd: "berkeley.edu",
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error starting sign-in.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="block w-full rounded-lg bg-[var(--berkeley-blue)] px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
