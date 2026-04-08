import Link from "next/link";

export type MapSidebarResource = {
  id: string;
  name: string;
  category: { name: string; slug: string };
  location: {
    buildingName: string | null;
    room: string | null;
    address: string | null;
  } | null;
};

function groupByCategory(resources: MapSidebarResource[]) {
  const map = new Map<
    string,
    { categoryName: string; categorySlug: string; items: MapSidebarResource[] }
  >();

  for (const r of resources) {
    const slug = r.category.slug;
    let bucket = map.get(slug);
    if (!bucket) {
      bucket = { categoryName: r.category.name, categorySlug: slug, items: [] };
      map.set(slug, bucket);
    }
    bucket.items.push(r);
  }

  for (const bucket of map.values()) {
    bucket.items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }

  return Array.from(map.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" }),
  );
}

function locationLine(resource: MapSidebarResource): string {
  return [resource.location?.buildingName, resource.location?.room, resource.location?.address]
    .filter(Boolean)
    .join(" · ");
}

type MapResourceSidebarProps = {
  resources: MapSidebarResource[];
  selectedId?: string;
};

export function MapResourceSidebar({ resources, selectedId }: MapResourceSidebarProps) {
  const grouped = groupByCategory(resources);

  if (resources.length === 0) {
    return (
      <aside className="card-surface flex max-h-[min(72vh,640px)] flex-col overflow-hidden rounded-2xl">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <h2 className="font-serif text-base font-semibold text-slate-900">Places on the map</h2>
          <p className="mt-0.5 text-xs text-slate-500">Resources with a campus location</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <p className="text-sm text-slate-500">No mappable resources yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Add latitude and longitude to resources in the admin panel.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="card-surface flex max-h-[min(72vh,640px)] min-h-[min(52vh,480px)] flex-col overflow-hidden rounded-2xl">
      <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50/30 px-4 py-3">
        <h2 className="font-serif text-base font-semibold text-slate-900">Places on the map</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {resources.length} location{resources.length !== 1 ? "s" : ""} in {grouped.length}{" "}
          {grouped.length !== 1 ? "categories" : "category"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.categorySlug} aria-labelledby={`cat-${group.categorySlug}`}>
              <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
                <h3 id={`cat-${group.categorySlug}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.categoryName}
                </h3>
                <span className="text-[11px] tabular-nums text-slate-400">{group.items.length}</span>
              </div>
              <ul className="space-y-1.5">
                {group.items.map((resource) => {
                  const isActive = selectedId === resource.id;
                  const loc = locationLine(resource);
                  return (
                    <li key={resource.id}>
                      <Link
                        href={`/map?resource=${resource.id}`}
                        scroll={false}
                        className={`block rounded-lg border px-3 py-2.5 transition ${
                          isActive
                            ? "border-[var(--berkeley-blue)] bg-blue-50/90 shadow-sm ring-1 ring-[var(--berkeley-blue)]/15"
                            : "border-transparent hover:border-slate-200 hover:bg-slate-50/90"
                        }`}
                      >
                        <p className="text-sm font-medium leading-snug text-slate-900">{resource.name}</p>
                        {loc ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{loc}</p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
