import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";

export async function requireAdminOrThrow(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return null;
}
