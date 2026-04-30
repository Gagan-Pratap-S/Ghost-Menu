import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next(); // ✅ allow everything
}

export const config = {
  matcher: ["/admin/:path*"],
};