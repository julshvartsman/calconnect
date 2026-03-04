/**
 * Browse page — server component that fetches resources from the database
 * and passes them to the client-side directory view and urgent banner.
 */

import { getBrowseData } from "@/lib/resource-queries";
import { UrgentBanner } from "@/components/urgent-banner";
import { ResourceDirectoryView } from "@/components/resource-directory-view";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const categories = await getBrowseData();
  const allResources = categories.flatMap((c) => c.resources);

  return (
    <>
      <UrgentBanner resources={allResources} />
      <ResourceDirectoryView categories={categories} />
    </>
  );
}
