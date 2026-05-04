"use client";

import { FALLBACK_IMAGE } from "@/lib/constants";
import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MenuItem } from "@/data/menuData";
import { Restaurant } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRuleEngine } from "@/hooks/useRuleEngine";
import ItemForm from "./ItemForm";
import OrdersTab from "./OrdersTab";

interface Props {
  items: MenuItem[];
  loading: boolean;
  restaurant: Restaurant | null;
  onAdd: (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => Promise<void>;
  onUpdate: (id: number, data: Partial<MenuItem>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

type Tab = "overview" | "items" | "orders";

// ─── Reusable primitives ──────────────────────────────────────────────────────
const glass     = { background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" };
const glassHard = { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)" };
const divider   = { borderColor: "rgba(255,255,255,0.05)" };

function StatCard({ value, label, sub, color = "#f97316" }: { value: string; label: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-4" style={glass}>
      <p className="font-display text-2xl font-extrabold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold text-white mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">{children}</h2>;
}

export default function AdminDashboard({ items, loading, restaurant, onAdd, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const { logout, session } = useAuth();

  const [tab, setTab]                       = useState<Tab>("overview");
  const [searchTerm, setSearchTerm]         = useState("");
  const [kitchenStatus, setKitchenStatus]   = useState<"normal" | "busy">("normal");
  const [editingItem, setEditingItem]       = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { getQualityIndicators } = useRuleEngine();
  const indicators = useMemo(() => getQualityIndicators(items), [items, getQualityIndicators]);

  const totalViews  = useMemo(() => items.reduce((s, i) => s + i.views, 0), [items]);
  const totalClicks = useMemo(() => items.reduce((s, i) => s + i.clicks, 0), [items]);
  const avgCTR      = useMemo(() => totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0", [totalViews, totalClicks]);
  const available   = useMemo(() => items.filter(i => i.available).length, [items]);
  const topPerformers  = useMemo(() => [...items].sort((a, b) => b.clicks - a.clicks).slice(0, 5), [items]);
  const needsAttention = useMemo(() => items.filter(i => i.views > 100 && i.clicks / i.views < 0.15), [items]);
  const promoteItems   = useMemo(() => items.filter(i => i.profit_tag === "high" && i.views < 50), [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const t = searchTerm.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(t) || i.category.toLowerCase().includes(t));
  }, [items, searchTerm]);

  const handleUpdate = async (id: number, data: Partial<MenuItem>) => { await onUpdate(id, data); setEditingItem(null); };
  const handleAdd    = async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => { await onAdd(data); setShowAddForm(false); };
  const handleLogout = async () => { await logout(); router.replace("/admin/login"); };

  const tabConfig = [
    { key: "overview" as Tab, label: "Overview",         icon: "📊" },
    { key: "items"    as Tab, label: `Menu (${items.length})`, icon: "🍽️" },
    { key: "orders"   as Tab, label: "Orders",            icon: "📋" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-0 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-extrabold text-lg text-white tracking-tight">{restaurant?.name ?? "Admin"}</h1>
              <p className="text-xs text-slate-600">{session?.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/menu/${restaurant?.slug ?? "cafe-delight"}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview
              </a>
              <a href="/admin/qr"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3zm2 2v3h3V5zm8-2h7v7h-7zm2 2v3h3V5zM3 13h7v7H3zm2 2v3h3v-3zm11-2h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2z"/>
                </svg>
                QR
              </a>
              <button onClick={() => setShowLogoutConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}
              >Sign out</button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {tabConfig.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize flex items-center justify-center gap-1"
                style={tab === t.key
                  ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }
                  : { color: "#64748b" }
                }
              >
                <span>{t.icon}</span>
                <span className="hidden xs:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={glass} />)}
          </div>
        ) : tab === "overview" ? (
          /* ─── Overview ─── */
          <div className="space-y-4 animate-fadeIn">
            {/* Kitchen mode */}
            <div className="rounded-2xl p-4 flex items-center justify-between" style={glass}>
              <div>
                <p className="font-display font-bold text-sm text-white">Kitchen Mode</p>
                <p className="text-xs mt-0.5" style={{ color: kitchenStatus === "normal" ? "#4ade80" : "#f87171" }}>
                  {kitchenStatus === "normal" ? "✅ All orders accepted" : "🔴 Busy — fast items prioritised"}
                </p>
              </div>
              <button onClick={() => setKitchenStatus(s => s === "normal" ? "busy" : "normal")}
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{ background: kitchenStatus === "normal" ? "#22c55e" : "#ef4444", boxShadow: kitchenStatus === "normal" ? "0 0 12px rgba(34,197,94,0.3)" : "none" }}
              >
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: kitchenStatus === "normal" ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={totalViews.toLocaleString()} label="Total Views" sub="all items" />
              <StatCard value={totalClicks.toLocaleString()} label="Total Clicks" color="#60a5fa" sub="all items" />
              <StatCard value={`${avgCTR}%`} label="Avg CTR" color="#4ade80" sub="clicks / views" />
              <StatCard value={`${available}/${items.length}`} label="Available" color="#c084fc" sub="menu items" />
            </div>

            {/* Top performers */}
            <div>
              <SectionLabel>🏆 Top Performers</SectionLabel>
              <div className="rounded-2xl overflow-hidden" style={glass}>
                {topPerformers.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: idx < topPerformers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span className="text-xs font-bold text-slate-700 w-4 flex-shrink-0">#{idx + 1}</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "rgba(30,41,59,0.8)" }}>
                      <Image src={item.image} alt={item.name} fill sizes="32px" className="object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-600">{item.clicks}c · {item.views}v</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={item.profit_tag === "high"
                        ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                        : item.profit_tag === "medium"
                          ? { background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }
                          : { background: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }
                      }
                    >{item.profit_tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {needsAttention.length > 0 && (
              <div>
                <SectionLabel>⚠️ Needs Attention</SectionLabel>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.12)" }}>
                  <p className="text-xs text-yellow-600 font-medium">High views, low clicks — update image or name</p>
                  {needsAttention.slice(0, 4).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-medium text-yellow-200/70 truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-yellow-600 whitespace-nowrap">{item.views}v / {item.clicks}c</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {promoteItems.length > 0 && (
              <div>
                <SectionLabel>📈 Promote These</SectionLabel>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-xs text-emerald-600 font-medium">High-profit, low visibility — feature them</p>
                  {promoteItems.slice(0, 4).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-medium text-emerald-200/70 truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-emerald-600 tabular-nums">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : tab === "items" ? (
          /* ─── Items ─── */
          <div className="space-y-3 animate-fadeIn">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" placeholder="Search items…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 pl-8 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                  style={glassHard}
                  onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
                  onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 text-base">×</button>}
              </div>
              <button onClick={() => { setShowAddForm(true); setEditingItem(null); }}
                className="btn-primary px-4 py-2.5 text-xs whitespace-nowrap flex items-center gap-1.5"
              >
                <span className="text-sm leading-none">+</span> Add Dish
              </button>
            </div>

            {searchTerm && <p className="text-xs text-slate-600">{filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}</p>}

            {showAddForm && <ItemForm mode="add" onSave={handleAdd} onCancel={() => setShowAddForm(false)} />}

            {filteredItems.map(item => (
              <div key={item.id}>
                {editingItem?.id === item.id ? (
                  <ItemForm mode="edit" item={editingItem} onSave={data => handleUpdate(item.id, data)} onCancel={() => setEditingItem(null)} />
                ) : (
                  <AdminItemRow item={item} indicator={indicators[item.id]}
                    onEdit={() => setEditingItem(item)}
                    onToggleAvailable={() => onUpdate(item.id, { available: !item.available })}
                    onToggleFeatured={() => onUpdate(item.id, { featured: !item.featured })}
                    onDelete={() => setDeleteConfirm(item.id)}
                  />
                )}
                {deleteConfirm === item.id && (
                  <div className="mt-2 rounded-2xl p-4 animate-slideUp" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p className="text-sm font-semibold text-white mb-1">Delete "{item.name}"?</p>
                    <p className="text-xs text-red-400 mb-3">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >Cancel</button>
                      <button onClick={async () => { await onDelete(item.id); setDeleteConfirm(null); }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                        style={{ background: "#ef4444" }}
                      >Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredItems.length === 0 && !showAddForm && (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">🔍</p>
                <p className="font-display font-semibold text-white">No items found</p>
              </div>
            )}
          </div>
        ) : (
          /* ─── Orders ─── */
          restaurant?.id
            ? <OrdersTab restaurantId={restaurant.id} />
            : (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">📋</p>
                <p className="font-display font-semibold text-white">Connect Supabase to view orders</p>
              </div>
            )
        )}
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-slideUp" style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="font-display font-bold text-white mb-1">Sign out?</p>
            <p className="text-xs text-slate-500 mb-4">You'll need to sign in again to access the admin panel.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >Cancel</button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
                style={{ background: "#ef4444" }}
              >Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Item Row ────────────────────────────────────────────────────────────
function AdminItemRow({ item, indicator, onEdit, onToggleAvailable, onToggleFeatured, onDelete }: {
  item: MenuItem;
  indicator: { label: string; suggestion: string } | null;
  onEdit: () => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-2xl p-3 transition-opacity ${!item.available ? "opacity-50" : ""}`}
      style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex gap-3 mb-2.5">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "rgba(30,41,59,0.8)" }}>
          <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-white truncate tracking-tight">{item.name}</p>
          <p className="text-xs text-slate-600 price tabular-nums">₹{item.price} · {item.category}</p>
          <p className="text-xs text-slate-700">{item.views}v · {item.clicks}c</p>
        </div>
        {indicator && (
          <span className="text-[10px] font-semibold text-slate-500 rounded-lg px-1.5 py-1 self-start text-right leading-tight max-w-[72px] flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >{indicator.label}</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "✏️ Edit",  onClick: onEdit,            active: false,       activeStyle: "", inactiveStyle: "rgba(255,255,255,0.05)" },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick}
            className="py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            style={{ background: btn.inactiveStyle, border: "1px solid rgba(255,255,255,0.06)" }}
          >{btn.label}</button>
        ))}
        <button onClick={onToggleAvailable}
          className="py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={item.available
            ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }
            : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }
          }
        >{item.available ? "✓ Avail" : "✗ Sold"}</button>
        <button onClick={onToggleFeatured}
          className="py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={item.featured
            ? { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }
          }
        >{item.featured ? "⭐ Feat" : "Feature"}</button>
        <button onClick={onDelete}
          className="py-1.5 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}
        >🗑</button>
      </div>
    </div>
  );
}
