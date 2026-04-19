import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inferRoleFromEmail } from "@/lib/roles";
import { isBerkeleyEmail } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getSafeNext(rawNext?: string | null): string {
  if (!rawNext) return "/search";
  if (!rawNext.startsWith("/")) return "/search";
  if (rawNext.startsWith("//")) return "/search";
  return rawNext;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNext(url.searchParams.get("next"));
  const errorParam = url.searchParams.get("error");

  if (errorParam || !code) {
    const reason = errorParam ?? "missing_code";
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(reason)}`, url.origin));
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch (error) {
    console.error("[Auth] Failed to create Supabase server client in callback", error);
    return NextResponse.redirect(new URL("/signin?error=server_misconfigured", url.origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("[Auth] exchangeCodeForSession failed", exchangeError);
    return NextResponse.redirect(new URL("/signin?error=oauth_failed", url.origin));
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.trim().toLowerCase() ?? null;

  if (!email || !isBerkeleyEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/signin?error=not_berkeley", url.origin));
  }

  const fullName =
    (data.user?.user_metadata?.full_name as string | undefined) ??
    (data.user?.user_metadata?.name as string | undefined) ??
    null;

  try {
    const role = inferRoleFromEmail(email);
    await prisma.user.upsert({
      where: { email },
      update: { name: fullName, role },
      create: { email, name: fullName, role },
    });
  } catch (upsertError) {
    console.error("[Auth] User upsert failed in callback", upsertError);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
