"use client";

import { useState, useCallback, memo, useEffect, useMemo } from "react";
import { MenuItem } from "@/data/menuData";
import ItemCard from "./ItemCard";
import CategoryFilter from "./CategoryFilter";
import CartButton from "./CartButton";
import { useMenuEngine } from "@/hooks/useMenuEngine";
import { fetchTableOrders, Order } from "@/lib/supabase";
import { formatPrice } from "@/lib/constants";

interface WeatherContext { temp: number; isRaining: boolean; }

interface Props {
  items: MenuItem[];
  loading: boolean;
  kitchenStatus: "normal" | "busy";
  guestName: string;
  memberCount: number;
  tableNumber: string;
  restaurantName: string;
  restaurantId?: string;
  restaurantSlug: string;
  weatherContext?: WeatherContext;
  recentOrderCounts?: Record<number, number>;
  onItemClick: (item: MenuItem) => void;
  onViewItem: (itemId: number) => void;
}

const MemoizedCategoryFilter = memo(CategoryFilter);

const TAG_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "Veg":          { bg: "var(--gm-success-bg)",  text: "#15803D", border: "var(--gm-success-border)" },
  "Jain":         { bg: "var(--gm-warning-bg)",  text: "#92400E", border: "var(--gm-warning-border)" },
  "Spicy":        { bg: "var(--gm-danger-bg)",   text: "#B91C1C", border: "var(--gm-danger-border)" },
  "Gluten-free":  { bg: "var(--gm-info-bg)",     text: "#1D4ED8", border: "var(--gm-info-border)" },
  "Contains nuts":{ bg: "#FAF5FF",               text: "#7C3AED", border: "#DDD6FE" },
};

