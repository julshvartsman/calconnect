import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbError } from "@/lib/db-errors";
import { CampusMap } from "@/components/campus-map";

export const dynamic = "force-dynamic";

const mapResourceInclude = {
  category: true,
  location: true,
} satisfies Prisma.ResourceInclude;

type ResourceWithMap = Prisma.ResourceGetPayload<{ include: typeof mapResourceInclude }>;

type MapPageProps = {
  searchParams: Promise<{ resource?: string }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;

  let resources: ResourceWithMap[] = [];
  let dbUnavailable = false;
  try {
    resources = await prisma.resource.findMany({
      where: {
        isActive: true,
        location: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: mapResourceInclude,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  } catch (err) {
    if (isDbError(err)) {
      console.warn("[map] Database error:", err instanceof Error ? err.message : err);
      dbUnavailable = true;
    } else {
      throw err;
    }
  }

  const mapResources = resources
    .filter((r) => r.location?.latitude != null && r.location?.longitude != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category.slug,
      lat: r.location!.latitude!,
      lng: r.location!.longitude!,
      address: r.location?.address ?? undefined,
      building: r.location?.buildingName ?? undefined,
    }));

  const selected = params.resource ?? undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6">
      {dbUnavailable && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Map data is temporarily unavailable. Ensure <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> on Vercel includes{" "}
          <code className="rounded bg-amber-100 px-1">&amp;pgbouncer=true</code> for Supabase.
        </div>
      )}
      <section className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Campus Map</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pinpoints show resource locations on campus. Click a pin or select from the list.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface overflow-hidden rounded-2xl p-2">
          <CampusMap resources={mapResources} selectedId={selected} />
        </div>

        <aside className="card-surface max-h-[500px] space-y-2 overflow-y-auto rounded-2xl p-4">
          {resources.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">
                No mappable resources yet.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Add latitude & longitude to resources in the admin panel.
              </p>
            </div>
          ) : (
            resources.map((resource) => {
              const isActive = selected === resource.id;
              return (
                <Link
                  key={resource.id}
                  href={`/map?resource=${resource.id}`}
                  className={`block rounded-xl border p-3 transition ${
                    isActive
                      ? "border-[var(--berkeley-blue)] bg-blue-50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{resource.name}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--berkeley-blue)]">
                    {resource.category.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[resource.location?.buildingName, resource.location?.room, resource.location?.address]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              );
            })
          )}
        </aside>
      </section>
    </main>
  );
}
