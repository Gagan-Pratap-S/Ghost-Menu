"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OrdersTab from "@/components/admin/OrdersTab";
import AdminBottomNav from "@/components/navigation/AdminBottomNav";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gm-bg)" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { session, restaurant, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!session) { router.replace("/admin/login"); return; }
    if (!restaurant) { router.replace("/onboard"); return; }
  }, [session, restaurant, authLoading, router]);

  if (authLoading || !session) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", textDecoration: "none", flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>Live Orders</h1>
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{restaurant?.name} · Updates in real-time</p>
          </div>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "var(--gm-success-bg)", border: "1px solid var(--gm-success-border)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gm-success)", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)", animation: "urgencyPulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#15803D" }}>Live</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto", paddingBottom: 120 }}>
        {restaurant?.id ? (
          <OrdersTab restaurantId={restaurant.id} />
        ) : (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", marginBottom: 8 }}>Connect Supabase</p>
            <p style={{ fontSize: 14, color: "var(--gm-text-secondary)" }}>Add your Supabase credentials to see live orders.</p>
          </div>
        )}
      </div>

      <AdminBottomNav restaurantId={restaurant?.id} />
    </div>
  );
}
