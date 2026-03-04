import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  const resources = await prisma.resource.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Admin · Resources</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/entities"
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Manage entities
          </Link>
          <Link
            href="/admin/resources/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            New resource
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td className="px-4 py-3">{resource.name}</td>
                <td className="px-4 py-3">{resource.category.name}</td>
                <td className="px-4 py-3">
                  {format(resource.updatedAt, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/resources/${resource.id}`}
                    className="text-zinc-900 underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-zinc-500" colSpan={4}>
                  No resources yet. Create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
