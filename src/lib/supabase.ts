// ─── Ghost Menu — Supabase layer ─────────────────────────────────────────────
// Auth:  @supabase/supabase-js official client (handles refresh, persistence)
// Data:  raw REST fetch (small bundle, full control, easy to unit-test)
// RT:    @supabase/supabase-js Realtime channel for live orders

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON);

// ─── Official Supabase client (auth + realtime only) ─────────────────────────
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

// ─── Internal session type ────────────────────────────────────────────────────
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

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> {
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

// ─── REST headers ─────────────────────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token ?? SUPABASE_ANON;
  return {
    apikey:         SUPABASE_ANON,
    Authorization:  `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer:         "return=representation",
  };
}

function publicHeaders(): Record<string, string> {
  return {
    apikey:         SUPABASE_ANON,
    Authorization:  `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
    Prefer:         "return=representation",
  };
}

// ─── RESTAURANT ───────────────────────────────────────────────────────────────
export interface Restaurant { id: string; name: string; slug: string; owner_id: string; }

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
    const filter = restaurantId ? `&restaurant_id=eq.${encodeURIComponent(restaurantId)}` : "";
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
      method: "POST", headers: h, body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows[0] : rows;
  } catch { return null; }
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
  } catch { return null; }
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
  } catch { return false; }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
// Status pipeline: pending → preparing → ready → served
// cancelled is a terminal state reachable from pending or preparing
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

export async function createOrder(input: CreateOrderInput): Promise<{ order: Order | null; error: string | null }> {
  // Hard validation — never silently succeed
  if (!input.restaurant_id) return { order: null, error: "No restaurant selected" };
  if (!input.items.length)   return { order: null, error: "Cart is empty" };
  if (input.total <= 0)      return { order: null, error: "Invalid order total" };

  if (!isSupabaseConfigured) return { order: null, error: "Supabase not configured — cannot place order" };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: publicHeaders(),
      body: JSON.stringify({ ...input, status: "pending" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { order: null, error: body?.message ?? `Server error ${res.status}` };
    }
    const rows = await res.json();
    const order: Order = Array.isArray(rows) ? rows[0] : rows;
    return { order, error: null };
  } catch (e) {
    return { order: null, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function fetchOrders(restaurantId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const h = await authHeaders();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=created_at.desc&limit=100`,
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
      method: "PATCH", headers: h, body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch { return false; }
}

// ─── REALTIME — live order subscription ──────────────────────────────────────
// Returns an unsubscribe function. Call it in useEffect cleanup.
export function subscribeToOrders(
  restaurantId: string,
  onInsert: (order: Order) => void,
  onUpdate: (order: Order) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabaseClient
    .channel(`orders:${restaurantId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => onInsert(payload.new as Order)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => onUpdate(payload.new as Order)
    )
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}

// ─── TRACKING ─────────────────────────────────────────────────────────────────
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
