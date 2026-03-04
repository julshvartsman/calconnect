import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileInputSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name,
      role: session.user.role ?? "student",
    },
    create: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role ?? "student",
    },
    include: {
      profile: true,
    },
  });

  return NextResponse.json(user.profile);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = profileInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name,
      role: session.user.role ?? "student",
    },
    create: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role ?? "student",
    },
  });

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { profileJson: parsed.data },
    create: {
      userId: user.id,
      profileJson: parsed.data,
    },
  });

  return NextResponse.json(profile);
}
