import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { inferRoleFromEmail } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers =
  googleClientId && googleClientSecret
    ? [
        Google({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      ]
    : [];

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function isBerkeleyEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  return normalized?.endsWith("@berkeley.edu") ?? false;
}

export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = normalizeEmail(user.email);
      const profileVerified = typeof profile?.email_verified === "boolean" ? profile.email_verified : false;
      if (!email || !profileVerified || !isBerkeleyEmail(email)) {
        return false;
      }

      const role = inferRoleFromEmail(email);
      await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? null,
          role,
        },
        create: {
          email,
          name: user.name ?? null,
          role,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const normalizedEmail = normalizeEmail(user?.email ?? token.email);
      token.email = normalizedEmail ?? undefined;

      if (!normalizedEmail) {
        token.role = "student";
        return token;
      }

      const persisted = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { role: true },
      });

      token.role = persisted?.role ?? inferRoleFromEmail(normalizedEmail);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "student" | "provider" | "admin";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
