// ─── Ghost Menu — Centralised Constants ──────────────────────────────────────

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format";

// localStorage keys
export const LS = {
  GUEST_NAME:    "ghostMenuGuestName",
  MEMBER_COUNT:  "ghostMenuMemberCount",
  TABLE_NUMBER:  "ghostMenuTableNumber",
  RESTAURANT:    "ghostMenuRestaurant",
  VIEWED_ITEMS:  "ghostMenuViewedItems",
  CART_HISTORY:  "ghostMenuCartHistory",
} as const;

// Prep time labels
export const PREP_LABEL: Record<"fast" | "medium" | "slow", string> = {
  fast:   "~5 min",
  medium: "~15 min",
  slow:   "~25 min",
};

// Trusted image domains (for validation)
export const TRUSTED_IMAGE_DOMAINS = [
  "images.unsplash.com",
  "supabase.co",
  "supabase.in",
  "cloudinary.com",
  "imgix.net",
  "amazonaws.com",
  "res.cloudinary.com",
];

export function isTrustedImageUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return TRUSTED_IMAGE_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch { return false; }
}

// Centralised price formatter
export function formatPrice(p: number): string {
  return `₹${Math.round(p).toLocaleString("en-IN")}`;
}
