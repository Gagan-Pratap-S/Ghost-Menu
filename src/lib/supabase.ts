// Supabase client wrapper
// Falls back gracefully if env vars are not set (dev mode uses local data)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Generic REST fetch helper
async function supabaseFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers ?? {}),
    },
  });
}

// Fetch all menu items
export async function fetchMenuItems() {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await supabaseFetch("/menu_items?order=id.asc");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Increment click count via RPC
export async function incrementClick(itemId: number) {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_click`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item_id: itemId }),
    });
  } catch {
    // silent fail — local state already updated
  }
}

// Increment view count via RPC
export async function incrementView(itemId: number) {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_view`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item_id: itemId }),
    });
  } catch {
    // silent fail
  }
}

// SQL to set up Supabase (run once in Supabase SQL editor):
export const SETUP_SQL = `
-- Create menu_items table
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

-- Enable RLS (Row Level Security)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Public read" ON menu_items FOR SELECT USING (true);

-- Increment click function
CREATE OR REPLACE FUNCTION increment_click(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET clicks = clicks + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Increment view function
CREATE OR REPLACE FUNCTION increment_view(item_id INT)
RETURNS VOID AS $$
  UPDATE menu_items SET views = views + 1 WHERE id = item_id;
$$ LANGUAGE sql SECURITY DEFINER;
`;
