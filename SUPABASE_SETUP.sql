-- ============================================================
-- Ghost Menu — Full Supabase Setup (Run once in SQL Editor)
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 2. RESTAURANTS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for /menu/[slug] to work without auth)
CREATE POLICY "Public read restaurants"
  ON restaurants FOR SELECT USING (true);

-- Only owner can update/delete their restaurant
CREATE POLICY "Owner update restaurant"
  ON restaurants FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner delete restaurant"
  ON restaurants FOR DELETE USING (auth.uid() = owner_id);

-- Allow authenticated users to insert (they become the owner)
CREATE POLICY "Auth insert restaurant"
  ON restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ──────────────────────────────────────────────────────────────
-- 3. MENU ITEMS TABLE
-- ──────────────────────────────────────────────────────────────
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
  prep_time     TEXT NOT NULL DEFAULT 'medium' CHECK (prep_time IN ('fast','medium','slow')),
  profit_tag    TEXT NOT NULL DEFAULT 'medium' CHECK (profit_tag IN ('low','medium','high')),
  clicks        INTEGER NOT NULL DEFAULT 0,
  views         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read all menu items (for /menu/[slug] customer view)
CREATE POLICY "Public read menu_items"
  ON menu_items FOR SELECT USING (true);

-- Only the restaurant owner can insert/update/delete
CREATE POLICY "Owner insert menu_items"
  ON menu_items FOR INSERT WITH CHECK (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

CREATE POLICY "Owner update menu_items"
  ON menu_items FOR UPDATE USING (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

CREATE POLICY "Owner delete menu_items"
  ON menu_items FOR DELETE USING (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

-- ──────────────────────────────────────────────────────────────
-- 4. TRACKING RPC FUNCTIONS (anon-callable)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_click(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET clicks = clicks + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_view(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET views = views + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_click(INT) TO anon;
GRANT EXECUTE ON FUNCTION increment_view(INT)  TO anon;

-- ──────────────────────────────────────────────────────────────
-- 5. SEED: Create a demo restaurant + menu data
--    Replace '<YOUR_USER_ID>' with your Supabase auth user UUID
-- ──────────────────────────────────────────────────────────────

-- Step A: Insert the restaurant
INSERT INTO restaurants (id, name, slug, owner_id) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Cafe Delight',
  'cafe-delight',
  'b75c4a97-c540-49c2-9118-c923b2b1c08b'   -- ← Replace this with your auth.users UUID
) ON CONFLICT (slug) DO NOTHING;

-- Step B: Insert menu items (uses the restaurant id above)
INSERT INTO menu_items (restaurant_id, name, price, category, image, description, available, featured, prep_time, profit_tag, clicks, views)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  v.name, v.price, v.category, v.image, v.description, v.available, v.featured, v.prep_time, v.profit_tag, v.clicks, v.views
FROM (VALUES
  ('Paneer Tikka',299,'Starters','https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop','Marinated paneer cubes grilled in tandoor. Smoky, juicy, served with mint chutney.',true,true,'medium','high',42,145),
  ('Samosa (2 pcs)',59,'Starters','https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop','Crispy golden pastry stuffed with spiced potato and peas. Classic street food.',true,false,'fast','medium',34,267),
  ('Butter Chicken',349,'Mains','https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop','Tender chicken in a rich creamy tomato-butter gravy. All-time favourite.',true,true,'medium','high',98,289),
  ('Paneer Butter Masala',299,'Mains','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop','Soft paneer in a velvety tomato-cream gravy. Best paired with naan.',true,true,'medium','high',76,211),
  ('Dal Makhani',249,'Mains','https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop','Slow-cooked black lentils in a creamy buttery gravy. Comfort in a bowl.',true,false,'slow','high',67,234),
  ('Chicken Biryani',329,'Mains','https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop','Fragrant basmati rice layered with spiced chicken. Served with raita.',true,false,'slow','high',89,367),
  ('Chole Bhature',179,'Mains','https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop','Spiced chickpeas with fluffy deep-fried bhature. Classic Punjabi.',true,false,'medium','medium',87,298),
  ('Veg Thali Special',399,'Combos','https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop','Dal makhani + Paneer + Rice + 2 Roti + Salad + Dessert. Complete meal.',true,true,'medium','high',72,198),
  ('Chicken Thali',449,'Combos','https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop','Butter chicken + Rice + 2 Roti + Salad + Raita + Sweet. Best value.',true,true,'medium','high',124,312),
  ('Paneer Combo Meal',349,'Combos','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop','Paneer butter masala + 2 Naan + Rice + Raita + Gulab Jamun. Filling.',true,true,'medium','high',93,244),
  ('Masala Dosa',199,'Breakfast','https://images.unsplash.com/photo-1668236543090-82eba5eea6ca?w=400&h=300&fit=crop','Crispy rice crepe filled with spiced potato. With sambar & coconut chutney.',true,true,'fast','medium',156,412),
  ('Aloo Paratha',79,'Breakfast','https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop','Whole wheat flatbread stuffed with spiced potato. Served with curd.',true,false,'fast','medium',52,175),
  ('Butter Naan',49,'Breads','https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop','Soft fluffy tandoor-baked bread glazed with butter. Perfect with curries.',true,false,'fast','high',167,423),
  ('Garlic Naan',59,'Breads','https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop','Naan topped with roasted garlic and fresh coriander. Fragrant and irresistible.',true,false,'fast','high',154,387),
  ('Gulab Jamun (2 pcs)',99,'Desserts','https://images.unsplash.com/photo-1627303795478-d0e2e5a4a1e8?w=400&h=300&fit=crop','Soft milk-solid balls soaked in rose-scented sugar syrup. Served warm.',true,false,'fast','low',12,178),
  ('Rasmalai',129,'Desserts','https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop','Cottage cheese dumplings in saffron-flavoured cream. Chilled dessert.',true,false,'fast','medium',29,143),
  ('Mango Lassi',79,'Beverages','https://images.unsplash.com/photo-1590080876614-bc8104e62908?w=400&h=300&fit=crop','Thick yogurt drink blended with Alphonso mango pulp. Summer favourite.',true,false,'fast','medium',45,189),
  ('Masala Chai',39,'Beverages','https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=400&h=300&fit=crop','Spiced tea brewed with ginger, cardamom and cinnamon. The classic.',true,false,'fast','medium',189,467)
) AS v(name,price,category,image,description,available,featured,prep_time,profit_tag,clicks,views);

-- ──────────────────────────────────────────────────────────────
-- 6. ORDERS TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  guest_name    TEXT NOT NULL DEFAULT 'Guest',
  member_count  INTEGER NOT NULL DEFAULT 1,
  table_number  TEXT NOT NULL DEFAULT 'QR',
  items         JSONB NOT NULL DEFAULT '[]',
  total         INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','preparing','done','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers (anon) can INSERT orders for any restaurant
CREATE POLICY "Anon insert orders"
  ON orders FOR INSERT WITH CHECK (true);

-- Only the restaurant owner can read and update orders
CREATE POLICY "Owner read orders"
  ON orders FOR SELECT USING (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

CREATE POLICY "Owner update orders"
  ON orders FOR UPDATE USING (
    auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id)
  );

-- ──────────────────────────────────────────────────────────────
-- 7. FIX: Tracking RPCs — add restaurant_id guard to prevent
--    cross-tenant manipulation of click/view counts
-- ──────────────────────────────────────────────────────────────
-- Drop old unguarded versions first
DROP FUNCTION IF EXISTS increment_click(INT);
DROP FUNCTION IF EXISTS increment_view(INT);

-- New versions require item_id + restaurant_id — anon can only update
-- items that actually belong to the restaurant they're viewing
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

-- ──────────────────────────────────────────────────────────────
-- 8. FIX: menu_items RLS — use security-definer helper function
--    instead of subquery (avoids N+1 RLS evaluation)
-- ──────────────────────────────────────────────────────────────
-- Helper: returns the owner_id for a given restaurant_id
CREATE OR REPLACE FUNCTION get_restaurant_owner(rest_id UUID)
RETURNS UUID AS $$
  SELECT owner_id FROM restaurants WHERE id = rest_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop old subquery-based policies and replace with function-based ones
DROP POLICY IF EXISTS "Owner insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Owner update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Owner delete menu_items" ON menu_items;

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
