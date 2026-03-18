import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSeedIfNeeded } from "@/lib/seed-resources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const existing = await prisma.resource.count();
  if (existing > 0) {
    return NextResponse.json({ status: "already_seeded", resourceCount: existing });
  }

  const seeded = await runSeedIfNeeded();
  const count = await prisma.resource.count();

  return NextResponse.json({
    status: seeded ? "seeded" : "already_seeded",
    resourceCount: count,
  });
}
