-- Run this SQL in your Supabase project's SQL Editor (once)

-- 1. Create the menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL,
  category    TEXT NOT NULL,
  image       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  available   BOOLEAN NOT NULL DEFAULT true,
  featured    BOOLEAN NOT NULL DEFAULT false,
  prep_time   TEXT NOT NULL DEFAULT 'medium' CHECK (prep_time IN ('fast','medium','slow')),
  profit_tag  TEXT NOT NULL DEFAULT 'medium' CHECK (profit_tag IN ('low','medium','high')),
  clicks      INTEGER NOT NULL DEFAULT 0,
  views       INTEGER NOT NULL DEFAULT 0
);

-- 2. Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 3. Allow public reads
-- Allow RPC updates (clicks/views)
CREATE POLICY "Allow update via RPC"
ON menu_items
FOR UPDATE
USING (true);

-- 4. Increment click function
CREATE OR REPLACE FUNCTION increment_click(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET clicks = clicks + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Increment view function
CREATE OR REPLACE FUNCTION increment_view(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET views = views + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Insert all menu data
INSERT INTO menu_items (name, price, category, image, description, available, featured, prep_time, profit_tag, clicks, views) VALUES
('Paneer Tikka', 299, 'Starters', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop', 'Marinated paneer cubes grilled in tandoor. Smoky, juicy, served with mint chutney.', true, true, 'medium', 'high', 42, 145),
('Samosa (2 pcs)', 59, 'Starters', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', 'Crispy golden pastry stuffed with spiced potato and peas. Classic street food.', true, false, 'fast', 'medium', 34, 267),
('Veg Spring Rolls', 129, 'Starters', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', 'Crispy rolls packed with stir-fried vegetables. Served with sweet chilli dip.', true, false, 'fast', 'medium', 18, 89),
('Hara Bhara Kebab', 179, 'Starters', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop', 'Spinach-pea patties spiced with herbs. Pan-fried till golden.', true, false, 'fast', 'medium', 21, 74),
('Butter Chicken', 349, 'Mains', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', 'Tender chicken in a rich creamy tomato-butter gravy. All-time favourite.', true, true, 'medium', 'high', 98, 289),
('Paneer Butter Masala', 299, 'Mains', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', 'Soft paneer in a velvety tomato-cream gravy. Best paired with naan.', true, true, 'medium', 'high', 76, 211),
('Dal Makhani', 249, 'Mains', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', 'Slow-cooked black lentils in a creamy buttery gravy. Comfort in a bowl.', true, false, 'slow', 'high', 67, 234),
('Chicken Biryani', 329, 'Mains', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', 'Fragrant basmati rice layered with spiced chicken. Served with raita.', true, false, 'slow', 'high', 89, 367),
('Veg Biryani', 249, 'Mains', 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&h=300&fit=crop', 'Aromatic basmati rice with seasonal vegetables and whole spices.', true, false, 'slow', 'medium', 44, 182),
('Chole Bhature', 179, 'Mains', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop', 'Spiced chickpeas with fluffy deep-fried bhature. Classic Punjabi.', true, false, 'medium', 'medium', 87, 298),
('Rajma Chawal', 199, 'Mains', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop', 'Slow-cooked red kidney beans in spiced gravy. Served with steamed rice.', true, false, 'slow', 'medium', 38, 156),
('Palak Paneer', 279, 'Mains', 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop', 'Fresh paneer in a vibrant spinach gravy. Healthy and flavourful.', true, false, 'medium', 'high', 51, 167),
('Veg Thali Special', 399, 'Combos', 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop', 'Dal makhani + Paneer + Rice + 2 Roti + Salad + Dessert. Complete meal.', true, true, 'medium', 'high', 72, 198),
('Chicken Thali', 449, 'Combos', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop', 'Butter chicken + Rice + 2 Roti + Salad + Raita + Sweet. Best value.', true, true, 'medium', 'high', 124, 312),
('Paneer Combo Meal', 349, 'Combos', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', 'Paneer butter masala + 2 Naan + Rice + Raita + Gulab Jamun. Filling.', true, true, 'medium', 'high', 93, 244),
('Masala Dosa', 199, 'Breakfast', 'https://images.unsplash.com/photo-1668236543090-82eba5eea6ca?w=400&h=300&fit=crop', 'Crispy rice crepe filled with spiced potato. With sambar & coconut chutney.', true, true, 'fast', 'medium', 156, 412),
('Idli Sambar (4 pcs)', 129, 'Breakfast', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop', 'Steamed rice cakes with hot lentil sambar and coconut chutney.', true, false, 'fast', 'medium', 63, 198),
('Aloo Paratha', 79, 'Breakfast', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop', 'Whole wheat flatbread stuffed with spiced potato. Served with curd.', true, false, 'fast', 'medium', 52, 175),
('Butter Naan', 49, 'Breads', 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&h=300&fit=crop', 'Soft fluffy tandoor-baked bread glazed with butter. Perfect with curries.', true, false, 'fast', 'high', 167, 423),
('Garlic Naan', 59, 'Breads', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop', 'Naan topped with roasted garlic and fresh coriander. Fragrant and irresistible.', true, false, 'fast', 'high', 154, 387),
('Gulab Jamun (2 pcs)', 99, 'Desserts', 'https://images.unsplash.com/photo-1627303795478-d0e2e5a4a1e8?w=400&h=300&fit=crop', 'Soft milk-solid balls soaked in rose-scented sugar syrup. Served warm.', true, false, 'fast', 'low', 12, 178),
('Rasmalai', 129, 'Desserts', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop', 'Cottage cheese dumplings in saffron-flavoured cream. Chilled dessert.', true, false, 'fast', 'medium', 29, 143),
('Filter Coffee', 49, 'Beverages', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=300&fit=crop', 'Traditional South Indian decoction coffee with milk. Strong and aromatic.', true, false, 'fast', 'medium', 178, 523),
('Mango Lassi', 79, 'Beverages', 'https://images.unsplash.com/photo-1590080876614-bc8104e62908?w=400&h=300&fit=crop', 'Thick yogurt drink blended with Alphonso mango pulp. Summer favourite.', true, false, 'fast', 'medium', 45, 189),
('Sweet Lassi', 69, 'Beverages', 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=300&fit=crop', 'Chilled yogurt blended with sugar and cardamom. Refreshingly light.', true, false, 'fast', 'medium', 37, 134),
('Masala Chai', 39, 'Beverages', 'https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=400&h=300&fit=crop', 'Spiced tea brewed with ginger, cardamom and cinnamon. The classic.', true, false, 'fast', 'medium', 189, 467);
