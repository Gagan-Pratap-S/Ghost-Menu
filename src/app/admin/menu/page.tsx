"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import {
  fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem,
} from "@/lib/supabase";
import { FALLBACK_IMAGE, formatPrice } from "@/lib/constants";
import { useRuleEngine } from "@/hooks/useRuleEngine";
import ItemForm from "@/components/admin/ItemForm";
import AdminBottomNav from "@/components/navigation/AdminBottomNav";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gm-bg)" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );
}

export default function AdminMenuPage() {
  const router = useRouter();
  const { session, restaurant, loading: authLoading } = useAuth();

  const [items, setItems]             = useState<MenuItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm]   = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { getQualityIndicators } = useRuleEngine();
  const indicators = useMemo(() => getQualityIndicators(items), [items, getQualityIndicators]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { router.replace("/admin/login"); return; }
    if (!restaurant) { router.replace("/onboard"); return; }
  }, [session, restaurant, authLoading, router]);

  useEffect(() => {
    if (!session || !restaurant?.id) return;
    setDataLoading(true);
    fetchMenuItems(restaurant.id)
      .then(data => { if (data && data.length > 0) setItems(data); else setItems(initialMenuItems); })
      .catch(() => setItems(initialMenuItems))
      .finally(() => setDataLoading(false));
  }, [session, restaurant?.id]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const t = searchTerm.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(t) || i.category.toLowerCase().includes(t));
  }, [items, searchTerm]);

  const handleAdd = useCallback(async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => {
    if (!restaurant?.id) return;
    const tempId = -Date.now();
    setItems(prev => [...prev, { ...data, id: tempId, clicks: 0, views: 0 }]);
    setShowAddForm(false);
    const created = await createMenuItem(data, restaurant.id);
    if (created) setItems(prev => prev.map(i => i.id === tempId ? created : i));
    else         setItems(prev => prev.filter(i => i.id !== tempId));
  }, [restaurant?.id]);

  const handleUpdate = useCallback(async (id: number, data: Partial<MenuItem>) => {
    if (!restaurant?.id) return;
    const prev = items.find(i => i.id === id);
    setItems(curr => curr.map(i => i.id === id ? { ...i, ...data } : i));
    setEditingItem(null);
    const updated = await updateMenuItem(id, restaurant.id, data);
    if (updated) setItems(curr => curr.map(i => i.id === id ? { ...i, ...updated } : i));
    else if (prev) setItems(curr => curr.map(i => i.id === id ? prev : i));
  }, [restaurant?.id, items]);

  const handleDelete = useCallback(async (id: number) => {
    if (!restaurant?.id) return;
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
    const ok = await deleteMenuItem(id, restaurant.id);
    if (!ok) fetchMenuItems(restaurant.id).then(d => { if (d) setItems(d); });
  }, [restaurant?.id]);

  if (authLoading || !session) return <LoadingScreen />;

  const labelStyle = {
    display: "block" as const, fontSize: 11, fontWeight: 600,
    color: "var(--gm-text-tertiary)", letterSpacing: "0.06em",
    textTransform: "uppercase" as const, marginBottom: 10,
  };

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
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>Menu</h1>
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: 0 }}>{items.length} items · {restaurant?.name}</p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingItem(null); }}
            className="gm-btn-primary"
            style={{ height: 40, padding: "0 16px", fontSize: 13 }}
          >
            + Add Dish
          </button>
        </div>
        {/* Search */}
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px 12px" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gm-text-tertiary)" }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="gm-input"
              type="text"
              placeholder="Search items, categories…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, height: 40, fontSize: 14 }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, color: "var(--gm-text-tertiary)", cursor: "pointer", lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 20px 120px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Inline Add Form */}
        {showAddForm && (
          <div className="animate-slideUp">
            <p style={labelStyle}>New Dish</p>
            <ItemForm mode="add" onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Item count */}
        {searchTerm && (
          <p style={{ fontSize: 13, color: "var(--gm-text-secondary)" }}>
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Skeleton */}
        {dataLoading && !showAddForm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="animate-skeleton" style={{ height: 90, borderRadius: 20 }} />)}
          </div>
        )}

        {/* Item list */}
        {!dataLoading && filteredItems.map(item => (
          <div key={item.id} className="animate-fadeIn">
            {editingItem?.id === item.id ? (
              <ItemForm
                mode="edit"
                item={editingItem}
                onSave={data => handleUpdate(item.id, data)}
                onCancel={() => setEditingItem(null)}
              />
            ) : (
              <MenuItemRow
                item={item}
                indicator={indicators[item.id]}
                onEdit={() => { setEditingItem(item); setShowAddForm(false); }}
                onToggleAvailable={() => handleUpdate(item.id, { available: !item.available })}
                onToggleFeatured={() => handleUpdate(item.id, { featured: !item.featured })}
                onDelete={() => setDeleteConfirm(item.id)}
              />
            )}
            {deleteConfirm === item.id && (
              <div className="animate-slideUp" style={{ marginTop: 8, background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", marginBottom: 4 }}>Delete "{item.name}"?</p>
                <p style={{ fontSize: 13, color: "var(--gm-danger)", marginBottom: 12 }}>This cannot be undone.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setDeleteConfirm(null)} className="gm-btn-secondary" style={{ flex: 1, height: 40, fontSize: 13 }}>Cancel</button>
                  <button onClick={() => handleDelete(item.id)} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--gm-danger)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!dataLoading && filteredItems.length === 0 && !showAddForm && (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>{searchTerm ? "🔍" : "🍽️"}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", marginBottom: 8 }}>
              {searchTerm ? "No matches" : "No items yet"}
            </p>
            <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginBottom: 20 }}>
              {searchTerm ? `No items match "${searchTerm}"` : "Add your first dish to get started."}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowAddForm(true)} className="gm-btn-primary" style={{ fontSize: 14 }}>
                + Add First Dish
              </button>
            )}
          </div>
        )}
      </div>

      <AdminBottomNav restaurantId={restaurant?.id} />
    </div>
  );
}

