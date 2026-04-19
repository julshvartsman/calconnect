import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

type SignInProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

function getSafeCallbackUrl(rawCallbackUrl?: string): string {
  if (!rawCallbackUrl) return "/";
  if (!rawCallbackUrl.startsWith("/")) return "/";
  // Reject protocol-relative URLs (e.g. //evil.example).
  if (rawCallbackUrl.startsWith("//")) return "/";
  return rawCallbackUrl;
}

export default async function SignInPage({ searchParams }: SignInProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl ?? "/search");
  const error = params.error;

  if (session?.user) {
    redirect(callbackUrl);
  }

  const oauthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="hero-gradient -mt-[1px] min-h-[calc(100vh-57px)] px-4 py-12 md:px-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--berkeley-blue-700)]">CalConnect</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--berkeley-blue)]">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your Berkeley Google account to continue to Search, Browse, Map, and personalized recommendations.
        </p>

        {error === "AccessDenied" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">
              Sign-in failed. Please use your `@berkeley.edu` account.
            </p>
          </div>
        )}

        {oauthConfigured ? (
          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--berkeley-blue)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--berkeley-blue-700)]"
            >
              Continue with Google
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Google SSO is not configured yet.</p>
            <p className="mt-1 text-xs text-amber-700">
              An administrator needs to set <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_SECRET</code>.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          After sign-in, you will continue to your requested page.
        </p>
      </section>
    </main>
  );
}
