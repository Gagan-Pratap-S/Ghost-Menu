-- ============================================================
-- Ghost Menu — Complete Supabase Setup
-- Run ONCE in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Execute in order — all sections in a single run is fine.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 2. RESTAURANTS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Public read (needed for /menu/[slug] customer view)
CREATE POLICY "Public read restaurants"
  ON restaurants FOR SELECT USING (true);

-- Only owner can modify their restaurant
CREATE POLICY "Owner update restaurant"
  ON restaurants FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner delete restaurant"
  ON restaurants FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Auth insert restaurant"
  ON restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────
-- 3. MENU ITEMS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  price         INTEGER NOT NULL,
  category      TEXT NOT NULL,
  image         TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  available     BOOLEAN NOT NULL DEFAULT true,
  featured      BOOLEAN NOT NULL DEFAULT false,
  prep_time     TEXT NOT NULL DEFAULT 'medium'
                  CHECK (prep_time IN ('fast','medium','slow')),
  profit_tag    TEXT NOT NULL DEFAULT 'medium'
                  CHECK (profit_tag IN ('low','medium','high')),
  clicks        INTEGER NOT NULL DEFAULT 0,
  views         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public read (customers see the menu)
CREATE POLICY "Public read menu_items"
  ON menu_items FOR SELECT USING (true);

-- Helper function — avoids N+1 subquery per RLS evaluation
CREATE OR REPLACE FUNCTION get_restaurant_owner(rest_id UUID)
RETURNS UUID AS $$
  SELECT owner_id FROM restaurants WHERE id = rest_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Only owner can write to their menu items
CREATE POLICY "Owner insert menu_items"
  ON menu_items FOR INSERT WITH CHECK (
    auth.uid() = get_restaurant_owner(restaurant_id)
  );

CREATE POLICY "Owner update menu_items"
  ON menu_items FOR UPDATE USING (
    auth.uid() = get_restaurant_owner(restaurant_id)
  );

CREATE POLICY "Owner delete menu_items"
  ON menu_items FOR DELETE USING (
    auth.uid() = get_restaurant_owner(restaurant_id)
  );

-- ─────────────────────────────────────────────────────────────
-- 4. ORDERS TABLE
-- Status pipeline: pending → preparing → ready → served
-- cancelled is terminal, reachable from pending or preparing
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  guest_name    TEXT NOT NULL DEFAULT 'Guest',
  member_count  INTEGER NOT NULL DEFAULT 1,
  table_number  TEXT NOT NULL DEFAULT 'QR',
  items         JSONB NOT NULL DEFAULT '[]',
  total         INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','preparing','ready','served','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers (anon) can INSERT orders
CREATE POLICY "Anon insert orders"
  ON orders FOR INSERT WITH CHECK (true);

-- Only restaurant owner can read orders
CREATE POLICY "Owner read orders"
  ON orders FOR SELECT USING (
    auth.uid() = get_restaurant_owner(restaurant_id)
  );

-- Only restaurant owner can update order status
CREATE POLICY "Owner update orders"
  ON orders FOR UPDATE USING (
    auth.uid() = get_restaurant_owner(restaurant_id)
  );

-- ─────────────────────────────────────────────────────────────
-- 5. ENABLE REALTIME on orders table
-- Allows supabase.channel().on('postgres_changes') to fire
-- ─────────────────────────────────────────────────────────────
-- Run this in the SQL editor. If already enabled, this is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. TRACKING RPC FUNCTIONS (anon-callable, restaurant-scoped)
-- restaurant_id guard prevents cross-tenant count manipulation
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS increment_click(INT);
DROP FUNCTION IF EXISTS increment_view(INT);
DROP FUNCTION IF EXISTS increment_click(INT, UUID);
DROP FUNCTION IF EXISTS increment_view(INT, UUID);

CREATE OR REPLACE FUNCTION increment_click(item_id INT, rest_id UUID)
RETURNS VOID AS $$
  UPDATE menu_items
  SET clicks = clicks + 1
  WHERE id = item_id AND restaurant_id = rest_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_view(item_id INT, rest_id UUID)
