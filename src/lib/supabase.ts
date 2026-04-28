// Supabase client — thin REST wrapper, no npm package needed
// Gracefully falls back to local data if env vars not set

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

// Debug helper to check Supabase configuration status
export function getSupabaseStatus() {
  return {
    configured: isSupabaseConfigured,
    url: SUPABASE_URL ? "✓" : "✗",
    key: SUPABASE_ANON ? "✓" : "✗",
    message: isSupabaseConfigured 
      ? "Supabase is configured" 
      : "Supabase is NOT configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
  };
}

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
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Using local fallback data.");
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?order=id.asc`, { headers: headers() });
    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Failed to fetch menu items:", res.status, error);
      return null;
    }
    const data = await res.json();
    console.log("✅ Menu items fetched successfully:", data.length, "items");
    return data;
  } catch (err) {
    console.error("❌ Error fetching menu items:", err);
    return null;
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function createMenuItem(data: Omit<import("@/data/menuData").MenuItem, "id" | "clicks" | "views" | "tag">) {
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Menu items will only be saved locally.");
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ...data, clicks: 0, views: 0 }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Failed to create menu item:", res.status, error);
      return null;
    }
    const rows = await res.json();
    console.log("✅ Menu item created successfully:", rows);
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (err) {
    console.error("❌ Error creating menu item:", err);
    return null;
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateMenuItem(
  id: number,
  data: Partial<Omit<import("@/data/menuData").MenuItem, "id" | "clicks" | "views" | "tag">>
) {
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Menu items will only be saved locally.");
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Failed to update menu item:", res.status, error);
      return null;
    }
    const rows = await res.json();
    console.log("✅ Menu item updated successfully:", rows);
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (err) {
    console.error("❌ Error updating menu item:", err);
    return null;
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteMenuItem(id: number) {
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase not configured. Menu items will only be deleted locally.");
    return false;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Failed to delete menu item:", res.status, error);
      return false;
    }
    console.log("✅ Menu item deleted successfully");
    return true;
  } catch (err) {
    console.error("❌ Error deleting menu item:", err);
    return false;
  }
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
