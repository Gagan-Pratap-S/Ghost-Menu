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

type Tab = "overview";

function StatCard({ value, label, sub, accent = "var(--gm-primary)" }: { value: string; label: string; sub?: string; accent?: string }) {
  return (
    <div className="gm-stat">
      <div className="gm-stat-value" style={{ color: accent }}>{value}</div>
      <div className="gm-stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--gm-text-tertiary)", marginTop: 2 }}>{sub}</div>}
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


  const handleUpdate = async (id: number, data: Partial<MenuItem>) => { await onUpdate(id, data); };
  const handleKitchenToggle = useCallback(() => {
    const next = kitchenStatus === "normal" ? "busy" : "normal";
    setKitchenStatus(next);
    if (restaurant?.id) updateKitchenStatus(restaurant.id, next === "busy");
  }, [kitchenStatus, restaurant?.id]);
  const handleLogout = async () => { await logout(); router.replace("/admin/login"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontSize: 17, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>{restaurant?.name ?? "Admin"}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)" }}>
                    {kitchenStatus === "normal" ? "Open" : "Busy"}
                  </span>
                  <button onClick={handleKitchenToggle}
                    style={{ position: "relative", width: 36, height: 20, borderRadius: 99, border: "none", cursor: "pointer", background: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute", top: 2, width: 16, height: 16, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s", left: kitchenStatus === "normal" ? "calc(100% - 18px)" : 2 }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginTop: 1 }}>{session?.user.email}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href={restaurant?.slug ? `/menu/${restaurant.slug}` : "#"}
                target="_blank" rel="noopener noreferrer"
                onClick={e => { if (!restaurant?.slug) e.preventDefault(); }}
                style={{ fontSize: 13, fontWeight: 500, color: restaurant?.slug ? "var(--gm-text-secondary)" : "var(--gm-disabled)", textDecoration: "none", padding: "6px 12px", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-surface)", cursor: restaurant?.slug ? "pointer" : "not-allowed" }}>
                Preview ↗
              </a>
              <a href="/admin/qr"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--gm-text-secondary)", textDecoration: "none", padding: "6px 12px", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-surface)" }}>
                QR
              </a>
              <button onClick={() => setShowLogoutConfirm(true)} className="gm-btn-danger">Sign out</button>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <a href="/admin/menu" style={{ flex: 1, textAlign: "center", padding: "7px 0", borderRadius: 9, border: "1px solid var(--gm-border)", fontSize: 13, fontWeight: 500, color: "var(--gm-text-secondary)", textDecoration: "none", background: "var(--gm-bg)" }}>Menu ({items.length})</a>
            <a href="/admin/orders" style={{ flex: 1, textAlign: "center", padding: "7px 0", borderRadius: 9, border: "1px solid var(--gm-border)", fontSize: 13, fontWeight: 500, color: "var(--gm-text-secondary)", textDecoration: "none", background: "var(--gm-bg)" }}>Live Orders</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 120px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0,1,2,3].map(i => <div key={i} className="animate-skeleton" style={{ height: 80, borderRadius: 20 }} />)}
          </div>
        ) : (
          <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Kitchen mode */}
            <div className="gm-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>Kitchen Mode</p>
                <p style={{ fontSize: 13, marginTop: 2, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", margin: 0 }}>
                  {kitchenStatus === "normal" ? "✅ All orders accepted" : "🔴 Busy — fast items prioritised"}
                </p>
              </div>
              <button onClick={handleKitchenToggle}
                style={{ position: "relative", width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", transition: "background 0.2s", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s", left: kitchenStatus === "normal" ? "calc(100% - 23px)" : 3 }} />
              </button>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <StatCard value={totalViews.toLocaleString()} label="Total Views" sub="all items" />
              <StatCard value={totalClicks.toLocaleString()} label="Total Clicks" accent="#3B82F6" sub="all items" />
              <StatCard value={`${avgCTR}%`} label="Avg CTR" accent="var(--gm-success)" sub="clicks / views" />
              <StatCard value={`${available}/${items.length}`} label="Available" accent="#8B5CF6" sub="menu items" />
            </div>

            {/* Top performers */}
            <div>
              <SectionLabel>🏆 Top Performers</SectionLabel>
              <div className="gm-card" style={{ overflow: "hidden", padding: 0 }}>
                {topPerformers.map((item, idx) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < topPerformers.length - 1 ? "1px solid var(--gm-border)" : "none" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gm-text-tertiary)", width: 16, flexShrink: 0 }}>#{idx + 1}</span>
                    <div style={{ position: "relative", width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--gm-bg)" }}>
                      <Image src={item.image} alt={item.name} fill sizes="36px" className="object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{item.clicks}c · {item.views}v</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 99, flexShrink: 0,
                      ...(item.profit_tag === "high" ? { background: "var(--gm-success-bg)", color: "#15803D", border: "1px solid var(--gm-success-border)" }
                        : item.profit_tag === "medium" ? { background: "var(--gm-warning-bg)", color: "#92400E", border: "1px solid var(--gm-warning-border)" }
                        : { background: "var(--gm-bg)", color: "var(--gm-text-secondary)", border: "1px solid var(--gm-border)" }) }}>
                      {item.profit_tag}
                    </span>
                    <button onClick={() => onUpdate(item.id, { available: !item.available })}
                      style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, cursor: "pointer", flexShrink: 0, border: "none",
                        ...(item.available ? { background: "var(--gm-success-bg)", color: "#15803D" } : { background: "var(--gm-danger-bg)", color: "#B91C1C" }) }}>
                      {item.available ? "avail" : "86'd"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {needsAttention.length > 0 && (
              <div>
                <SectionLabel>⚠️ Needs Attention</SectionLabel>
                <div style={{ background: "var(--gm-warning-bg)", border: "1px solid var(--gm-warning-border)", borderRadius: 20, padding: 16 }}>
                  <p style={{ fontSize: 13, color: "#92400E", fontWeight: 500, marginBottom: 8 }}>High views, low clicks — update image or name</p>
                  {needsAttention.slice(0, 4).map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#78350F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>{item.name}</span>
                      <span style={{ color: "#92400E", whiteSpace: "nowrap" }}>{item.views}v / {item.clicks}c</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {promoteItems.length > 0 && (
              <div>
                <SectionLabel>📈 Promote These</SectionLabel>
                <div style={{ background: "var(--gm-success-bg)", border: "1px solid var(--gm-success-border)", borderRadius: 20, padding: 16 }}>
                  <p style={{ fontSize: 13, color: "#15803D", fontWeight: 500, marginBottom: 8 }}>High-profit, low visibility — feature them</p>
                  {promoteItems.slice(0, 4).map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>{item.name}</span>
                      <span style={{ color: "#15803D" }} className="tabular-nums price">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminBottomNav restaurantId={restaurant?.id} />

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowLogoutConfirm(false)} />
          <div className="gm-card animate-slideUp" style={{ position: "relative", padding: 24, width: "100%", maxWidth: 320 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", marginBottom: 6 }}>Sign out?</p>
            <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginBottom: 20 }}>You'll need to sign in again to access the admin panel.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} className="gm-btn-secondary" style={{ flex: 1, height: 44 }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, height: 44, borderRadius: 14, border: "none", background: "var(--gm-danger)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminItemRow({ item, indicator, onEdit, onToggleAvailable, onToggleFeatured, onDelete }: {
  item: MenuItem;
  indicator: { label: string; suggestion: string } | null;
  onEdit: () => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ background: "var(--gm-surface)", border: "1px solid var(--gm-border)", borderRadius: 16, padding: 14, boxShadow: "var(--gm-shadow-sm)", opacity: item.available ? 1 : 0.55 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--gm-bg)" }}>
          <Image src={item.image} alt={item.name} fill sizes="52px" className="object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
          <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: 0 }} className="price tabular-nums">{formatPrice(item.price)} · {item.category}</p>
          <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{item.views}v · {item.clicks}c</p>
        </div>
        {indicator && (
          <span style={{ fontSize: 10, fontWeight: 500, color: "var(--gm-text-tertiary)", background: "var(--gm-bg)", border: "1px solid var(--gm-border)", borderRadius: 8, padding: "4px 8px", alignSelf: "flex-start", flexShrink: 0, maxWidth: 72, textAlign: "right", lineHeight: 1.3 }}>
            {indicator.label}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        <button onClick={onEdit} style={{ padding: "7px 0", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>✏️ Edit</button>
        <button onClick={onToggleAvailable} style={{ padding: "7px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer",
          ...(item.available ? { background: "var(--gm-success-bg)", color: "#15803D" } : { background: "var(--gm-danger-bg)", color: "#B91C1C" }) }}>
          {item.available ? "✓ Avail" : "✗ Sold"}
        </button>
        <button onClick={onToggleFeatured} style={{ padding: "7px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer",
          ...(item.featured ? { background: "#FFFBEB", color: "#92400E" } : { background: "var(--gm-bg)", color: "var(--gm-text-secondary)" }) }}>
          {item.featured ? "⭐ Feat" : "Feature"}
        </button>
        <button onClick={onDelete} style={{ padding: "7px 0", borderRadius: 10, border: "none", background: "var(--gm-danger-bg)", color: "#B91C1C", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>🗑</button>
      </div>
    </div>
  );
}
