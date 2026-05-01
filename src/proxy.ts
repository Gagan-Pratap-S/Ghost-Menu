// Next.js 16 renamed "middleware" to "proxy" for edge middleware.
// This file replaces src/middleware.ts.
// Protects /admin/* routes using a lightweight cookie check.

import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow /admin/login through always
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Check for the lightweight auth cookie set on login
  const adminAuth = req.cookies.get("ghost_admin_auth");
  if (!adminAuth?.value) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
