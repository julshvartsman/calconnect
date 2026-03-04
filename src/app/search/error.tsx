"use client";

/**
 * Error boundary for the search page.
 * Catches runtime errors and offers a retry action.
 */
export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center md:px-6">
      <h2 className="text-2xl font-bold text-slate-900">Something went wrong</h2>
      <p className="text-sm text-slate-600">
        {error.message || "An unexpected error occurred while loading search results."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--berkeley-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--berkeley-blue-700)]"
      >
        Try again
      </button>
    </main>
  );
}
