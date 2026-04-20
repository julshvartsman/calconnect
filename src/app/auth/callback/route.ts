import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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

const VALID_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return VALID_OTP_TYPES.has(raw as EmailOtpType) ? (raw as EmailOtpType) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseOtpType(url.searchParams.get("type"));
  const next = getSafeNext(url.searchParams.get("next"));
  const errorParam = url.searchParams.get("error") ?? url.searchParams.get("error_code");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(errorParam)}`, url.origin),
    );
  }

  if (!code && !(tokenHash && otpType)) {
    return NextResponse.redirect(new URL("/signin?error=missing_code", url.origin));
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch (error) {
    console.error("[Auth] Failed to create Supabase server client in callback", error);
    return NextResponse.redirect(new URL("/signin?error=server_misconfigured", url.origin));
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("[Auth] exchangeCodeForSession failed", exchangeError);
      return NextResponse.redirect(new URL("/signin?error=oauth_failed", url.origin));
    }
  } else if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (verifyError) {
      console.error("[Auth] verifyOtp failed", verifyError);
      return NextResponse.redirect(new URL("/signin?error=otp_failed", url.origin));
    }
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
