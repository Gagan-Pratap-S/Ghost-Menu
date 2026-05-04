"use client";

import { useState, useCallback } from "react";
import { MenuItem } from "@/data/menuData";
import ItemCard from "./ItemCard";
import CategoryFilter from "./CategoryFilter";
import CartButton from "./CartButton";
import { useMenuEngine, usePersonalizationTracker } from "@/hooks/useMenuEngine";

interface Props {
  items: MenuItem[];
  loading: boolean;
  kitchenStatus: "normal" | "busy";
  guestName: string;
  memberCount: number;
  tableNumber: string;
  restaurantName: string;
  restaurantId?: string;
  onItemClick: (item: MenuItem) => void;
}

function SkeletonCard({ h }: { h: string }) {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse flex-shrink-0" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className={`${h} w-full`} style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="p-3 space-y-2">
        <div className="h-2.5 rounded w-3/4" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-2 rounded w-1/3" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex gap-3 rounded-2xl p-3 animate-pulse" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2.5 rounded w-2/3" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-2 rounded w-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-2 rounded w-1/4" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

export default function MenuPage({ items, loading, kitchenStatus, guestName, memberCount, tableNumber, restaurantName, restaurantId, onItemClick }: Props) {
  const [searchTerm, setSearchTerm]         = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const { trackView } = usePersonalizationTracker();

  const { topPicks, quickPicks, fullMenu, categories } = useMenuEngine(items, kitchenStatus, activeCategory, searchTerm);

  const handleItemClick = useCallback((item: MenuItem) => {
    trackView(item.id);
    onItemClick(item);
  }, [trackView, onItemClick]);

  const showSections = !searchTerm && activeCategory === "All";

  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
  const tableLabel = tableNumber && tableNumber !== "QR" ? ` · Table ${tableNumber}` : ` · ${memberCount} guests`;
  const greeting = guestName ? `Hi ${guestName} ${timeGreet}${tableLabel}` : `${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"} ${timeGreet}`;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--color-bg)" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-lg text-white tracking-tight truncate">{restaurantName}</h1>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{greeting}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setSearchOpen(v => !v)} aria-label="Search"
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                  background: searchOpen ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)",
                  border: "1px solid " + (searchOpen ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"),
                  color: searchOpen ? "#f97316" : "#94a3b8"
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={kitchenStatus === "normal"
                  ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }
                  : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full ${kitchenStatus === "normal" ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
                {kitchenStatus === "normal" ? "Open" : "Busy"}
              </span>
            </div>
          </div>

          {searchOpen && (
            <div className="relative mt-2.5 animate-slideUp">
              <input autoFocus type="text" placeholder="Search dishes, categories…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 pl-9 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
                onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-base">×</button>}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="max-w-md mx-auto px-4 py-5 space-y-6">
          <div className="flex gap-3 overflow-hidden">{[0,1,2,3].map(i => <div key={i} className="flex-shrink-0 w-36"><SkeletonCard h="h-24" /></div>)}</div>
          <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map(i => <SkeletonCard key={i} h="h-28" />)}</div>
          <div className="space-y-2.5">{[0,1,2,3,4].map(i => <SkeletonList key={i} />)}</div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {quickPicks.length > 0 && showSections && (
            <section className="pt-6">
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="font-display font-bold text-sm text-white">⚡ Quick Picks</h2>
                <span className="text-xs text-slate-600">Fast · Popular</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x scrollbar-none">
                {quickPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="quick" priority={i === 0} />
                ))}
              </div>
            </section>
          )}

          {topPicks.length > 0 && showSections && (
            <section className="pt-6 px-4">
              <h2 className="font-display font-bold text-sm text-white mb-3">🔥 Most Ordered</h2>
              <div className="grid grid-cols-2 gap-3">
                {topPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="grid" priority={i < 2} />
                ))}
              </div>
            </section>
          )}

          <div className="sticky mt-5" style={{ top: "56px", zIndex: 20, background: "rgba(2,6,23,0.9)", backdropFilter: "blur(12px)" }}>
            <CategoryFilter categories={categories} activeCategory={activeCategory}
              onCategoryChange={c => { setActiveCategory(c); setSearchTerm(""); setSearchOpen(false); }}
            />
          </div>

          <section className="px-4 pt-4 pb-10">
            {fullMenu.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-display font-semibold text-white">Nothing found</p>
                <p className="text-xs text-slate-500 mt-1">Try a different search or category</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-bold text-sm text-white">{activeCategory === "All" ? "All Items" : activeCategory}</h2>
                  <span className="text-xs text-slate-600">{fullMenu.length} items</span>
                </div>
                <div className="space-y-2.5">
                  {fullMenu.map((item, i) => (
                    <div key={item.id} className="animate-item">
                      <ItemCard item={item} onClick={() => handleItemClick(item)} variant="list" priority={i < 3 && showSections} />
                    </div>
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
