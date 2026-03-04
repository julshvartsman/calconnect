export type AppRole = "student" | "provider" | "admin";

export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(emails);
}

export function inferRoleFromEmail(email?: string | null): AppRole {
  if (!email) {
    return "student";
  }

  const adminEmails = getAdminEmails();
  return adminEmails.has(email.toLowerCase()) ? "admin" : "student";
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}
