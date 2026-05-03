"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOrders, updateOrderStatus, subscribeToOrders, Order, OrderStatus } from "@/lib/supabase";

interface Props { restaurantId: string; }

// Full status pipeline: pending → preparing → ready → served
// cancelled is reachable from pending or preparing
const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  next: OrderStatus | null;
  nextLabel: string | null;
  nextColor: string;
}> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200",     next: "preparing", nextLabel: "Accept →",      nextColor: "bg-blue-500 hover:bg-blue-600" },
  preparing: { label: "Preparing", color: "bg-blue-100 text-blue-700 border-blue-200",           next: "ready",     nextLabel: "Mark Ready ✓",  nextColor: "bg-violet-500 hover:bg-violet-600" },
  ready:     { label: "Ready",     color: "bg-violet-100 text-violet-700 border-violet-200",     next: "served",    nextLabel: "Mark Served 🍽", nextColor: "bg-emerald-500 hover:bg-emerald-600" },
  served:    { label: "Served",    color: "bg-emerald-100 text-emerald-700 border-emerald-200",  next: null,        nextLabel: null,             nextColor: "" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-500 border-red-200",             next: null,        nextLabel: null,             nextColor: "" },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

export default function OrdersTab({ restaurantId }: Props) {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<OrderStatus | "all">("all");
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive]         = useState(false);
  const loadedOnce                   = useRef(false);

  const load = useCallback(async () => {
    const data = await fetchOrders(restaurantId);
    setOrders(data);
    if (!loadedOnce.current) {
      setLoading(false);
      loadedOnce.current = true;
    }
  }, [restaurantId]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    setIsLive(false);

    const unsub = subscribeToOrders(
      restaurantId,
      // onInsert — new order arrives
      (newOrder) => {
        setOrders(prev => {
          // Don't add duplicates
          if (prev.find(o => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        // Flash highlight for new orders
        if (newOrder.id) {
          setNewOrderIds(prev => new Set(prev).add(newOrder.id!));
          setTimeout(() => {
            setNewOrderIds(prev => {
              const next = new Set(prev);
              next.delete(newOrder.id!);
              return next;
            });
          }, 3000);
        }
        setIsLive(true);
      },
      // onUpdate — status changed
      (updated) => {
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        setIsLive(true);
      }
    );

    // Mark as live after subscription set up (brief delay for channel handshake)
    const liveTimer = setTimeout(() => setIsLive(true), 1500);

    return () => {
      unsub();
      clearTimeout(liveTimer);
      setIsLive(false);
    };
  }, [restaurantId]);

  const handleStatusChange = async (order: Order, next: OrderStatus) => {
    if (!order.id) return;
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    const ok = await updateOrderStatus(order.id, next);
    // Rollback on failure
    if (!ok) setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  };

  const activeOrders   = orders.filter(o => o.status !== "served" && o.status !== "cancelled");
  const pendingCount   = orders.filter(o => o.status === "pending").length;
  const filtered       = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Live indicator + summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <LiveDot />
              <span className="text-xs font-semibold text-emerald-600">Live</span>
            </>
          ) : (
            <span className="text-xs text-stone-400">Connecting…</span>
          )}
          {activeOrders.length > 0 && (
            <span className="text-xs text-stone-500 ml-1">
              · {activeOrders.length} active
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "pending", "preparing", "ready", "served"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
              filter === f
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
            }`}
          >
            {f === "all"
              ? `All (${orders.length})`
              : f === "pending" && pendingCount > 0
                ? `Pending (${pendingCount})`
                : f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-stone-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-display font-semibold text-stone-600">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {filter === "all" ? "Orders appear here instantly when customers place them" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg     = STATUS_CONFIG[order.status];
            const isNew   = order.id ? newOrderIds.has(order.id) : false;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all duration-500 ${
                  isNew
                    ? "border-orange-300 shadow-orange-100 ring-2 ring-orange-200"
                    : "border-stone-100"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-sm text-stone-900">{order.guest_name}</p>
                      {order.table_number && order.table_number !== "QR" && (
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                          Table {order.table_number}
                        </span>
                      )}
                      <span className="text-xs text-stone-400">· {order.member_count} pax</span>
                      {isNew && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.created_at ? timeAgo(order.created_at) : ""} · ₹{order.total}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-0.5 mb-3 bg-stone-50 rounded-xl p-2.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-stone-600">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="text-stone-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {cfg.next && cfg.nextLabel && (
                    <button
                      onClick={() => handleStatusChange(order, cfg.next!)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors ${cfg.nextColor}`}
                    >
                      {cfg.nextLabel}
                    </button>
                  )}
                  {(order.status === "pending" || order.status === "preparing") && (
                    <button
                      onClick={() => handleStatusChange(order, "cancelled")}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                    >
                      Cancel
                    </button>
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
