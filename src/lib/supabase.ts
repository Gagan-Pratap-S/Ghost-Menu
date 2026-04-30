// ─── Supabase client — thin REST wrapper ────────────────────────────────────
// Uses anon key for public reads; uses session token for authed admin writes.
// Falls back gracefully if env vars not configured.

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

// ─── Auth token storage (set after login) ────────────────────────────────────
let _authToken: string | null = null;
export function setAuthToken(token: string | null) { _authToken = token; }
export function getAuthToken() { return _authToken; }

// ─── Headers ─────────────────────────────────────────────────────────────────
function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = _authToken ?? SUPABASE_ANON;
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export interface AuthSession {
  access_token: string;
  user: { id: string; email: string };
}

export async function signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }> {
  if (!isSupabaseConfigured) return { session: null, error: "Supabase not configured" };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { session: null, error: data.error_description ?? data.msg ?? "Login failed" };
    const session: AuthSession = { access_token: data.access_token, user: data.user };
    setAuthToken(session.access_token);
    return { session, error: null };
  } catch { return { session: null, error: "Network error" }; }
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${_authToken}` },
    });
  } catch {}
  setAuthToken(null);
}

export async function getUser(): Promise<AuthSession["user"] | null> {
  if (!isSupabaseConfigured || !_authToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${_authToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── RESTAURANT ───────────────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch { return null; }
}

export async function fetchRestaurantByOwner(ownerId: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch { return null; }
}

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
export async function fetchMenuItems(restaurantId?: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const filter = restaurantId ? `&restaurant_id=eq.${encodeURIComponent(restaurantId)}` : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?order=id.asc${filter}`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function createMenuItem(
  data: Omit<import("@/data/menuData").MenuItem, "id" | "clicks" | "views" | "tag">,
  restaurantId: string
) {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ...data, clicks: 0, views: 0, restaurant_id: restaurantId }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

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

// ─── TRACKING ─────────────────────────────────────────────────────────────────
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
