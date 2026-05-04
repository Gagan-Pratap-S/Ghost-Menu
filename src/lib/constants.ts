// ─── Centralised constants ────────────────────────────────────────────────────

// Single fallback image used across all components when an image fails to load.
// Points to a reliable Unsplash food photo — replace with your own CDN asset.
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format";

// localStorage keys — defined once so typos don't create orphan keys
export const LS = {
  GUEST_NAME:    "ghostMenuGuestName",
  MEMBER_COUNT:  "ghostMenuMemberCount",
  TABLE_NUMBER:  "ghostMenuTableNumber",
  RESTAURANT:    "ghostMenuRestaurant",
  VIEWED_ITEMS:  "ghostMenuViewedItems",
} as const;
