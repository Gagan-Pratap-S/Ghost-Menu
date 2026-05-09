"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchOrderById, subscribeToOrder, Order, OrderStatus } from "@/lib/supabase";
import { formatPrice } from "@/lib/constants";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "var(--gm-border)" }}>
        <div style={{ height: "100%", borderRadius: 99, transition: "width 0.7s ease", width: `${pct}%`, background: status === "cancelled" ? "var(--gm-danger)" : "var(--gm-primary)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {STATUS_STEPS.map((s, i) => {
          const done = step >= i && status !== "cancelled";
          return (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <span style={{ fontSize: 20 }}>{done ? STEP_ICON[s] : "○"}</span>
              <span style={{ fontSize: 9, fontWeight: 600, textAlign: "center", lineHeight: 1.3, color: done ? "var(--gm-primary)" : "var(--gm-text-tertiary)" }}>
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
  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchOrderById(id).then(o => {
      if (o) setOrder(o); else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    return subscribeToOrder(id, updated => setOrder(updated));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gm-bg)" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (notFound || !order) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--gm-bg)" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", marginBottom: 6 }}>Order not found</p>
      <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginBottom: 24 }}>The order ID may be invalid or expired.</p>
      <a href="/" className="gm-btn-primary" style={{ textDecoration: "none", padding: "0 24px" }}>Back to Menu</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>Order Status</h1>
            {order.id && <p style={{ fontSize: 11, color: "var(--gm-text-tertiary)", margin: 0, fontFamily: "monospace" }}>#{order.id.slice(0, 8).toUpperCase()}</p>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gm-success)", animation: "urgencyPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gm-success)" }}>Live</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Status card */}
        <div className="gm-card" style={{ padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>{STEP_ICON[order.status]}</span>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--gm-text)", marginTop: 12, marginBottom: 4 }}>{STEP_LABEL[order.status]}</p>
            {order.table_number && order.table_number !== "QR" && (
              <p style={{ fontSize: 14, color: "var(--gm-text-secondary)" }}>Table {order.table_number}</p>
            )}
          </div>
          <ProgressBar status={order.status} />
        </div>

        {/* Order items */}
        <div className="gm-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--gm-text)", marginBottom: 12 }}>Your order</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--gm-text-secondary)" }}>{item.quantity}× {item.name}</span>
                <span style={{ color: "var(--gm-text-tertiary)" }} className="tabular-nums price">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, paddingTop: 10, borderTop: "1px solid var(--gm-border)", marginTop: 4 }}>
              <span style={{ fontWeight: 600, color: "var(--gm-text)" }}>Total</span>
              <span style={{ fontWeight: 700, color: "var(--gm-primary)" }} className="price tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Guest info */}
        <div className="gm-card" style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--gm-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Guest</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)" }}>{order.guest_name}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--gm-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Party</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)" }}>{order.member_count}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--gm-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Placed</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)" }}>
                {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", textAlign: "center" }}>This page updates live — no need to refresh</p>
      </div>
    </div>
  );
}
