import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isProviderPath = request.nextUrl.pathname.startsWith("/provider");

  if (!isAdminPath && !isProviderPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email) {
    const signInUrl = new URL("/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
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
  matcher: ["/admin/:path*", "/provider/:path*"],
};
