"use client";

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

function StatCard({ value, label, sub, color = "text-orange-500" }: { value: string; label: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-semibold text-stone-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard({ items, loading, restaurant, onAdd, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const { logout, session } = useAuth();

  const [tab, setTab]                     = useState<Tab>("overview");
  const [searchTerm, setSearchTerm]       = useState("");
  const [kitchenStatus, setKitchenStatus] = useState<"normal" | "busy">("normal");
  const [editingItem, setEditingItem]     = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
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
    return items.filter(i =>
      i.name.toLowerCase().includes(t) ||
      i.category.toLowerCase().includes(t) ||
      i.description.toLowerCase().includes(t)
    );
  }, [items, searchTerm]);

  const handleUpdate = async (id: number, data: Partial<MenuItem>) => {
    await onUpdate(id, data);
    setEditingItem(null);
  };

  const handleAdd = async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => {
    await onAdd(data);
    setShowAddForm(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-lg font-bold text-stone-900">
                {restaurant?.name ?? "Admin"}
              </h1>
              <p className="text-xs text-stone-400">{session?.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/menu/${restaurant?.slug ?? "cafe-delight"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview
              </a>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-xs font-semibold text-red-500 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-stone-100 rounded-xl p-1">
            {(["overview", "items", "orders"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {t === "overview" ? "📊 Overview" : t === "items" ? `🍽️ Menu (${items.length})` : "📋 Orders"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-stone-100 animate-pulse" />)}
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Kitchen mode */}
            <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm text-stone-900">Kitchen Mode</p>
                <p className={`text-xs mt-0.5 ${kitchenStatus === "normal" ? "text-emerald-600" : "text-red-500"}`}>
                  {kitchenStatus === "normal" ? "✅ All orders accepted" : "🔴 Busy — fast items prioritised"}
                </p>
              </div>
              <button
                onClick={() => setKitchenStatus(s => s === "normal" ? "busy" : "normal")}
                className={`relative w-12 h-6 rounded-full transition-colors ${kitchenStatus === "normal" ? "bg-emerald-500" : "bg-red-400"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${kitchenStatus === "normal" ? "left-6" : "left-0.5"}`} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={totalViews.toLocaleString()} label="Total Views" sub="all items" />
              <StatCard value={totalClicks.toLocaleString()} label="Total Clicks" color="text-blue-500" sub="all items" />
              <StatCard value={`${avgCTR}%`} label="Avg CTR" color="text-emerald-600" sub="clicks / views" />
              <StatCard value={`${available}/${items.length}`} label="Available" color="text-violet-500" sub="menu items" />
            </div>

            {/* Top Performers */}
            <div>
              <h2 className="font-display text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">🏆 Top Performers</h2>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-50">
                {topPerformers.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-stone-300 w-4 flex-shrink-0">#{idx + 1}</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="32px" className="object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400">{item.clicks} clicks · {item.views} views</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.profit_tag === "high" ? "bg-emerald-100 text-emerald-700" :
                      item.profit_tag === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-stone-100 text-stone-500"
                    }`}>{item.profit_tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {needsAttention.length > 0 && (
              <div>
                <h2 className="font-display text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">⚠️ Needs Attention</h2>
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 space-y-2">
                  <p className="text-xs text-amber-700 font-medium">High views, low clicks — update image or name</p>
                  {needsAttention.slice(0, 4).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-medium text-amber-900 truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-amber-600 whitespace-nowrap">{item.views}v / {item.clicks}c</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {promoteItems.length > 0 && (
              <div>
                <h2 className="font-display text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">📈 Promote These</h2>
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 space-y-2">
                  <p className="text-xs text-emerald-700 font-medium">High-profit, low visibility — feature them</p>
                  {promoteItems.slice(0, 4).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-medium text-emerald-900 truncate flex-1 mr-2">{item.name}</span>
                      <span className="text-emerald-600">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : tab === "items" ? (
          /* ─── Items Tab ─── */
          <div className="space-y-3 animate-fadeIn">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 pl-8 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-base">×</button>
                )}
              </div>
              <button
                onClick={() => { setShowAddForm(true); setEditingItem(null); }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
              >
                <span className="text-sm leading-none">+</span> Add Dish
              </button>
            </div>

            {searchTerm && (
              <p className="text-xs text-stone-400">{filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}</p>
            )}

            {showAddForm && (
              <ItemForm mode="add" onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
            )}

            {filteredItems.map(item => (
              <div key={item.id}>
                {editingItem?.id === item.id ? (
                  <ItemForm
                    mode="edit"
                    item={editingItem}
                    onSave={(data) => handleUpdate(item.id, data)}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <AdminItemRow
                    item={item}
                    indicator={indicators[item.id]}
                    onEdit={() => setEditingItem(item)}
                    onToggleAvailable={() => onUpdate(item.id, { available: !item.available })}
                    onToggleFeatured={() => onUpdate(item.id, { featured: !item.featured })}
                    onDelete={() => setDeleteConfirm(item.id)}
                  />
                )}

                {deleteConfirm === item.id && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-2xl p-4 animate-slideUp">
                    <p className="text-sm font-semibold text-red-800 mb-1">Delete "{item.name}"?</p>
                    <p className="text-xs text-red-500 mb-3">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50">
                        Cancel
                      </button>
                      <button onClick={async () => { await onDelete(item.id); setDeleteConfirm(null); }}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredItems.length === 0 && !showAddForm && (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">🔍</p>
                <p className="font-display font-semibold text-stone-600">No items found</p>
              </div>
            )}
          </div>
        ) : (
          /* ─── Orders Tab ─── */
          restaurant?.id ? (
            <OrdersTab restaurantId={restaurant.id} />
          ) : (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">📋</p>
              <p className="font-display font-semibold text-stone-600">Connect Supabase to view orders</p>
            </div>
          )
        )}
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-slideUp">
            <p className="font-display font-bold text-stone-900 mb-1">Sign out?</p>
            <p className="text-xs text-stone-500 mb-4">You'll need to sign in again to access the admin panel.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminItemRow({
  item, indicator, onEdit, onToggleAvailable, onToggleFeatured, onDelete
}: {
  item: MenuItem;
  indicator: { label: string; suggestion: string } | null;
  onEdit: () => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-3 transition-opacity ${!item.available ? "opacity-50" : ""} border-stone-100`}>
      <div className="flex gap-3 mb-2.5">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
          <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-stone-900 truncate">{item.name}</p>
          <p className="text-xs text-stone-400">₹{item.price} · {item.category}</p>
          <p className="text-xs text-stone-400">{item.views}v · {item.clicks}c</p>
        </div>
        {indicator && (
          <span className="text-[10px] font-semibold text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-1.5 py-1 self-start text-right leading-tight max-w-[72px]">
            {indicator.label}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={onEdit}
          className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors">
          ✏️ Edit
        </button>
        <button onClick={onToggleAvailable}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            item.available ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200"
          }`}>
          {item.available ? "✓ Avail" : "✗ Sold"}
        </button>
        <button onClick={onToggleFeatured}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            item.featured ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}>
          {item.featured ? "⭐ Feat" : "Feature"}
        </button>
        <button onClick={onDelete}
          className="py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors">
          🗑
        </button>
      </div>
    </div>
  );
}
