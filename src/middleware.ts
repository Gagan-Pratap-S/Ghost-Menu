// Ghost Menu — Edge Middleware
// Validates the ghost_admin_auth cookie on all /admin routes except /admin/login.
// If missing, redirects to /admin/login.
// For full JWT validation, swap this for @supabase/ssr once your Supabase project is live.

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Don't guard the login page itself — would cause a redirect loop
  if (req.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("ghost_admin_auth");
  const isAuthed = cookie?.value === "1";

  if (!isAuthed) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
