import { prisma } from "@/lib/prisma";
import { tokenizeProfile } from "@/lib/resource-helpers";

function scoreResource(resource: {
  category: { name: string };
  resourceTags: { tag: { name: string } }[];
  shortDescription: string;
}, profileTokens: string[]): number {
  const haystack = [
    resource.category.name,
    resource.shortDescription,
    ...resource.resourceTags.map((entry) => entry.tag.name),
  ]
    .join(" ")
    .toLowerCase();

  return profileTokens.reduce((score, token) => {
    return haystack.includes(token) ? score + 1 : score;
  }, 0);
}

export async function getRecommendationsForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user?.profile?.profileJson) {
    return [];
  }

  const profileTokens = tokenizeProfile(user.profile.profileJson);
  if (!profileTokens.length) {
    return [];
  }

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    include: {
      category: true,
      location: true,
      resourceTags: {
        include: { tag: true },
      },
    },
    take: 100,
  });

  return resources
    .map((resource) => ({
      resource,
      score: scoreResource(resource, profileTokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.resource);
}
