import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resourceInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      provider: true,
      resourceTags: { include: { tag: true } },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  const { id } = await context.params;
  const payload = await request.json();
  const parsed = resourceInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resource payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const existingResource = await prisma.resource.findUnique({
    where: { id },
    select: { locationId: true },
  });

  if (!existingResource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  let locationId: string | null = null;
  if (data.location) {
    if (existingResource.locationId) {
      const updatedLocation = await prisma.location.update({
        where: { id: existingResource.locationId },
        data: {
          address: data.location.address,
          buildingName: data.location.buildingName,
          room: data.location.room,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          notes: data.location.notes,
        },
      });
      locationId = updatedLocation.id;
    } else {
      const createdLocation = await prisma.location.create({
        data: {
          address: data.location.address,
          buildingName: data.location.buildingName,
          room: data.location.room,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          notes: data.location.notes,
        },
      });
      locationId = createdLocation.id;
    }
  } else if (existingResource.locationId) {
    locationId = null;
    await prisma.location.delete({ where: { id: existingResource.locationId } }).catch(() => {});
  }

  const updated = await prisma.resource.update({
    where: { id },
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
      locationId,
      resourceTags: {
        deleteMany: {},
        create: data.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: {
      category: true,
      location: true,
      resourceTags: { include: { tag: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  const { id } = await context.params;

  await prisma.resource.update({
    where: { id },
    data: { isActive: false, lastVerifiedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
