// Supabase client — thin REST wrapper, no npm package needed
// Gracefully falls back to local data if env vars not set

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

// ─── Shared headers ───────────────────────────────────────────────────────────
function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

// ─── READ ─────────────────────────────────────────────────────────────────────
export async function fetchMenuItems() {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?order=id.asc`, { headers: headers() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function createMenuItem(data: Omit<import("@/data/menuData").MenuItem, "id" | "clicks" | "views" | "tag">) {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ...data, clicks: 0, views: 0 }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateMenuItem(
  id: number,
  data: Partial<Omit<import("@/data/menuData").MenuItem, "id" | "clicks" | "views" | "tag">>
) {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteMenuItem(id: number) {
  if (!isSupabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    return res.ok;
  } catch { return false; }
}

// ─── TRACKING (existing, unchanged) ──────────────────────────────────────────
async function rpc(fn: string, body: object) {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {}
}

export const incrementClick = (itemId: number) => rpc("increment_click", { item_id: itemId });
export const incrementView  = (itemId: number) => rpc("increment_view",  { item_id: itemId });
