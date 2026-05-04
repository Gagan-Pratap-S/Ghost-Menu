-- Ghost Menu — Supabase schema
-- Run this in your Supabase SQL editor to set up tables, RLS, and RPC functions.

-- ─── RESTAURANTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kitchen_busy BOOLEAN NOT NULL DEFAULT false,   -- v8: persisted kitchen status
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_full"  ON restaurants FOR ALL  USING (auth.uid() = owner_id);
CREATE POLICY "public_read" ON restaurants FOR SELECT USING (true);

-- ─── MENU ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL CHECK (price > 0),  -- whole rupees
  category      TEXT NOT NULL,
  image         TEXT NOT NULL DEFAULT '',
  available     BOOLEAN NOT NULL DEFAULT true,
  featured      BOOLEAN NOT NULL DEFAULT false,
  prep_time     TEXT NOT NULL DEFAULT 'medium' CHECK (prep_time IN ('fast','medium','slow')),
  profit_tag    TEXT NOT NULL DEFAULT 'medium' CHECK (profit_tag IN ('high','medium','low')),
  views         INTEGER NOT NULL DEFAULT 0,   -- incremented via IntersectionObserver (impression)
  clicks        INTEGER NOT NULL DEFAULT 0,   -- incremented on tap-to-open
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_full"  ON menu_items FOR ALL    USING (auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id));
CREATE POLICY "public_read" ON menu_items FOR SELECT USING (true);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  guest_name    TEXT NOT NULL DEFAULT 'Guest',
  member_count  INTEGER NOT NULL DEFAULT 1,
  table_number  TEXT NOT NULL DEFAULT 'QR',
  items         JSONB NOT NULL DEFAULT '[]',
  total         INTEGER NOT NULL CHECK (total > 0),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','served','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_full"   ON orders FOR ALL    USING (auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id));
CREATE POLICY "public_insert" ON orders FOR INSERT WITH CHECK (restaurant_id IS NOT NULL);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ─── RPC: INCREMENT CLICK ─────────────────────────────────────────────────────
-- Called on tap-to-open (NOT on impression)
CREATE OR REPLACE FUNCTION increment_click(item_id INT, rest_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE menu_items SET clicks = clicks + 1
  WHERE id = item_id AND (rest_id IS NULL OR restaurant_id = rest_id);
END;
$$;

-- ─── RPC: INCREMENT VIEW (impression) ────────────────────────────────────────
-- Called via IntersectionObserver when item enters viewport — NOT on click
CREATE OR REPLACE FUNCTION increment_view(item_id INT, rest_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE menu_items SET views = views + 1
  WHERE id = item_id AND (rest_id IS NULL OR restaurant_id = rest_id);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_click TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_view  TO anon, authenticated;
