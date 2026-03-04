import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "student" | "provider" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "provider" | "admin";
  }
}
