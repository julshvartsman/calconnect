import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRecommendationsForEmail } from "@/lib/recommendations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recommendations = await getRecommendationsForEmail(session.user.email);
  return NextResponse.json(recommendations);
}
