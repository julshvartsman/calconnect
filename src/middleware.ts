import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((request) => {
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isProviderPath = request.nextUrl.pathname.startsWith("/provider");

  if (!isAdminPath && !isProviderPath) {
    return NextResponse.next();
  }

  if (!request.auth?.user) {
    const signInUrl = new URL("/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminPath && request.auth.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  if (isProviderPath && request.auth.user.role !== "provider" && request.auth.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*"],
};
