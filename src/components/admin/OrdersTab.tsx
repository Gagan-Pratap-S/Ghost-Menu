"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOrders, updateOrderStatus, subscribeToOrders, Order, OrderStatus } from "@/lib/supabase";
import { formatPrice } from "@/lib/constants";

interface Props { restaurantId: string; }

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; cssClass: string;
  next: OrderStatus | null; nextLabel: string | null;
}> = {
  pending:   { label: "Pending",   cssClass: "gm-status gm-status-pending",   next: "preparing", nextLabel: "Accept →" },
  preparing: { label: "Preparing", cssClass: "gm-status gm-status-preparing", next: "ready",     nextLabel: "Mark Ready ✓" },
  ready:     { label: "Ready",     cssClass: "gm-status gm-status-ready",     next: "served",    nextLabel: "Mark Served 🍽" },
  served:    { label: "Served",    cssClass: "gm-status gm-status-served",    next: null,        nextLabel: null },
  cancelled: { label: "Cancelled", cssClass: "gm-status gm-status-cancelled", next: null,        nextLabel: null },
};

function playNewOrderChime() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880,  ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

let _titleFlashInterval: ReturnType<typeof setInterval> | null = null;
function flashTabTitle() {
  if (typeof document === "undefined") return;
  if (_titleFlashInterval) return;
  const orig = document.title;
  _titleFlashInterval = setInterval(() => {
    document.title = document.title === orig ? "★ New Order!" : orig;
  }, 1000);
  const stop = () => {
    if (_titleFlashInterval) { clearInterval(_titleFlashInterval); _titleFlashInterval = null; }
    document.title = orig;
    window.removeEventListener("focus", stop);
  };
  window.addEventListener("focus", stop);
  setTimeout(stop, 20_000);
}

function useElapsed(dateStr?: string): { label: string; urgency: "normal" | "warning" | "danger" } {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!dateStr) return { label: "", urgency: "normal" };
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  const label = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  const urgency: "normal" | "warning" | "danger" = mins >= 10 ? "danger" : mins >= 5 ? "warning" : "normal";
  return { label, urgency };
}

interface OrderCardProps {
  order: Order;
  isNew: boolean;
  onStatusChange: (order: Order, next: OrderStatus) => void;
}

function OrderCard({ order, isNew, onStatusChange }: OrderCardProps) {
  const { label: timeLabel, urgency } = useElapsed(order.created_at);
  const cfg = STATUS_CONFIG[order.status];

  const timeColor = urgency === "danger" ? "var(--gm-danger)" : urgency === "warning" ? "var(--gm-warning)" : "var(--gm-text-tertiary)";

  const borderColor = urgency === "danger"
    ? "var(--gm-danger-border)"
    : isNew ? "var(--gm-primary)" : "var(--gm-border)";

  const boxShadow = urgency === "danger"
    ? "0 0 0 2px rgba(239,68,68,0.12), var(--gm-shadow-md)"
    : isNew ? "0 0 0 2px rgba(255,122,0,0.15), var(--gm-shadow-md)"
    : "var(--gm-shadow-md)";

  return (
    <div style={{ background: "var(--gm-surface)", border: `1px solid ${borderColor}`, borderRadius: "var(--gm-radius-md)", padding: 16, boxShadow, transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>{order.guest_name}</p>
            {order.table_number && order.table_number !== "QR" && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: "var(--gm-primary)", color: "#fff" }}>
                🪑 Table {order.table_number}
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--gm-text-tertiary)" }}>· {order.member_count} pax</span>
            {isNew && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#FFF7ED", color: "var(--gm-primary)", border: "1px solid #FDBA74", animation: "urgencyPulse 1s ease-in-out infinite" }}>
                NEW
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, marginTop: 2, color: timeColor }} className={urgency === "danger" ? "animate-urgencyPulse" : ""}>
            <span style={{ fontWeight: urgency === "danger" ? 600 : 400 }}>
              {timeLabel}{urgency !== "normal" ? " ⚠️" : ""}
            </span>
            {" · "}
            <span className="tabular-nums price">{formatPrice(order.total)}</span>
          </p>
        </div>
        <span className={cfg.cssClass}>{cfg.label}</span>
      </div>

      <div style={{ background: "var(--gm-bg)", borderRadius: "var(--gm-radius-sm)", padding: "10px 12px", marginBottom: 12 }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: idx < order.items.length - 1 ? 4 : 0 }}>
            <span style={{ color: "var(--gm-text-secondary)" }}>{item.quantity}× {item.name}</span>
            <span style={{ color: "var(--gm-text-tertiary)" }} className="tabular-nums price">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {cfg.next && cfg.nextLabel && (
          <button onClick={() => onStatusChange(order, cfg.next!)} className="gm-btn-primary" style={{ flex: 1, height: 40, fontSize: 13 }}>
            {cfg.nextLabel}
          </button>
        )}
        {(order.status === "pending" || order.status === "preparing") && (
          <button onClick={() => onStatusChange(order, "cancelled")} className="gm-btn-danger" style={{ padding: "0 14px", fontSize: 13 }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrdersTab({ restaurantId }: Props) {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<OrderStatus | "all">("all");
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive]           = useState(false);
  const loadedOnce                     = useRef(false);

  const load = useCallback(async () => {
    const data = await fetchOrders(restaurantId);
    setOrders(data);
    if (!loadedOnce.current) { setLoading(false); loadedOnce.current = true; }
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setIsLive(false);
    const unsub = subscribeToOrders(
      restaurantId,
      newOrder => {
        setOrders(prev => prev.find(o => o.id === newOrder.id) ? prev : [newOrder, ...prev]);
        if (newOrder.id) {
          setNewOrderIds(prev => new Set(prev).add(newOrder.id!));
          setTimeout(() => setNewOrderIds(prev => { const n = new Set(prev); n.delete(newOrder.id!); return n; }), 3000);
        }
        playNewOrderChime();
        flashTabTitle();
        setIsLive(true);
      },
      updated => { setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)); setIsLive(true); }
    );
    const t = setTimeout(() => setIsLive(true), 1500);
    return () => { unsub(); clearTimeout(t); setIsLive(false); };
  }, [restaurantId]);

  const handleStatusChange = async (order: Order, next: OrderStatus) => {
    if (!order.id) return;
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    const ok = await updateOrderStatus(order.id, next);
    if (!ok) setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const filtered     = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {isLive ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gm-success)", display: "inline-block", animation: "urgencyPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gm-success)" }}>Live</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--gm-text-tertiary)" }}>Connecting…</span>
        )}
        <button onClick={load} style={{ fontSize: 13, color: "var(--gm-text-secondary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ↻ Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="scrollbar-none">
        {(["all", "pending", "preparing", "ready", "served"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "gm-chip-active" : "gm-chip-inactive"} style={{ flexShrink: 0 }}>
            {f === "all" ? `All (${orders.length})` : f === "pending" && pendingCount > 0 ? `Pending (${pendingCount})` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2].map(i => <div key={i} className="animate-skeleton" style={{ height: 120, borderRadius: 18 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 20px" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)" }}>{filter === "all" ? "No orders yet" : `No ${filter} orders`}</p>
          {filter === "all" && <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginTop: 4 }}>Orders appear here instantly when customers place them</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={order.id ? newOrderIds.has(order.id) : false}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
