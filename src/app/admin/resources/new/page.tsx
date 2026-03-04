import Link from "next/link";
import { ResourceForm } from "@/components/resource-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const [categories, tags, providers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Create resource</h1>
        <Link href="/admin/resources" className="text-sm underline">
          Back to list
        </Link>
      </div>
      <ResourceForm
        mode="create"
        categories={categories}
        tags={tags}
        providers={providers}
      />
    </main>
  );
}
