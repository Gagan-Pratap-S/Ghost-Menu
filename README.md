# Ghost Menu — Production-Ready

A live, data-driven restaurant menu decision engine built with **Next.js 16 + Tailwind CSS + Supabase**.

## Features

- ⚡ **Quick Picks** — fast, popular, high-value items shown instantly
- 🔥 **Most Ordered** — top 4 category-diverse picks
- 🧠 **Smart Rule Engine** — scoring by clicks, profit, time-of-day, kitchen mode
- 📊 **Admin Dashboard** — top performers, low conversion alerts, promote suggestions
- 🎯 **Combo System** — contextual upsell suggestions in item modal
- 📦 **Supabase backend** — real-time click/view tracking with graceful local fallback
- 💾 **LocalStorage cache** — 5-min cache to avoid redundant fetches
- 📱 **Mobile-first** — fully responsive, no desktop-only layouts

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase (optional but recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `SUPABASE_SETUP.sql` in your Supabase SQL Editor
3. Copy `.env.local.example` to `.env.local` and fill in your keys

```bash
cp .env.local.example .env.local
```

The app **works without Supabase** — it falls back to the rich local dataset automatically.

### 3. Run

```bash
npm run dev
```

## Architecture

```
src/
├── app/
│   └── page.tsx           # Root: Supabase hydration, state, click/view tracking
├── components/
│   ├── MenuPage.tsx        # Customer view: Quick Picks → Most Ordered → Full Menu
│   ├── ItemCard.tsx        # Card variants: quick | grid | list
│   ├── ItemModal.tsx       # Detail modal with combo suggestions
│   ├── CategoryFilter.tsx  # Horizontal category pills
│   └── OwnerDashboard.tsx  # Admin: stats, insights, availability toggles
├── data/
│   └── menuData.ts         # 26-item dataset + combo suggestions map
├── hooks/
│   ├── useMenuEngine.ts    # topPicks / quickPicks / fullMenu computation
│   └── useRuleEngine.ts    # Scoring + customer tags + admin quality indicators
└── lib/
    └── supabase.ts         # Supabase REST client (no npm package needed)
```

## Supabase Schema

See `SUPABASE_SETUP.sql` for the full setup including:
- `menu_items` table with all columns
- Row Level Security (public read)
- `increment_click(item_id)` RPC function
- `increment_view(item_id)` RPC function
- Full data seed INSERT

## Rule Engine Scoring

| Signal | Weight |
|---|---|
| clicks (normalised 0–30) | Primary |
| profit_tag = high | +12 |
| featured | +6 |
| category = Combos | +10 |
| time-of-day match | +10 |
| kitchen busy + fast item | +15 |
| kitchen busy + slow item | −15 |
| recently viewed (personalization) | +4 |
| new item (< 30 interactions) | +6 |
| high views + CTR < 8% (decay) | −10 |
