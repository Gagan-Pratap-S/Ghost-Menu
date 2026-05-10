"use client";

import { FALLBACK_IMAGE } from "@/lib/constants";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MenuItem } from "@/data/menuData";
import { Restaurant, updateKitchenStatus } from "@/lib/supabase";
import { formatPrice } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useRuleEngine } from "@/hooks/useRuleEngine";
import AdminBottomNav from "@/components/navigation/AdminBottomNav";

interface Props {
  items: MenuItem[];
  loading: boolean;
  restaurant: Restaurant | null;
  onAdd: (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => Promise<void>;
  onUpdate: (id: number, data: Partial<MenuItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

// Matching JSX tint cards with icon + trend
function MetricCard({ label, value, trend, sub, tint, icon }: {
  label: string; value: string; trend?: string; sub?: string; tint: string; icon: string;
}) {
  return (
    <div style={{ background: tint, borderRadius: 24, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--gm-text)", margin: "0 0 4px", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</p>
          {trend && <p style={{ fontSize: 11, color: "var(--gm-success)", fontWeight: 600, margin: 0 }}>↑ {trend}</p>}
          {sub && <p style={{ fontSize: 11, color: "var(--gm-text-secondary)", margin: 0 }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 24, opacity: 0.45 }}>{icon}</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gm-text-tertiary)", marginBottom: 10 }}>{children}</h2>;
}

export default function AdminDashboard({ items, loading, restaurant, onAdd, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const { logout, session } = useAuth();

  const [kitchenStatus, setKitchenStatus]         = useState<"normal" | "busy">("normal");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { getQualityIndicators } = useRuleEngine();
  const indicators = useMemo(() => getQualityIndicators(items), [items, getQualityIndicators]);

  const totalViews     = useMemo(() => items.reduce((s, i) => s + i.views, 0), [items]);
  const totalClicks    = useMemo(() => items.reduce((s, i) => s + i.clicks, 0), [items]);
  const avgCTR         = useMemo(() => totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0", [totalViews, totalClicks]);
  const available      = useMemo(() => items.filter(i => i.available).length, [items]);
  const topPerformers  = useMemo(() => [...items].sort((a, b) => b.clicks - a.clicks).slice(0, 5), [items]);
  const needsAttention = useMemo(() => items.filter(i => i.views > 100 && i.clicks / i.views < 0.15), [items]);
  const promoteItems   = useMemo(() => items.filter(i => i.profit_tag === "high" && i.views < 50), [items]);

  const handleKitchenToggle = useCallback(() => {
    const next = kitchenStatus === "normal" ? "busy" : "normal";
    setKitchenStatus(next);
    if (restaurant?.id) updateKitchenStatus(restaurant.id, next === "busy");
  }, [kitchenStatus, restaurant?.id]);

  const handleLogout = async () => { await logout(); router.replace("/admin/login"); };

  // Metrics matching JSX AdminDashboard
  const metrics = [
    { label: "Total Views", value: totalViews.toLocaleString(), trend: "+12%", tint: "var(--gm-tint-orange)", icon: "📦" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), trend: "+18%", tint: "var(--gm-tint-pink)", icon: "💰" },
    { label: "Active Menu", value: String(available), sub: "Dishes", tint: "var(--gm-tint-yellow)", icon: "🍽️" },
    { label: "Avg CTR", value: `${avgCTR}%`, trend: `${items.length} items`, tint: "var(--gm-tint-green)", icon: "👥" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      {/* ── Header matching JSX admin header ── */}
      <header style={{ position: "relative", background: "transparent", borderBottom: "none", boxShadow: "none" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--gm-text)", margin: "0 0 2px" }}>Dashboard</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>👋</span>
                <span style={{ fontSize: 13, color: "var(--gm-text-secondary)" }}>
                  Welcome back, {restaurant?.name ?? "Admin"}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: "2px 0 0" }}>Here&apos;s what&apos;s happening today.</p>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="gm-btn-danger" style={{ height: 36, fontSize: 12, padding: "0 14px", borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--gm-danger)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 120px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0,1,2,3].map(i => <div key={i} className="animate-skeleton" style={{ height: 80, borderRadius: 20 }} />)}
          </div>
        ) : (
          <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Kitchen mode card */}
            <div className="gm-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>Kitchen Mode</p>
                <p style={{ fontSize: 13, marginTop: 2, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", margin: 0 }}>
                  {kitchenStatus === "normal" ? "✅ All orders accepted" : "🔴 Busy — fast items prioritised"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)" }}>
                  {kitchenStatus === "normal" ? "Open" : "Busy"}
                </span>
                <button onClick={handleKitchenToggle}
                  style={{ position: "relative", width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", transition: "background 0.2s", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 3, width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s", left: kitchenStatus === "normal" ? "calc(100% - 23px)" : 3 }} />
                </button>
              </div>
            </div>

            {/* Metrics grid — pastel tint cards like JSX */}
            <div>
              <SectionLabel>📊 Today&apos;s Overview</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {metrics.map(m => (
                  <MetricCard key={m.label} {...m} />
                ))}
              </div>
            </div>

            {/* Top performers — matching JSX popular dishes style */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionLabel>🏆 Popular Dishes</SectionLabel>
                <a href="/admin/menu" style={{ fontSize: 13, color: "var(--gm-primary)", fontWeight: 600, textDecoration: "none" }}>View All</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topPerformers.slice(0, 3).map((item, idx) => (
                  <div key={item.id} style={{
                    background: "var(--gm-surface)",
                    borderRadius: 18,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "var(--gm-shadow-md)",
                    border: "1px solid var(--gm-border)",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gm-text-tertiary)", width: 16, flexShrink: 0 }}>#{idx + 1}</span>
                    <div style={{ position: "relative", width: 48, height: 48, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--gm-bg)" }}>
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h4>
                      <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: 0 }}>{item.clicks} orders</p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gm-text)", flexShrink: 0 }}>{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs attention */}
            {needsAttention.length > 0 && (
              <div>
                <SectionLabel>⚠️ Low CTR — Consider Promoting</SectionLabel>
                <div className="gm-card" style={{ overflow: "hidden", padding: 0 }}>
                  {needsAttention.slice(0, 3).map((item, idx) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < needsAttention.length - 1 ? "1px solid var(--gm-border)" : "none" }}>
                      <span style={{ fontSize: 12, color: "var(--gm-text-tertiary)", width: 16 }}>#{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: "var(--gm-text-secondary)", margin: 0 }}>{item.views} views · {item.clicks} clicks</p>
                      </div>
                      <a href="/admin/menu" style={{ fontSize: 12, fontWeight: 600, color: "var(--gm-primary)", textDecoration: "none", background: "var(--gm-tint-orange)", padding: "4px 10px", borderRadius: 99 }}>Edit</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview link */}
            {restaurant?.slug && (
              <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: "var(--gm-radius-lg)", border: "1px dashed var(--gm-border)", background: "var(--gm-surface)", color: "var(--gm-text-secondary)", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Preview menu ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="animate-fadeIn">
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowLogoutConfirm(false)} />
          <div style={{ position: "relative", background: "var(--gm-surface)", borderRadius: "var(--gm-radius-xl)", padding: 28, maxWidth: 320, width: "100%", boxShadow: "var(--gm-shadow-xl)" }} className="animate-slideUp">
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", marginBottom: 8 }}>Sign out?</p>
            <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginBottom: 24 }}>You&apos;ll need to log back in to access the admin panel.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} className="gm-btn-ghost" style={{ flex: 1, height: 44 }}>Cancel</button>
              <button onClick={handleLogout} className="gm-btn-danger" style={{ flex: 1, height: 44 }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav restaurantId={restaurant?.id} />
    </div>
  );
}