function SkeletonCard({ h }: { h: number }) {
  return <div className="animate-skeleton" style={{ height: h, borderRadius: 20 }} />;
}
function SkeletonList() {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px", background: "var(--gm-surface)", borderRadius: 16, border: "1px solid var(--gm-border)" }}>
      <div className="animate-skeleton" style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
        <div className="animate-skeleton" style={{ height: 12, width: "60%", borderRadius: 6 }} />
        <div className="animate-skeleton" style={{ height: 10, width: "80%", borderRadius: 6 }} />
        <div className="animate-skeleton" style={{ height: 10, width: "25%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function MenuPage({
  items, loading, kitchenStatus, guestName, memberCount, tableNumber,
  restaurantName, restaurantId, restaurantSlug, weatherContext, recentOrderCounts,
  onItemClick, onViewItem,
}: Props) {
  const [searchTerm, setSearchTerm]         = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTags, setActiveTags]         = useState<string[]>([]);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [tableOrders, setTableOrders]       = useState<Order[]>([]);
  const [isOnline, setIsOnline]             = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => {
    if (restaurantId && tableNumber && tableNumber !== "QR") {
      fetchTableOrders(restaurantId, tableNumber).then(setTableOrders);
    }
  }, [restaurantId, tableNumber]);

  const { topPicks, quickPicks, fullMenu, categories } = useMenuEngine(
    items, kitchenStatus, activeCategory, searchTerm, memberCount, activeTags, weatherContext
  );

  const categoryCounts = useMemo(() => {
    const available = items.filter(i => i.available);
    const counts: Record<string, number> = { All: available.length };
    available.forEach(item => { counts[item.category] = (counts[item.category] ?? 0) + 1; });
    return counts;
  }, [items]);

  const handleItemClick = useCallback((item: MenuItem) => { onItemClick(item); }, [onItemClick]);
  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const showSections = !searchTerm && activeCategory === "All" && activeTags.length === 0;

  const hour = new Date().getHours();
  const timeContext = hour < 12 ? "Morning picks" : hour < 16 ? "Lunch specials" : hour < 21 ? "Evening picks" : "Late night";
  const tableItemNames = [...new Set(tableOrders.flatMap(o => o.items.map(i => i.name)))].slice(0, 3);
  const allTags = [...new Set(items.filter(i => i.available).flatMap(i => i.tags ?? []))];

  const greeting = (() => {
    const timeGreet = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
    const tableLabel = tableNumber && tableNumber !== "QR"
      ? ` · Table ${tableNumber}`
      : ` · ${memberCount} ${memberCount === 1 ? "guest" : "guests"}`;
    return guestName ? `Hi ${guestName} ${timeGreet}${tableLabel}` : `${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"} ${timeGreet}`;
  })();

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 96, background: "var(--gm-bg)" }}>
      {!isOnline && (
        <div style={{ textAlign: "center", padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#92400E", background: "var(--gm-warning-bg)", borderBottom: "1px solid var(--gm-warning-border)" }}>
          Offline — browsing saved menu. Orders paused.
        </div>
      )}

      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              {restaurantName
                ? <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurantName}</h1>
                : <div className="animate-skeleton" style={{ width: 120, height: 20 }} />
              }
              <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{greeting}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setSearchOpen(v => !v)} aria-label="Search"
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--gm-border)", background: searchOpen ? "#FFF7ED" : "var(--gm-surface)", color: searchOpen ? "var(--gm-primary)" : "var(--gm-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: kitchenStatus === "normal" ? "var(--gm-success-bg)" : "var(--gm-danger-bg)", border: `1px solid ${kitchenStatus === "normal" ? "var(--gm-success-border)" : "var(--gm-danger-border)"}` }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)" }}>
                  {kitchenStatus === "normal" ? "Open" : "Busy"}
                </span>
              </div>
            </div>
          </div>
          {searchOpen && (
            <div style={{ position: "relative", marginTop: 10 }} className="animate-slideUp">
              <input className="gm-input" autoFocus style={{ paddingLeft: 38, height: 42, fontSize: 14 }}
                placeholder="Search dishes, categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gm-text-tertiary)" }} width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              {searchTerm && <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, color: "var(--gm-text-tertiary)", cursor: "pointer" }}>×</button>}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>{[0,1,2,3].map(i => <div key={i} style={{ flexShrink: 0, width: 144 }}><SkeletonCard h={160} /></div>)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{[0,1,2,3].map(i => <SkeletonCard key={i} h={160} />)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[0,1,2,3,4].map(i => <SkeletonList key={i} />)}</div>
        </div>
      ) : (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          {/* Social proof */}
          {tableItemNames.length > 0 && showSections && (
            <div style={{ margin: "16px 16px 0", borderRadius: 12, padding: "8px 14px", background: "#FFF7ED", border: "1px solid #FDBA74" }}>
              <p style={{ fontSize: 13, color: "#C2410C" }}>👥 Others at Table {tableNumber} ordered: {tableItemNames.join(", ")}</p>
            </div>
          )}

          {/* Quick Picks */}
          {quickPicks.length > 0 && showSections && (
            <section style={{ paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>⚡ Quick Picks</h2>
                <span style={{ fontSize: 12, color: "var(--gm-text-secondary)" }}>Fast · Popular</span>
              </div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 4px", scrollSnapType: "x mandatory" }} className="scrollbar-none">
                {quickPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="quick"
                    priority={i === 0} restaurantId={restaurantId} onView={onViewItem}
                    recentOrderCounts={recentOrderCounts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* For You */}
          {topPicks.length > 0 && showSections && (
            <section style={{ paddingTop: 20, padding: "20px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>🔥 For You</h2>
                <span style={{ fontSize: 12, color: "var(--gm-primary)", background: "#FFF7ED", padding: "3px 10px", borderRadius: 99, fontWeight: 500 }}>{timeContext}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {topPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="grid"
                    priority={i < 2} restaurantId={restaurantId} onView={onViewItem}
                    recentOrderCounts={recentOrderCounts}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dietary tags */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "16px 16px 4px" }} className="scrollbar-none">
              {allTags.map(tag => {
                const isActive = activeTags.includes(tag);
                const s = TAG_STYLE[tag] ?? { bg: "var(--gm-bg)", text: "var(--gm-text-secondary)", border: "var(--gm-border)" };
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                      ...(isActive ? { background: s.bg, color: s.text, border: `1px solid ${s.border}` } : { background: "var(--gm-surface)", color: "var(--gm-text-secondary)", border: "1px solid var(--gm-border)" }) }}>
                    {tag}
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, color: "var(--gm-text-secondary)", background: "var(--gm-bg)", border: "1px solid var(--gm-border)", cursor: "pointer" }}>Clear ×</button>
              )}
            </div>
          )}

          {/* Category filter */}
          <div style={{ position: "sticky", top: 56, zIndex: 20, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", marginTop: 8 }}>
            {!categoryExpanded && activeCategory === "All" && showSections ? (
              <div style={{ padding: "8px 16px" }}>
                <button onClick={() => setCategoryExpanded(true)}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "var(--gm-text-secondary)", background: "var(--gm-bg)", border: "1px solid var(--gm-border)", cursor: "pointer" }}>
                  Browse all categories ▾
                </button>
              </div>
            ) : (
              <MemoizedCategoryFilter categories={categories} activeCategory={activeCategory}
                categoryCounts={categoryCounts}
                onCategoryChange={c => { setActiveCategory(c); setSearchTerm(""); setSearchOpen(false); if (c !== "All") setCategoryExpanded(false); }}
              />
            )}
          </div>

          {/* Full menu */}
          <section style={{ padding: "16px 16px 40px" }}>
            {fullMenu.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{activeCategory !== "All" ? "😔" : "🔍"}</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)" }}>
                  {activeCategory !== "All" ? `${activeCategory} unavailable` : "Nothing found"}
                </p>
                <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginTop: 4 }}>
                  {activeCategory !== "All" ? "All items sold out right now" : "Try a different search or category"}
                </p>
                {activeCategory !== "All" && (
                  <button onClick={() => setActiveCategory("All")}
                    style={{ marginTop: 16, fontSize: 13, fontWeight: 500, color: "var(--gm-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    Browse all items →
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>{activeCategory === "All" ? "All Items" : activeCategory}</h2>
                  <span style={{ fontSize: 12, color: "var(--gm-text-tertiary)" }}>{fullMenu.length} items</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {fullMenu.map((item, i) => (
                    <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="list"
                      priority={i < 3 && showSections} restaurantId={restaurantId}
                      onView={onViewItem} recentOrderCounts={recentOrderCounts}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <CartButton restaurantId={restaurantId} guestName={guestName} memberCount={memberCount} tableNumber={tableNumber} />
    </div>
  );
}
