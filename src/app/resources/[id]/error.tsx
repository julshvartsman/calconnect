"use client";

/**
 * Error boundary for the resource detail page.
 */
export default function ResourceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center md:px-6">
      <h2 className="text-2xl font-bold text-slate-900">Could not load resource</h2>
      <p className="text-sm text-slate-600">
        {error.message || "An unexpected error occurred while loading this resource."}
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
