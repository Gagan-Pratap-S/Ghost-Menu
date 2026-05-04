// Edge proxy — Ghost Menu
// Admin protection is handled entirely client-side via AuthContext.
// This proxy only passes requests through — no fake cookie checks.
// To add real JWT validation here in future, use Supabase's SSR package.

import { NextRequest, NextResponse } from "next/server";

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
