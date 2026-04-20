import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { EmailSignInForm } from "@/components/email-sign-in-form";

type SignInProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

function getSafeCallbackUrl(rawCallbackUrl?: string): string {
  if (!rawCallbackUrl) return "/search";
  if (!rawCallbackUrl.startsWith("/")) return "/search";
  if (rawCallbackUrl.startsWith("//")) return "/search";
  return rawCallbackUrl;
}

const errorMessages: Record<string, string> = {
  not_berkeley: "Sign-in failed. Please use your @berkeley.edu email.",
  otp_failed: "That sign-in link is expired or invalid. Please request a new one.",
  oauth_failed: "Sign-in did not complete. Please try again.",
  server_misconfigured: "Auth is not configured. Please contact an administrator.",
  missing_code: "Sign-in was interrupted. Please try again.",
};

export default async function SignInPage({ searchParams }: SignInProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);

  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[SignIn] auth() failed", error);
  }

  if (session?.user) {
    redirect(callbackUrl);
  }

  const authReady = isSupabaseConfigured();
  const errorKey = params.error ?? "";
  const errorMessage = errorMessages[errorKey];

  return (
    <main className="hero-gradient -mt-[1px] min-h-[calc(100vh-57px)] px-4 py-12 md:px-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--berkeley-blue-700)]">CalConnect</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--berkeley-blue)]">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your Berkeley email. We&apos;ll send you a one-click sign-in link.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {authReady ? (
          <div className="mt-6">
            <EmailSignInForm callbackUrl={callbackUrl} />
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Sign-in is not configured yet.</p>
            <p className="mt-1 text-xs text-amber-700">
              An administrator needs to set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Only <strong>@berkeley.edu</strong> emails are allowed.
        </p>
      </section>
    </main>
  );
}
