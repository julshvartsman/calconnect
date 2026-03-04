import { notFound } from "next/navigation";
import Link from "next/link";
import { ResourceForm } from "@/components/resource-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditResourceProps = {
  params: Promise<{ id: string }>;
};

export default async function EditResourcePage({ params }: EditResourceProps) {
  const { id } = await params;

  const [resource, categories, tags, providers] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: {
        location: true,
        resourceTags: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Edit resource</h1>
        <Link href="/admin/resources" className="text-sm underline">
          Back to list
        </Link>
      </div>

      <ResourceForm
        mode="edit"
        resourceId={resource.id}
        categories={categories}
        tags={tags}
        providers={providers}
        defaults={{
          name: resource.name,
          shortDescription: resource.shortDescription,
          fullDescription: resource.fullDescription,
          eligibilityText: resource.eligibilityText,
          isAppointmentRequired: resource.isAppointmentRequired,
          walkInAllowed: resource.walkInAllowed,
          whatToBring: resource.whatToBring,
          requirementsLink: resource.requirementsLink,
          websiteUrl: resource.websiteUrl,
          officialUrl: resource.officialUrl,
          hoursJson: JSON.stringify(resource.hoursJson ?? {}, null, 2),
          categoryId: resource.categoryId,
          providerId: resource.providerId,
          tagIds: resource.resourceTags.map((entry) => entry.tagId),
          location: resource.location,
          isActive: resource.isActive,
        }}
      />
    </main>
  );
}
