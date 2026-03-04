/**
 * Loading skeleton for the search page.
 * Shown by Next.js while the async server component renders.
 */
export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 md:px-6">
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-md bg-slate-100" />
        <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-slate-100" />
          <div className="h-4 w-4/6 animate-pulse rounded-md bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
