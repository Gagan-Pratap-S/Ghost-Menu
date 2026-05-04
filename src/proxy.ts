// This file is intentionally a no-op passthrough kept for reference.
// Real admin route protection is now in src/middleware.ts
// which validates the ghost_admin_auth cookie at the edge.

import { NextRequest, NextResponse } from "next/server";

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}
