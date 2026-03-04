import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProviderResourcesPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const provider = await prisma.provider.findFirst({
    where: { contactEmail: email },
    include: { resources: { orderBy: { updatedAt: "desc" } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Provider dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Manage resources owned by your office.
      </p>

      {!provider && (
        <p className="mt-6 rounded border border-dashed p-4 text-sm text-zinc-600">
          No provider profile is associated with {email}. Ask an admin to set your
          office contact email in the provider record.
        </p>
      )}

      {provider && (
        <>
          <h2 className="mt-6 text-lg font-semibold">{provider.name}</h2>
          <ul className="mt-4 space-y-3">
            {provider.resources.map((resource) => (
              <li key={resource.id} className="rounded border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{resource.name}</span>
                  <Link
                    href={`/admin/resources/${resource.id}`}
                    className="underline"
                  >
                    Edit
                  </Link>
                </div>
                <p className="mt-1 text-zinc-600">{resource.shortDescription}</p>
              </li>
            ))}
            {provider.resources.length === 0 && (
              <li className="rounded border border-dashed p-4 text-sm text-zinc-600">
                No resources assigned yet.
              </li>
            )}
          </ul>
        </>
      )}
    </main>
  );
}
