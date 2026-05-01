import { NextRequest, NextResponse } from "next/server";

// Protect /admin (but not /admin/login) at the edge.
// We check for the session token in localStorage-backed cookie alternative.
// Since localStorage is client-only, we use a simple pattern:
// After login, set a lightweight httpOnly cookie "ghost_admin_auth=1"
// so middleware can gate the route without exposing the JWT.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin, allow /admin/login through
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminAuth = req.cookies.get("ghost_admin_auth");
    if (!adminAuth?.value) {
      const loginUrl = new URL("/admin/login", req.url);
      // Preserve the intended destination so we can redirect back after login
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
