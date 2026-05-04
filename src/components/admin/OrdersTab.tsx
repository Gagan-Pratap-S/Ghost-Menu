"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOrders, updateOrderStatus, subscribeToOrders, Order, OrderStatus } from "@/lib/supabase";

interface Props { restaurantId: string; }

const STATUS_CONFIG: Record<OrderStatus, { label: string; cssClass: string; next: OrderStatus | null; nextLabel: string | null; nextBg: string }> = {
  pending:   { label: "Pending",   cssClass: "status-pending",   next: "preparing", nextLabel: "Accept →",       nextBg: "rgba(59,130,246,0.15)" },
  preparing: { label: "Preparing", cssClass: "status-preparing", next: "ready",     nextLabel: "Mark Ready ✓",   nextBg: "rgba(168,85,247,0.15)" },
  ready:     { label: "Ready",     cssClass: "status-ready",     next: "served",    nextLabel: "Mark Served 🍽", nextBg: "rgba(34,197,94,0.15)"  },
  served:    { label: "Served",    cssClass: "status-served",    next: null,        nextLabel: null,              nextBg: "" },
  cancelled: { label: "Cancelled", cssClass: "status-cancelled", next: null,        nextLabel: null,              nextBg: "" },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function LiveDot({ isLive }: { isLive: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#22c55e" }} />}
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: isLive ? "#22c55e" : "#334155" }} />
      </span>
      <span className="text-xs font-semibold" style={{ color: isLive ? "#4ade80" : "#475569" }}>
        {isLive ? "Live" : "Connecting…"}
      </span>
    </span>
  );
}

export default function OrdersTab({ restaurantId }: Props) {
  const [orders, setOrders]             = useState<Order[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<OrderStatus | "all">("all");
  const [newOrderIds, setNewOrderIds]   = useState<Set<string>>(new Set());
  const [isLive, setIsLive]             = useState(false);
  const loadedOnce                       = useRef(false);

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

  const glass = { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <LiveDot isLive={isLive} />
        <button onClick={load} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "pending", "preparing", "ready", "served"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
            style={filter === f
              ? { background: "#f97316", color: "#fff", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
            }
          >
            {f === "all" ? `All (${orders.length})` : f === "pending" && pendingCount > 0 ? `Pending (${pendingCount})` : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={glass} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-display font-semibold text-white">{filter === "all" ? "No orders yet" : `No ${filter} orders`}</p>
          {filter === "all" && <p className="text-xs text-slate-600 mt-1">Orders appear here instantly when customers place them</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg   = STATUS_CONFIG[order.status];
            const isNew = order.id ? newOrderIds.has(order.id) : false;
            return (
              <div key={order.id} className="rounded-2xl p-4 transition-all duration-500"
                style={isNew
                  ? { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(249,115,22,0.3)", boxShadow: "0 0 20px rgba(249,115,22,0.1)" }
                  : { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-sm text-white tracking-tight">{order.guest_name}</p>
                      {order.table_number && order.table_number !== "QR" && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
                        >Table {order.table_number}</span>
                      )}
                      <span className="text-xs text-slate-600">· {order.member_count} pax</span>
                      {isNew && <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" }}>NEW</span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {order.created_at ? timeAgo(order.created_at) : ""} · <span className="tabular-nums price">₹{order.total}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.cssClass}`}>{cfg.label}</span>
                </div>

                {/* Items */}
                <div className="space-y-0.5 mb-3 rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-slate-400">{item.quantity}× {item.name}</span>
                      <span className="text-slate-600 tabular-nums price">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {cfg.next && cfg.nextLabel && (
                    <button onClick={() => handleStatusChange(order, cfg.next!)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                      style={{ background: cfg.nextBg, border: "1px solid rgba(255,255,255,0.1)" }}
                    >{cfg.nextLabel}</button>
                  )}
                  {(order.status === "pending" || order.status === "preparing") && (
                    <button onClick={() => handleStatusChange(order, "cancelled")}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                      style={{ color: "#f87171", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}
                    >Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