RETURNS VOID AS $$
  UPDATE menu_items
  SET views = views + 1
  WHERE id = item_id AND restaurant_id = rest_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_click(INT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_view(INT, UUID)  TO anon;

-- ─────────────────────────────────────────────────────────────
-- 7. SEED DATA — Demo restaurant + menu
-- Replace '<YOUR_USER_ID>' with your Supabase auth.users UUID
-- Find it: Supabase Dashboard → Authentication → Users
-- ─────────────────────────────────────────────────────────────
INSERT INTO restaurants (id, name, slug, owner_id) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Cafe Delight',
  'cafe-delight',
  '<YOUR_USER_ID>'  -- ← Replace this
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO menu_items
  (restaurant_id, name, price, category, image, description, available, featured, prep_time, profit_tag, clicks, views)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AS restaurant_id,
  v.name, v.price, v.category, v.image, v.description,
  v.available, v.featured, v.prep_time, v.profit_tag, v.clicks, v.views
FROM (VALUES
  ('Paneer Tikka',299,'Starters','https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop','Marinated paneer grilled in tandoor. Smoky, juicy, with mint chutney.',true,true,'medium','high',42,145),
  ('Samosa (2 pcs)',59,'Starters','https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop','Crispy pastry stuffed with spiced potato and peas.',true,false,'fast','medium',34,267),
  ('Butter Chicken',349,'Mains','https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop','Tender chicken in a rich creamy tomato-butter gravy.',true,true,'medium','high',98,289),
  ('Paneer Butter Masala',299,'Mains','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop','Soft paneer in a velvety tomato-cream gravy.',true,true,'medium','high',76,211),
  ('Dal Makhani',249,'Mains','https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop','Slow-cooked black lentils in a creamy buttery gravy.',true,false,'slow','high',67,234),
  ('Chicken Biryani',329,'Mains','https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop','Fragrant basmati rice layered with spiced chicken.',true,false,'slow','high',89,367),
  ('Veg Thali Special',399,'Combos','https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop','Dal makhani + Paneer + Rice + 2 Roti + Salad + Dessert.',true,true,'medium','high',72,198),
  ('Chicken Thali',449,'Combos','https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop','Butter chicken + Rice + 2 Roti + Salad + Raita + Sweet.',true,true,'medium','high',124,312),
  ('Masala Dosa',199,'Breakfast','https://images.unsplash.com/photo-1668236543090-82eba5eea6ca?w=400&h=300&fit=crop','Crispy rice crepe with sambar and coconut chutney.',true,true,'fast','medium',156,412),
  ('Butter Naan',49,'Breads','https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop','Fluffy tandoor-baked bread glazed with butter.',true,false,'fast','high',167,423),
  ('Garlic Naan',59,'Breads','https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop','Naan topped with roasted garlic and coriander.',true,false,'fast','high',154,387),
  ('Gulab Jamun (2 pcs)',99,'Desserts','https://images.unsplash.com/photo-1627303795478-d0e2e5a4a1e8?w=400&h=300&fit=crop','Soft milk-solid balls in rose-scented sugar syrup.',true,false,'fast','low',12,178),
  ('Mango Lassi',79,'Beverages','https://images.unsplash.com/photo-1590080876614-bc8104e62908?w=400&h=300&fit=crop','Thick yogurt drink blended with Alphonso mango pulp.',true,false,'fast','medium',45,189),
  ('Masala Chai',39,'Beverages','https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=400&h=300&fit=crop','Spiced tea with ginger, cardamom and cinnamon.',true,false,'fast','medium',189,467)
) AS v(name,price,category,image,description,available,featured,prep_time,profit_tag,clicks,views);

-- ──────────────────────────────────────────────────────────────
-- 9. SCHEMA UPGRADES (safe to run on existing DB)
-- ──────────────────────────────────────────────────────────────

-- Add new columns to restaurants (if not already present)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS kitchen_busy  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS theme_color   TEXT    NOT NULL DEFAULT '#f97316';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url      TEXT;

-- Add tags column to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update orders status check to include 'ready' and 'served'
-- (Re-create constraint if needed)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','preparing','ready','served','cancelled'));

-- ──────────────────────────────────────────────────────────────
-- 10. ENABLE REALTIME on orders (idempotent)
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END
$$;

-- ──────────────────────────────────────────────────────────────
-- 11. FINAL: Verify table row counts (sanity check)
-- ──────────────────────────────────────────────────────────────
SELECT 'restaurants' AS tbl, count(*) FROM restaurants
UNION ALL SELECT 'menu_items', count(*) FROM menu_items
UNION ALL SELECT 'orders', count(*) FROM orders;
