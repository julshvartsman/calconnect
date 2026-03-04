/**
 * Loading skeleton for the campus map page.
 * Shown while resource locations are fetched from the database.
 */
export default function MapLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6">
      <section className="mb-6">
        <div className="h-8 w-52 animate-pulse rounded-md bg-slate-100" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-slate-100" />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-[460px] animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-[460px] animate-pulse rounded-2xl bg-slate-100" />
      </section>
    </main>
  );
}
