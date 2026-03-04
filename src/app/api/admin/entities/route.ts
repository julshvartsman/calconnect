import { ProviderOrgType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrThrow } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  entityType: z.enum(["category", "tag", "provider"]),
  name: z.string().min(2),
  slug: z.string().optional(),
  type: z.string().optional(),
  contactEmail: z.string().email().optional(),
  campusOrgType: z
    .enum(["office", "student_org", "external_partner"])
    .optional(),
});

export async function POST(request: NextRequest) {
  const forbiddenResponse = await requireAdminOrThrow();
  if (forbiddenResponse) return forbiddenResponse;

  const payload = await request.json();
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entity payload." }, { status: 400 });
  }

  const data = parsed.data;

  if (data.entityType === "category") {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug:
          data.slug ??
          data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      },
    });
    return NextResponse.json(category, { status: 201 });
  }

  if (data.entityType === "tag") {
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        type: data.type ?? "topic",
      },
    });
    return NextResponse.json(tag, { status: 201 });
  }

  const provider = await prisma.provider.create({
    data: {
      name: data.name,
      contactEmail: data.contactEmail,
      campusOrgType: (data.campusOrgType ?? "office") as ProviderOrgType,
    },
  });
  return NextResponse.json(provider, { status: 201 });
}
