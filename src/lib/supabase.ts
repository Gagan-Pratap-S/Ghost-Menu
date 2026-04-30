// ─── Supabase REST client ─────────────────────────────────────────────────────
// - No module-level auth token (was leaking between contexts)
// - Token comes from AuthStore singleton — set after login, cleared on logout
// - All admin writes use the user's JWT, not the anon key
// - Tracking RPCs always use anon key (intentionally public)

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

// ─── Auth token store — simple singleton, not a module-level let ─────────────
const AuthStore = {
  _token: null as string | null,
  _refresh: null as string | null,
  _expiresAt: 0,
  set(token: string, refresh: string, expiresIn: number) {
    this._token    = token;
    this._refresh  = refresh;
    this._expiresAt = Date.now() + (expiresIn - 60) * 1000; // 60s buffer
  },
  get()      { return this._token; },
  getRefresh() { return this._refresh; },
  isExpired()  { return this._token !== null && Date.now() > this._expiresAt; },
  clear()    { this._token = null; this._refresh = null; this._expiresAt = 0; },
};

export function setAuthToken(token: string | null, refresh: string | null = null, expiresIn = 3600) {
  if (token) AuthStore.set(token, refresh ?? "", expiresIn);
  else       AuthStore.clear();
}

// ─── Token refresh ────────────────────────────────────────────────────────────
export async function refreshSession(): Promise<boolean> {
  const rt = AuthStore.getRefresh();
  if (!rt || !isSupabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) { AuthStore.clear(); return false; }
    const data = await res.json();
    AuthStore.set(data.access_token, data.refresh_token, data.expires_in ?? 3600);
    return true;
  } catch { return false; }
}

// ─── Headers — auto-refreshes token if expired ────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  if (AuthStore.isExpired()) await refreshSession();
  const token = AuthStore.get() ?? SUPABASE_ANON;
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function publicHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string };
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("AUTH DATA:", data);
  console.log("AUTH ERROR:", error);

  if (error || !data.session) {
    return { session: null, error: error?.message ?? "Login failed" };
  }

  const s = data.session;

  // ✅ MAP Supabase Session → your AuthSession
  const session: AuthSession = {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: s.expires_in ?? 3600,
    user: {
      id: s.user.id,
      email: s.user.email ?? "", // 🔥 FIX: ensure string
    },
  };

  return { session, error: null };
}
export async function signOut() {
  await supabase.auth.signOut();
}



// Validate a stored session token is still live (call on app mount)
export async function validateSession(token: string): Promise<boolean> {
  if (!isSupabaseConfigured || !token) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch { return false; }
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
      { headers: publicHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch { return null; }
}

export async function fetchRestaurantByOwner(ownerId: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const h = await authHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
      { headers: h }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch { return null; }
}

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────
import type { MenuItem } from "@/data/menuData";

// Columns that exist in the DB — strip anything else before sending
const DB_COLUMNS = new Set([
  "name","price","category","image","description",
  "available","featured","prep_time","profit_tag",
  "restaurant_id","clicks","views",
]);

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([k]) => DB_COLUMNS.has(k)));
}

export async function fetchMenuItems(restaurantId?: string): Promise<MenuItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const filter = restaurantId
      ? `&restaurant_id=eq.${encodeURIComponent(restaurantId)}`
      : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?order=id.asc${filter}`,
      { headers: publicHeaders() }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function createMenuItem(
  data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">,
  restaurantId: string
): Promise<MenuItem | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const h = await authHeaders();
    const payload = sanitize({ ...data, clicks: 0, views: 0, restaurant_id: restaurantId } as Record<string, unknown>);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

export async function updateMenuItem(
  id: number,
  restaurantId: string,
  data: Partial<Omit<MenuItem, "id" | "clicks" | "views" | "tag">>
): Promise<MenuItem | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const h = await authHeaders();
    const payload = sanitize(data as Record<string, unknown>);
    // Filter by both id AND restaurant_id — double safety on top of RLS
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
      { method: "PATCH", headers: h, body: JSON.stringify(payload) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

export async function deleteMenuItem(id: number, restaurantId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const h = await authHeaders();
    // Always scope by restaurant_id — prevents cross-tenant deletes even if RLS is misconfigured
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
      { method: "DELETE", headers: h }
    );
    return res.ok;
  } catch { return false; }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "preparing" | "done" | "cancelled";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: string;
  restaurant_id: string;
  guest_name: string;
  member_count: number;
  table_number: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at?: string;
}

export async function createOrder(order: Omit<Order, "id" | "created_at" | "status">): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: publicHeaders(), // customers are anon
      body: JSON.stringify({ ...order, status: "pending" }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
}

export async function fetchOrders(restaurantId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const h = await authHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=created_at.desc&limit=50`,
      { headers: h }
    );
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const h = await authHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch { return false; }
}

// ─── TRACKING — always anon, no restaurant guard needed (item id is enough) ───
async function rpc(fn: string, body: object) {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {}
}

export const incrementClick = (itemId: number, restaurantId?: string) =>
  rpc("increment_click", { item_id: itemId, rest_id: restaurantId ?? null });
export const incrementView  = (itemId: number, restaurantId?: string) =>
  rpc("increment_view",  { item_id: itemId, rest_id: restaurantId ?? null });
