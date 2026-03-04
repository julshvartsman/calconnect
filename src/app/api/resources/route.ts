import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resourceInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 30);

  const where: Prisma.ResourceWhereInput = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { shortDescription: { contains: search, mode: "insensitive" } },
            { eligibilityText: { contains: search, mode: "insensitive" } },
            { summaryJson: { path: ["rawExcerpt"], string_contains: search } },
            {
              resourceTags: {
                some: {
                  tag: { name: { contains: search, mode: "insensitive" } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const resources = await prisma.resource.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: Number.isNaN(limit) ? 30 : Math.min(limit, 100),
    include: {
      category: true,
      location: true,
      resourceTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  const payload = await request.json();
  const parsed = resourceInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resource payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const createdLocation = data.location
    ? await prisma.location.create({
        data: {
          address: data.location.address,
          buildingName: data.location.buildingName,
          room: data.location.room,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          notes: data.location.notes,
        },
      })
    : null;

  const resource = await prisma.resource.create({
    data: {
      name: data.name,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      eligibilityText: data.eligibilityText,
      isAppointmentRequired: data.isAppointmentRequired,
      walkInAllowed: data.walkInAllowed,
      whatToBring: data.whatToBring,
      requirementsLink: data.requirementsLink,
      websiteUrl: data.websiteUrl,
      officialUrl: data.officialUrl,
      hoursJson: (data.hoursJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      isActive: data.isActive,
      lastVerifiedAt: new Date(),
      categoryId: data.categoryId,
      providerId: data.providerId,
      locationId: createdLocation?.id ?? null,
      resourceTags: data.tagIds.length
        ? {
            create: data.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      location: true,
      resourceTags: { include: { tag: true } },
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
