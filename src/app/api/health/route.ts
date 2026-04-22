import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Self-diagnostic endpoint. Auth'd users can hit this to quickly see what
 * the server thinks of itself — useful when "the app isn't doing X" and we
 * need to know if it's a config issue, a DB migration issue, or a user-level
 * issue without trawling Vercel logs.
 *
 * Intentionally non-sensitive: only booleans and counts are returned, never
 * secrets or raw rows.
 */
export async function GET() {
  const session = await auth().catch((err) => {
    console.error("[Health] auth() failed", err);
    return null;
  });

  const userEmail = session?.user?.email ?? null;

  // Provider availability (booleans only — never surface keys).
  const llm = {
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
  };

  // DB shape: the userEmail column is what powers profile history. A missing
  // column here means the migration hasn't applied on this environment.
  let searchEventSchema: {
    hasUserEmailColumn: boolean;
    eventCountLast7d: number | null;
    userEventCountLast7d: number | null;
  } = { hasUserEmailColumn: false, eventCountLast7d: null, userEventCountLast7d: null };

  try {
    const columnRows = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'SearchEvent' AND column_name = 'userEmail'`,
    );
    searchEventSchema.hasUserEmailColumn = columnRows.length > 0;
  } catch (err) {
    console.error("[Health] Could not introspect SearchEvent schema", err);
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    searchEventSchema.eventCountLast7d = await prisma.searchEvent.count({
      where: { createdAt: { gte: since } },
    });
    if (userEmail && searchEventSchema.hasUserEmailColumn) {
      searchEventSchema.userEventCountLast7d = await prisma.searchEvent.count({
        where: { createdAt: { gte: since }, userEmail },
      });
    }
  } catch (err) {
    console.error("[Health] Could not count SearchEvent rows", err);
  }

  return NextResponse.json({
    ok: true,
    user: userEmail,
    llm,
    searchEvent: searchEventSchema,
  });
}
