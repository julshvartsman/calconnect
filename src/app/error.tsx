"use client";

/**
 * Root error boundary. In production, Next.js omits error.message — we show
 * actionable copy and the digest for Vercel log correlation.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hasMessage = Boolean(error.message?.trim());
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center md:px-6">
      <h2 className="text-2xl font-bold text-slate-900">Something went wrong</h2>
      {hasMessage ? (
        <p className="text-sm text-slate-600">{error.message}</p>
      ) : (
        <p className="text-sm text-slate-600">
          A server error occurred. This is often a database connection issue on Vercel: open{" "}
          <strong>Project → Settings → Environment Variables</strong> and ensure{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">DATABASE_URL</code> includes{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">&amp;pgbouncer=true</code> for Supabase pooler
          URLs, then redeploy.
        </p>
      )}
      {error.digest && (
        <p className="text-xs text-slate-400">
          Reference: <code className="rounded bg-slate-100 px-1">{error.digest}</code> (search this in Vercel Runtime Logs)
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[var(--berkeley-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
