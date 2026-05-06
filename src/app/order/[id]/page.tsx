"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchOrderById, subscribeToOrder, Order, OrderStatus } from "@/lib/supabase";

const STATUS_STEPS: OrderStatus[] = ["pending", "preparing", "ready", "served"];
const STEP_LABEL: Record<OrderStatus, string> = {
  pending:   "Order received",
  preparing: "Kitchen is preparing",
  ready:     "Ready to serve",
  served:    "Served! Enjoy 🎉",
  cancelled: "Cancelled",
};
const STEP_ICON: Record<OrderStatus, string> = {
  pending:   "📋", preparing: "👨‍🍳", ready: "✅", served: "🍽️", cancelled: "❌",
};

function ProgressBar({ status }: { status: OrderStatus }) {
  const step = STATUS_STEPS.indexOf(status);
  const total = STATUS_STEPS.length - 1;
  const pct = status === "cancelled" ? 0 : Math.round((step / total) * 100);

  return (
    <div className="space-y-3">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: status === "cancelled" ? "#ef4444" : "var(--brand,#f97316)" }} />
      </div>
      <div className="flex justify-between">
        {STATUS_STEPS.map((s, i) => {
          const done = step >= i && status !== "cancelled";
          return (
            <div key={s} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-base">{done ? STEP_ICON[s] : "○"}</span>
              <span className={`text-[9px] font-semibold text-center leading-tight ${done ? "text-orange-400" : "text-slate-700"}`}>
                {STEP_LABEL[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading]= useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchOrderById(id).then(o => {
      if (o) setOrder(o); else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  // Realtime status updates
  useEffect(() => {
    return subscribeToOrder(id, updated => setOrder(updated));
  }, [id]);

  const glass = { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg,#020617)" }}>
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--color-bg,#020617)" }}>
      <p className="text-4xl mb-3">🔍</p>
      <p className="font-display font-bold text-white text-lg">Order not found</p>
      <p className="text-slate-500 text-sm mt-1">The order ID may be invalid or expired.</p>
      <a href="/" className="mt-6 btn-primary px-6 py-2.5 text-sm inline-block text-center">Back to Menu</a>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg,#020617)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
      </div>

      <header className="sticky top-0 z-10" style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="font-display font-bold text-white text-base tracking-tight">Order Status</h1>
            {order.id && <p className="text-xs text-slate-600 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>}
          </div>
          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">Live</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4 relative z-10">
        {/* Status card */}
        <div className="rounded-3xl p-6 space-y-5" style={glass}>
          <div className="text-center">
            <span className="text-5xl">{STEP_ICON[order.status]}</span>
            <p className="font-display font-bold text-white text-xl mt-3 tracking-tight">{STEP_LABEL[order.status]}</p>
            {order.table_number && order.table_number !== "QR" && (
              <p className="text-slate-500 text-sm mt-1">Table {order.table_number}</p>
            )}
          </div>
          <ProgressBar status={order.status} />
        </div>

        {/* Order items */}
        <div className="rounded-2xl p-4 space-y-2" style={glass}>
          <p className="font-display font-semibold text-white text-sm mb-3">Your order</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-slate-300">{item.quantity}× {item.name}</span>
              <span className="text-slate-500 tabular-nums price">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="font-display font-bold text-white">Total</span>
            <span className="font-display font-bold text-orange-400 tabular-nums price">₹{order.total}</span>
          </div>
        </div>

        {/* Guest info */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-600 mb-1">Guest</p>
              <p className="text-sm font-semibold text-white">{order.guest_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Party</p>
              <p className="text-sm font-semibold text-white">{order.member_count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Placed</p>
              <p className="text-sm font-semibold text-white">
                {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 text-center">This page updates live — no need to refresh</p>
      </div>
    </div>
  );
}
