/**
 * Environment variable validation.
 *
 * During `next build` (static analysis / page-data collection), env vars
 * like DATABASE_URL may not exist yet.  Validation is deferred to the
 * first runtime access so the build can finish cleanly on Vercel.
 */

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && !isBuildPhase) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Copy .env.example to .env and fill in the values.",
    );
  }
  return value ?? "";
}

function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL"),
  GOOGLE_CLIENT_ID: optionalEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optionalEnv("GOOGLE_CLIENT_SECRET"),
  ADMIN_EMAILS: optionalEnv("ADMIN_EMAILS"),
  PERPLEXITY_API_KEY: optionalEnv("PERPLEXITY_API_KEY"),
  GEMINI_API_KEY: optionalEnv("GEMINI_API_KEY"),
  GROQ_API_KEY: optionalEnv("GROQ_API_KEY"),
} as const;
