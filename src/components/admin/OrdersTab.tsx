"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOrders, updateOrderStatus, Order, OrderStatus } from "@/lib/supabase";

interface Props {
  restaurantId: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; next: OrderStatus | null }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700 border-yellow-200", next: "preparing" },
  preparing:  { label: "Preparing",  color: "bg-blue-100 text-blue-700 border-blue-200",       next: "done" },
  done:       { label: "Done",       color: "bg-emerald-100 text-emerald-700 border-emerald-200", next: null },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-500 border-red-200",          next: null },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function OrdersTab({ restaurantId }: Props) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<OrderStatus | "all">("all");

  const load = useCallback(async () => {
    const data = await fetchOrders(restaurantId);
    setOrders(data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const handleStatusChange = async (order: Order, next: OrderStatus) => {
    if (!order.id) return;
    // Optimistic
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    const ok = await updateOrderStatus(order.id, next);
    if (!ok) setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pending  = orders.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "pending", "preparing", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
              filter === f ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
            }`}
          >
            {f === "all" ? `All (${orders.length})` : f === "pending" ? `Pending${pending > 0 ? ` (${pending})` : ""}` : f}
          </button>
        ))}
        <button onClick={load}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-500 hover:border-stone-400 transition-all ml-auto"
        >↻ Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-stone-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-display font-semibold text-stone-600">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </p>
          <p className="text-xs text-stone-400 mt-1">Orders appear here as customers place them</p>
        </div>
      ) : (
        filtered.map(order => {
          const cfg  = STATUS_CONFIG[order.status];
          const next = cfg.next;
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-stone-900">{order.guest_name}</p>
                    <span className="text-xs text-stone-400">· {order.member_count} pax</span>
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
              <div className="space-y-1 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-stone-600">
                    <span>{item.quantity}× {item.name}</span>
                    <span className="text-stone-400">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Action */}
              {next && (
                <button
                  onClick={() => handleStatusChange(order, next)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                    next === "preparing"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {next === "preparing" ? "Mark as Preparing →" : "Mark as Done ✓"}
                </button>
              )}
              {order.status !== "cancelled" && order.status !== "done" && (
                <button
                  onClick={() => handleStatusChange(order, "cancelled")}
                  className="w-full mt-1.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
