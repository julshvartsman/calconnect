import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isProviderPath = pathname.startsWith("/provider");
  const isPublicPath = pathname === "/signin" || pathname.startsWith("/api/auth");

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email) {
    const signInUrl = new URL("/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  const role = typeof token.role === "string" ? token.role : undefined;

  if (isAdminPath && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  if (isProviderPath && role !== "provider" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
