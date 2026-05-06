// ─── Ghost Menu — Supabase layer ─────────────────────────────────────────────
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

function makeClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "ghostMenuSupabaseSession",
    },
  });
}

export const supabaseClient = makeClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string };
}

function mapSession(s: import("@supabase/supabase-js").Session | null): AuthSession | null {
  if (!s) return null;
  return {
    access_token:  s.access_token,
    refresh_token: s.refresh_token ?? "",
    expires_in:    s.expires_in    ?? 3600,
    user: { id: s.user.id, email: s.user.email ?? "" },
  };
}

export async function signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }> {
  if (!isSupabaseConfigured) return { session: null, error: "Supabase not configured" };
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) return { session: null, error: error?.message ?? "Login failed" };
  return { session: mapSession(data.session), error: null };
}

export async function signOut(): Promise<void> {
  await supabaseClient.auth.signOut();
}

export async function getStoredSession(): Promise<AuthSession | null> {
  const { data } = await supabaseClient.auth.getSession();
  return mapSession(data.session);
}

// ─── REST helpers ─────────────────────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token ?? SUPABASE_ANON;
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

// ─── Restaurant ───────────────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  kitchen_busy?: boolean;
  theme_color?: string;
  logo_url?: string;
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
  } catch (e) { console.error("[ghost-menu] fetchRestaurantBySlug failed", e); return null; }
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
  } catch (e) { console.error("[ghost-menu] fetchRestaurantByOwner failed", e); return null; }
}

export async function updateKitchenStatus(restaurantId: string, busy: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const h = await authHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${encodeURIComponent(restaurantId)}`, {
      method: "PATCH", headers: h, body: JSON.stringify({ kitchen_busy: busy }),
    });
    return res.ok;
  } catch (e) { console.error("[ghost-menu] updateKitchenStatus failed", e); return false; }
}

export async function createRestaurant(ownerId: string, data: { name: string; slug: string; theme_color: string }): Promise<Restaurant | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const h = await authHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants`, {
      method: "POST", headers: h,
      body: JSON.stringify({ ...data, owner_id: ownerId, kitchen_busy: false }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (e) { console.error("[ghost-menu] createRestaurant failed", e); return null; }
}

// ─── Menu items ───────────────────────────────────────────────────────────────
import type { MenuItem } from "@/data/menuData";

const DB_COLUMNS = new Set([
  "name","price","category","image","description",
  "available","featured","prep_time","profit_tag",
  "restaurant_id","clicks","views","tags",
]);

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([k]) => DB_COLUMNS.has(k)));
}

export async function fetchMenuItems(restaurantId?: string): Promise<MenuItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const filter = restaurantId ? `&restaurant_id=eq.${encodeURIComponent(restaurantId)}` : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?order=id.asc${filter}`,
      { headers: publicHeaders() }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (e) { console.error("[ghost-menu] fetchMenuItems failed", e); return null; }
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
      method: "POST", headers: h, body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (e) { console.error("[ghost-menu] createMenuItem failed", e); return null; }
}

export async function updateMenuItem(
  id: number, restaurantId: string,
  data: Partial<Omit<MenuItem, "id" | "clicks" | "views" | "tag">>
): Promise<MenuItem | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const h = await authHeaders();
    const payload = sanitize(data as Record<string, unknown>);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
      { method: "PATCH", headers: h, body: JSON.stringify(payload) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (e) { console.error("[ghost-menu] updateMenuItem failed", e); return null; }
}

export async function deleteMenuItem(id: number, restaurantId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const h = await authHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
      { method: "DELETE", headers: h }
    );
    return res.ok;
  } catch (e) { console.error("[ghost-menu] deleteMenuItem failed", e); return false; }
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

export interface OrderItem { id: number; name: string; price: number; quantity: number; }

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

export interface CreateOrderInput {
  restaurant_id: string;
  guest_name: string;
  member_count: number;
  table_number: string;
  items: OrderItem[];
  total: number;
}

// SEC-2: hard validation + return=minimal to avoid SELECT RLS conflict
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order | null; error: string | null }> {
  if (!input.restaurant_id) return { order: null, error: "No restaurant selected" };
  if (!input.items.length)   return { order: null, error: "Cart is empty" };
  if (input.total <= 0)      return { order: null, error: "Invalid order total" };
  if (!isSupabaseConfigured) return { order: null, error: "Supabase not configured" };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal", // avoids SELECT RLS conflict for anon
      },
      body: JSON.stringify({ ...input, status: "pending" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { order: null, error: body?.message ?? body?.hint ?? `Server error ${res.status}` };
    }
    return { order: { ...input, status: "pending", id: crypto.randomUUID() }, error: null };
  } catch (e) {
    console.error("[ghost-menu] createOrder failed", e);
    return { order: null, error: e instanceof Error ? e.message : "Network error" };
  }
}

// SEC-5: cursor-based pagination
export async function fetchOrders(restaurantId: string, cursor?: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const h = await authHeaders();
    const cursorFilter = cursor ? `&created_at=lt.${encodeURIComponent(cursor)}` : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=created_at.desc&limit=50${cursorFilter}`,
      { headers: h }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) { console.error("[ghost-menu] fetchOrders failed", e); return []; }
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: publicHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  } catch (e) { console.error("[ghost-menu] fetchOrderById failed", e); return null; }
}

export async function fetchTableOrders(restaurantId: string, tableNumber: string): Promise<Order[]> {
  if (!isSupabaseConfigured || !tableNumber || tableNumber === "QR") return [];
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&table_number=eq.${encodeURIComponent(tableNumber)}&created_at=gte.${encodeURIComponent(twoHoursAgo)}&order=created_at.desc`,
      { headers: publicHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) { console.error("[ghost-menu] fetchTableOrders failed", e); return []; }
}

export async function fetchRecentOrderCounts(restaurantId: string): Promise<Record<number, number>> {
  if (!isSupabaseConfigured) return {};
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&created_at=gte.${encodeURIComponent(thirtyMinsAgo)}`,
      { headers: publicHeaders() }
    );
    if (!res.ok) return {};
    const orders: Order[] = await res.json();
    const counts: Record<number, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        counts[item.id] = (counts[item.id] ?? 0) + item.quantity;
      }
    }
    return counts;
  } catch (e) { console.error("[ghost-menu] fetchRecentOrderCounts failed", e); return {}; }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const h = await authHeaders();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
      method: "PATCH", headers: h, body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (e) { console.error("[ghost-menu] updateOrderStatus failed", e); return false; }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────
export function subscribeToOrders(
  restaurantId: string,
  onInsert: (order: Order) => void,
  onUpdate: (order: Order) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabaseClient
    .channel(`orders:${restaurantId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, p => onInsert(p.new as Order))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, p => onUpdate(p.new as Order))
    .subscribe();
  return () => { supabaseClient.removeChannel(channel); };
}

export function subscribeToOrder(id: string, onUpdate: (order: Order) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabaseClient
    .channel(`order:${id}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, p => onUpdate(p.new as Order))
    .subscribe();
  return () => { supabaseClient.removeChannel(channel); };
}

// ─── Tracking ─────────────────────────────────────────────────────────────────
async function rpc(fn: string, body: object) {
  if (!isSupabaseConfigured) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) { console.error(`[ghost-menu] rpc ${fn} failed`, e); }
}

export const incrementClick = (itemId: number, restaurantId?: string) =>
  rpc("increment_click", { item_id: itemId, rest_id: restaurantId ?? null });
export const incrementView  = (itemId: number, restaurantId?: string) =>
  rpc("increment_view",  { item_id: itemId, rest_id: restaurantId ?? null });
