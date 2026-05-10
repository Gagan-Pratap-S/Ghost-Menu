"use client";

import { useState, useCallback, memo, useEffect, useMemo } from "react";
import { MenuItem } from "@/data/menuData";
import ItemCard from "./ItemCard";
import CategoryFilter from "./CategoryFilter";
import CustomerBottomNav, { CustomerTab } from "@/components/navigation/CustomerBottomNav";
import { useMenuEngine } from "@/hooks/useMenuEngine";
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
  const [foodFilter, setFoodFilter]         = useState<"all" | "veg" | "non_veg">("all");
  const [activeTab, setActiveTab]           = useState<CustomerTab>("menu");
  const [isOnline, setIsOnline]             = useState(true);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsHeaderCollapsed(window.scrollY > 90);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { topPicks, quickPicks, fullMenu: rawFullMenu, categories } = useMenuEngine(
    items, kitchenStatus, activeCategory, searchTerm, memberCount, activeTags, weatherContext
  );

  const fullMenu = foodFilter === "all" ? rawFullMenu
    : rawFullMenu.filter(i => i.food_type === foodFilter);

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
  const timeContext = hour < 12 ? "Morning picks" : hour < 16 ? "Lunch specials" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening picks" : "Late night";
  const allTags = [...new Set(items.filter(i => i.available).flatMap(i => i.tags ?? []))];

  const greeting = (() => {
    const emoji = hour < 12 ? "☀️" : hour < 17 ? "🧡" : "🌙";
    if (guestName) return { emoji, name: `Hi, ${guestName}!` };
    const greetWord = hour < 12 ? "Good morning" : hour < 17 ? "Hi, Foodie" : "Good evening";
    return { emoji, name: `${greetWord}!` };
  })();

  const featuredItem = useMemo(() => items.find(i => i.available && i.tag?.includes("Popular")) ?? items[0], [items]);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 96, background: "var(--gm-bg)" }}>
      {!isOnline && (
        <div style={{ textAlign: "center", padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#92400E", background: "var(--gm-warning-bg)", borderBottom: "1px solid var(--gm-warning-border)" }}>
          Offline — browsing saved menu. Orders paused.
        </div>
      )}

      {/* ── Collapsible customer header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: isHeaderCollapsed ? "rgba(255,253,249,0.96)" : "transparent",
          backdropFilter: isHeaderCollapsed ? "blur(20px)" : "none",
          borderBottom: isHeaderCollapsed ? "1px solid rgba(0,0,0,0.04)" : "none",
          boxShadow: "none",
          transition: "background 300ms ease, border-color 300ms ease, padding 300ms ease",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: isHeaderCollapsed ? "12px 16px" : "24px 16px 16px",
            transition: "padding 300ms ease",
          }}
        >
          <div
            style={{
              display: isHeaderCollapsed ? "none" : "flex",
              flexDirection: "column",
              gap: 12,
              opacity: isHeaderCollapsed ? 0 : 1,
              transform: isHeaderCollapsed ? "translateY(-8px)" : "translateY(0)",
              transition: "opacity 250ms ease, transform 250ms ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{greeting.emoji}</span>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>{greeting.name}</h1>
                </div>
                <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", margin: "2px 0 0" }}>
                  {restaurantName
                    ? `Welcome to ${restaurantName}`
                    : tableNumber && tableNumber !== "QR" ? `Table ${tableNumber}` : `${memberCount} ${memberCount === 1 ? "guest" : "guests"}`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: kitchenStatus === "normal" ? "var(--gm-success-bg)" : "var(--gm-danger-bg)", border: `1px solid ${kitchenStatus === "normal" ? "var(--gm-success-border)" : "var(--gm-danger-border)"}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)", display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: kitchenStatus === "normal" ? "var(--gm-success)" : "var(--gm-danger)" }}>
                    {kitchenStatus === "normal" ? "Open" : "Busy"}
                  </span>
                </div>
                <button className="gm-notif-btn" onClick={() => setSearchOpen(v => !v)} aria-label="Search">
                  {searchOpen
                    ? <svg width="16" height="16" fill="none" stroke="var(--gm-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="var(--gm-text-secondary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  }
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", margin: 0 }}>
                {restaurantName
                  ? `Welcome to ${restaurantName}`
                  : tableNumber && tableNumber !== "QR" ? `Table ${tableNumber}` : `${memberCount} ${memberCount === 1 ? "guest" : "guests"}`}
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: "var(--gm-text)", margin: 0, lineHeight: 1.05 }}>Explore Today&apos;s Menu</h2>
            </div>
            <div style={{ position: "relative" }}>
              <input
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); if (!searchOpen) setSearchOpen(true); }}
                placeholder="Search for dishes..."
                style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 9999, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", fontSize: 14, color: "var(--gm-text)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--gm-text-tertiary)", display: "flex" }}>
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, color: "var(--gm-text-tertiary)", cursor: "pointer", lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          <div
            style={{
              display: isHeaderCollapsed ? "flex" : "none",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              minHeight: 40,
              transition: "opacity 250ms ease, transform 250ms ease",
              opacity: isHeaderCollapsed ? 1 : 0,
              transform: isHeaderCollapsed ? "translateY(0)" : "translateY(-8px)",
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", margin: "0 0 4px" }}>
                {restaurantName
                  ? restaurantName
                  : tableNumber && tableNumber !== "QR" ? `Table ${tableNumber}` : `${memberCount} ${memberCount === 1 ? "Guest" : "Guests"}`}
              </p>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>Menu</h1>
            </div>
          </div>
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

          {/* ── Featured Hero Card (matches JSX "Today's Special") ── */}
          {featuredItem && showSections && (
            <div style={{ padding: "16px 16px 0" }}>
              <div style={{
                background: "var(--gm-tint-orange)",
                borderRadius: 28,
                padding: "20px",
                marginBottom: 4,
                position: "relative",
                overflow: "hidden",
                boxShadow: "var(--gm-shadow-md)",
                border: "1px solid rgba(255,122,0,0.08)"
              }}>
                {/* Decorative emoji background */}
                <div style={{ position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.12, userSelect: "none" }}>🍕</div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gm-primary)", background: "rgba(255,122,0,0.12)", padding: "4px 10px", borderRadius: 9999, display: "inline-block", marginBottom: 10 }}>
                  ✨ Today&apos;s Special
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", margin: "0 0 4px", paddingRight: 80 }}>{featuredItem.name}</h2>
                <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: "0 0 14px", paddingRight: 60 }}>{featuredItem.description}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--gm-text)" }}>{formatPrice(featuredItem.price)}</span>
                </div>
                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: i === 0 ? 20 : 7, height: 7, borderRadius: 99, background: i === 0 ? "var(--gm-primary)" : "rgba(255,122,0,0.25)" }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Categories ── */}
          {showSections && (
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>Categories</h3>
                <button onClick={() => setActiveCategory("All")} style={{ fontSize: 13, color: "var(--gm-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All</button>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="scrollbar-none">
                {categories.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={activeCategory === cat ? "gm-pill-active" : "gm-pill-inactive"}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Picks ── */}
          {quickPicks.length > 0 && showSections && (
            <section style={{ paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>⚡ Quick Picks</h2>
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

          {/* ── For You ── */}
          {topPicks.length > 0 && showSections && (
            <section style={{ padding: "20px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>🔥 Popular Dishes</h2>
                <span style={{ fontSize: 12, color: "var(--gm-primary)", background: "var(--gm-tint-orange)", padding: "3px 10px", borderRadius: 99, fontWeight: 500 }}>{timeContext}</span>
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

          {/* ── Veg filter pills ── */}
          <div style={{ display: "flex", gap: 8, padding: "16px 16px 0" }}>
            {(["all", "veg", "non_veg"] as const).map(f => {
              const label = f === "all" ? "All" : f === "veg" ? "🟢 Veg" : "🔴 Non-Veg";
              const isActive = foodFilter === f;
              return (
                <button key={f} onClick={() => setFoodFilter(f)}
                  style={{
                    flexShrink: 0, padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                    ...(isActive
                      ? f === "veg"
                        ? { background: "#ECFDF5", color: "#15803D", border: "1px solid #BBF7D0" }
                        : f === "non_veg"
                          ? { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }
                          : { background: "var(--gm-primary)", color: "#fff", border: "1px solid var(--gm-primary)" }
                      : { background: "var(--gm-surface)", color: "var(--gm-text-secondary)", border: "1px solid var(--gm-border)" }),
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Dietary tags ── */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px 4px" }} className="scrollbar-none">
              {allTags.map(tag => {
                const isActive = activeTags.includes(tag);
                const s = TAG_STYLE[tag] ?? { bg: "var(--gm-bg)", text: "var(--gm-text-secondary)", border: "var(--gm-border)" };
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                      ...(isActive ? { background: s.bg, color: s.text, border: `1px solid ${s.border}` } : { background: "var(--gm-surface)", color: "var(--gm-text-secondary)", border: "1px solid var(--gm-border)" }) }}>
                    {tag}
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, color: "var(--gm-text-secondary)", background: "var(--gm-bg)", border: "1px solid var(--gm-border)", cursor: "pointer", fontFamily: "inherit" }}>Clear ×</button>
              )}
            </div>
          )}

          {/* ── Category filter sticky ── */}
          {/* <div style={{ position: "sticky", top: 88, zIndex: 20, background: "var(--gm-surface)", borderBottom: "1px solid var(--gm-border)", marginTop: 8 }}>
            <MemoizedCategoryFilter categories={categories} activeCategory={activeCategory}
              categoryCounts={categoryCounts}
              onCategoryChange={c => { setActiveCategory(c); setSearchTerm(""); }}
            />
          </div> */}

          {/* ── Full menu ── */}
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
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>{activeCategory === "All" ? "All Dishes" : activeCategory}</h2>
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

      <CustomerBottomNav
        restaurantId={restaurantId}
        guestName={guestName}
        memberCount={memberCount}
        tableNumber={tableNumber}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
