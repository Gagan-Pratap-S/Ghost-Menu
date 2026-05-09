"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { fetchTableOrders, Order, isSupabaseConfigured } from "@/lib/supabase";
import { LS, formatPrice } from "@/lib/constants";
import BottomNav from "./BottomNav";
import CartModal from "@/components/customer/CartModal";

// ─── SVG Icons (inline, no external dep) ─────────────────────────────────────
function IconMenu() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
function IconCart() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconOrders() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export type CustomerTab = "menu" | "cart" | "orders";

interface Props {
  restaurantId?: string;
  guestName?: string;
  memberCount?: number;
  tableNumber?: string;
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}

const STATUS_COLOR: Record<string, string> = {
  pending:   "#F59E0B",
  preparing: "#3B82F6",
  ready:     "#22C55E",
  served:    "#8B5CF6",
  cancelled: "#EF4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Received", preparing: "Cooking…", ready: "Ready! 🎉", served: "Served", cancelled: "Cancelled",
};

// ─── Orders Panel ─────────────────────────────────────────────────────────────
function OrdersPanel({ restaurantId, tableNumber }: { restaurantId?: string; tableNumber?: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId || !tableNumber || tableNumber === "QR") {
      setLoading(false);
      return;
    }
    fetchTableOrders(restaurantId, tableNumber)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [restaurantId, tableNumber]);

  if (!isSupabaseConfigured) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Connect Supabase</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Add your Supabase credentials to track orders live.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-skeleton" style={{ height: 84, borderRadius: 20 }} />
        ))}
      </div>
    );
  }

  if (!tableNumber || tableNumber === "QR") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🪑</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>No table selected</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Scan the QR code on your table to track orders.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>No orders yet</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Your Table {tableNumber} orders will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
        Table {tableNumber} · Last 2 hours
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.map(order => (
          <button
            key={order.id}
            onClick={() => order.id && router.push(`/order/${order.id}`)}
            style={{
              width: "100%", textAlign: "left", background: "#FFFFFF",
              border: "1px solid #E5E7EB", borderRadius: 20, padding: "14px 16px",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 12,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#F97316"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; }}
          >
            {/* Status dot */}
            <span style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: STATUS_COLOR[order.status] ?? "#9CA3AF",
              boxShadow: `0 0 0 3px ${(STATUS_COLOR[order.status] ?? "#9CA3AF")}22`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", fontFamily: "monospace" }}>
                  #{(order.id ?? "").slice(0, 8).toUpperCase()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F97316" }} className="price tabular-nums">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLOR[order.status] ?? "#9CA3AF" }}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                  {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {order.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}
              </p>
            </div>
            <svg width="14" height="14" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main CustomerBottomNav ───────────────────────────────────────────────────
export default function CustomerBottomNav({
  restaurantId, guestName, memberCount, tableNumber,
  activeTab, onTabChange,
}: Props) {
  const { totalItems, totalPrice } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const handleTabChange = useCallback((tab: CustomerTab) => {
    if (tab === "cart") {
      setCartOpen(true);
    } else {
      onTabChange(tab);
    }
  }, [onTabChange]);

  const tabs = [
    {
      key: "menu",
      label: "Menu",
      icon: <IconMenu />,
      active: activeTab === "menu",
      onClick: () => handleTabChange("menu"),
    },
    {
      key: "cart",
      label: "Cart",
      icon: <IconCart />,
      badge: totalItems > 0 ? totalItems : undefined,
      active: cartOpen,
      onClick: () => handleTabChange("cart"),
    },
    {
      key: "orders",
      label: "Orders",
      icon: <IconOrders />,
      active: activeTab === "orders",
      onClick: () => handleTabChange("orders"),
    },
  ];

  return (
    <>
      <BottomNav tabs={tabs} />

      {/* Cart modal */}
      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurantId={restaurantId}
        guestName={guestName}
        memberCount={memberCount}
        tableNumber={tableNumber}
      />

      {/* Orders slide-up panel */}
      {activeTab === "orders" && (
        <div
          className="animate-slideUp"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            pointerEvents: "none",
          }}
        >
          {/* Backdrop */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", pointerEvents: "all" }}
            onClick={() => onTabChange("menu")}
          />

          {/* Panel */}
          <div
            style={{
              position: "relative",
              background: "#F7F5F0",
              borderRadius: "28px 28px 0 0",
              maxHeight: "75vh",
              overflowY: "auto",
              paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
              pointerEvents: "all",
            }}
          >
            {/* Drag handle */}
            <div style={{ textAlign: "center", paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D1D5DB", display: "inline-block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 16px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Your Orders</h2>
              <button
                onClick={() => onTabChange("menu")}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
              >×</button>
            </div>
            <OrdersPanel restaurantId={restaurantId} tableNumber={tableNumber} />
          </div>
        </div>
      )}
    </>
  );
}