function MenuItemRow({ item, indicator, onEdit, onToggleAvailable, onToggleFeatured, onDelete }: {
  item: MenuItem;
  indicator: { label: string; suggestion: string } | null;
  onEdit: () => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const isVeg = item.food_type === "veg";
  const isNonVeg = item.food_type === "non_veg";

  return (
    <div style={{
      background: "var(--gm-surface)", border: "1px solid var(--gm-border)",
      borderRadius: 20, padding: 14, boxShadow: "var(--gm-shadow-sm)",
      opacity: item.available ? 1 : 0.6, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", width: 56, height: 56, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--gm-bg)" }}>
          <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.name}</p>
            {indicator && (
              <span style={{ fontSize: 9, fontWeight: 600, color: "var(--gm-text-tertiary)", background: "var(--gm-bg)", border: "1px solid var(--gm-border)", borderRadius: 6, padding: "2px 6px", flexShrink: 0, lineHeight: 1.3 }}>
                {indicator.label}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: 0 }} className="price tabular-nums">
            {formatPrice(item.price)} · {item.category}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--gm-text-tertiary)" }}>{item.views}v · {item.clicks}c</span>
            {(isVeg || isNonVeg) && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                background: isVeg ? "#ECFDF5" : "#FEF2F2",
                color: isVeg ? "#15803D" : "#B91C1C",
                border: `1px solid ${isVeg ? "#BBF7D0" : "#FECACA"}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: isVeg ? "50%" : 0, background: isVeg ? "#15803D" : "#EF4444", flexShrink: 0 }} />
                {isVeg ? "Veg" : "Non-Veg"}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        <button onClick={onEdit} style={{ padding: "7px 0", borderRadius: 10, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>✏️ Edit</button>
        <button onClick={onToggleAvailable} style={{ padding: "7px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", ...(item.available ? { background: "var(--gm-success-bg)", color: "#15803D" } : { background: "var(--gm-danger-bg)", color: "#B91C1C" }) }}>
          {item.available ? "✓ Avail" : "✗ Sold"}
        </button>
        <button onClick={onToggleFeatured} style={{ padding: "7px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", ...(item.featured ? { background: "#FFFBEB", color: "#92400E" } : { background: "var(--gm-bg)", color: "var(--gm-text-secondary)" }) }}>
          {item.featured ? "⭐ Feat" : "Feature"}
        </button>
        <button onClick={onDelete} style={{ padding: "7px 0", borderRadius: 10, border: "none", background: "var(--gm-danger-bg)", color: "#B91C1C", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>🗑</button>
      </div>
    </div>
  );
}
