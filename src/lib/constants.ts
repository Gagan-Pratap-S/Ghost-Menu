// ─── Centralised constants ────────────────────────────────────────────────────

// Single fallback image used across all components when an image fails to load.
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format";

// localStorage keys — defined once so typos don't create orphan keys
export const LS = {
  GUEST_NAME:    "ghostMenuGuestName",
  MEMBER_COUNT:  "ghostMenuMemberCount",
  TABLE_NUMBER:  "ghostMenuTableNumber",
  RESTAURANT:    "ghostMenuRestaurant",
  VIEWED_ITEMS:  "ghostMenuViewedItems",
  CART_HISTORY:  "ghostMenuCartHistory",   // tracks last 3 added item ids for return-visit boost
} as const;

// Prep time human labels — centralised so they're consistent everywhere
export const PREP_LABEL: Record<"fast" | "medium" | "slow", string> = {
  fast:   "~5 min",
  medium: "~15 min",
  slow:   "~25 min",
};

// Price formatter — always ₹ with whole rupees
export function formatPrice(p: number): string {
  return `₹${Math.round(p).toLocaleString("en-IN")}`;
}
