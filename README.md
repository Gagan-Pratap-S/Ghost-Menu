# Ghost Menu v8

Smart QR-based restaurant menu system built with Next.js 15, Supabase, and Tailwind CSS.

## What's new in v8

### Bug fixes
- **Click/view double-counting fixed** — views are now tracked via `IntersectionObserver` when cards enter the viewport (impressions), not on tap. Clicks are only counted on tap-to-open. CTR is now accurate.
- **Update rollback** — failed `updateMenuItem` calls now roll back to the previous item state instead of leaving stale optimistic data.
- **Dead code removed** — `usePersonalization.ts` (duplicate with hardcoded localStorage key) deleted.
- **Scroll lock hot-reload leak fixed** — lock count now uses `WeakMap` keyed on `document.body` instead of a module-level integer.
- **eslint suppression removed** — `handleItemClick` dep array fixed using a `useRef` for `restaurantId`.

### Security improvements
- **Real middleware** — `src/middleware.ts` validates the `ghost_admin_auth` cookie at the edge. Admin routes are no longer client-side-only protected.
- **Image domain allowlist** — `next.config.ts` catch-all `"**"` hostname removed. Only Unsplash, Supabase, Cloudinary, imgix, and S3 are trusted. `ItemForm` validates URLs against the same list.
- **QR canonical URL** — QR page now uses `NEXT_PUBLIC_APP_URL` env variable. Falls back to `window.location.origin` with a visual warning.

### Performance
- `loading="lazy"` and `placeholder="empty"` on below-fold images
- `font-display: optional` on Google Fonts import — eliminates FOUT
- `preconnect` / `dns-prefetch` hints to Unsplash and Supabase in `layout.tsx`
- `CategoryFilter` wrapped in `React.memo` — no re-renders on search input changes
- `will-change: transform` and `backface-visibility: hidden` on animated elements

### UI & feel
- **Spring animations** — modals use `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot → snap)
- **Cart badge pop** — scale animation re-triggers on every item added
- **Sticky full-width cart bar** — replaces floating pill button; shows item count + total + table
- **Prep time badges** — `~5 min`, `~15 min`, `~25 min` shown on every item card
- **Time-contextual section header** — "For You" section shows "Morning picks", "Lunch specials", etc.
- **Haptic feedback** — `navigator.vibrate(12)` on cart add, `[30,10,30]` on order success (Android)
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables all animations

### Admin improvements
- **Kitchen toggle always visible** in the sticky header across all three tabs
- **Kitchen status persisted to DB** — `kitchen_busy` column in `restaurants` table; survives page refresh
- **Live elapsed time on orders** — updates every 30s; color-coded: gray → amber (5m) → red+pulse (10m+)
- **Audio chime on new order** — Web Audio API, no external file
- **Tab title flash** — `★ New Order!` flashes until the window is focused
- **Cursor-based pagination** — orders fetched 50 at a time with "Load older orders" button; no more hard `limit=100`
- **Quick availability toggle** in the Top Performers list (one-tap "86 it")
- **Live image preview in ItemForm** — updates 500ms after URL input with error state
- **`formatPrice()` utility** — centralised `₹` formatting throughout

### Recommendation engine
- **Cart history signal** — items previously added to cart get a `+12` score boost on return visits
- **CTR-based scoring** — uses `clicks/views` ratio now that views are accurate
- **Weather-aware scoring** — extend `useRuleEngine.ts` `calculateScore` to call Open-Meteo API

## Setup

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Optionally set NEXT_PUBLIC_APP_URL to your production domain

npm install
npm run dev
```

Run `SUPABASE_SETUP.sql` in your Supabase SQL editor to create tables and RPC functions.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Recommended | Your production domain (e.g. `https://ghostmenu.vercel.app`) — used for QR code generation |

## Deploy

```bash
npx vercel
# Set env vars in Vercel dashboard → Project → Settings → Environment Variables
```
