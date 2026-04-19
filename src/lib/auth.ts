import { prisma } from "@/lib/prisma";
import { inferRoleFromEmail, type AppRole } from "@/lib/roles";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AppSession = {
  user: {
    email: string;
    name?: string | null;
    role: AppRole;
  };
} | null;

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

export function isBerkeleyEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  return normalized?.endsWith("@berkeley.edu") ?? false;
}

export async function auth(): Promise<AppSession> {
  if (!isSupabaseConfigured()) return null;

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch (error) {
    console.error("[Auth] Failed to create Supabase server client", error);
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const email = normalizeEmail(data.user.email);
  if (!email || !isBerkeleyEmail(email)) return null;

  let role: AppRole = inferRoleFromEmail(email);
  try {
    const persisted = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (persisted?.role) {
      role = persisted.role as AppRole;
    }
  } catch (lookupError) {
    console.error("[Auth] Role lookup failed", lookupError);
  }

  const fullName =
    (data.user.user_metadata?.full_name as string | undefined) ??
    (data.user.user_metadata?.name as string | undefined) ??
    null;

  return {
    user: {
      email,
      name: fullName,
      role,
    },
  };
}
