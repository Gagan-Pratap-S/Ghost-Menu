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
  restaurantName: string;
  onItemClick: (item: MenuItem) => void;
}

function SkeletonQuick() {
  return (
    <div className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
      <div className="h-24 bg-stone-200" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-2.5 bg-stone-200 rounded w-3/4" />
        <div className="h-2.5 bg-stone-200 rounded w-1/3" />
      </div>
    </div>
  );
}
function SkeletonGrid() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
      <div className="h-28 bg-stone-200" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-stone-200 rounded w-3/4" />
        <div className="h-2.5 bg-stone-200 rounded w-1/3" />
      </div>
    </div>
  );
}
function SkeletonList() {
  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 border border-stone-100 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-stone-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2.5 bg-stone-200 rounded w-2/3" />
        <div className="h-2 bg-stone-200 rounded w-full" />
        <div className="h-2 bg-stone-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function MenuPage({ items, loading, kitchenStatus, guestName, memberCount, restaurantName, onItemClick }: Props) {
  const [searchTerm, setSearchTerm]         = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const { trackView } = usePersonalizationTracker();

  const { topPicks, quickPicks, fullMenu, categories } = useMenuEngine(
    items, kitchenStatus, activeCategory, searchTerm
  );

  const handleItemClick = useCallback((item: MenuItem) => {
    trackView(item.id);
    onItemClick(item);
  }, [trackView, onItemClick]);

  const showSections = !searchTerm && activeCategory === "All";

  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
  const greeting = guestName
    ? `Hi ${guestName} ${timeGreet} · Table for ${memberCount}`
    : `${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"} ${timeGreet}`;

  return (
    <div className="min-h-screen pb-28 bg-stone-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-stone-900 tracking-tight truncate">{restaurantName}</h1>
              <p className="text-xs text-stone-400 mt-0.5 truncate">{greeting}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(v => !v)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  searchOpen ? "bg-orange-100 text-orange-600" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                kitchenStatus === "normal" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${kitchenStatus === "normal" ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                {kitchenStatus === "normal" ? "Open" : "Busy"}
              </span>
            </div>
          </div>

          {searchOpen && (
            <div className="relative mt-2.5 animate-slideUp">
              <input
                autoFocus
                type="text"
                placeholder="Search dishes, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-100 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-base leading-none">×</button>
              )}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="max-w-md mx-auto px-4 py-5 space-y-6">
          <div className="flex gap-3 overflow-hidden">{[0,1,2,3].map(i => <SkeletonQuick key={i} />)}</div>
          <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map(i => <SkeletonGrid key={i} />)}</div>
          <div className="space-y-2.5">{[0,1,2,3,4].map(i => <SkeletonList key={i} />)}</div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {/* ⚡ Quick Picks */}
          {quickPicks.length > 0 && showSections && (
            <section className="pt-5">
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="font-display text-sm font-bold text-stone-900">⚡ Quick Picks</h2>
                <span className="text-xs text-stone-400">Fast · Popular</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x scrollbar-none">
                {quickPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="quick" priority={i === 0} />
                ))}
              </div>
            </section>
          )}

          {/* 🔥 Most Ordered */}
          {topPicks.length > 0 && showSections && (
            <section className="pt-5 px-4">
              <h2 className="font-display text-sm font-bold text-stone-900 mb-3">🔥 Most Ordered</h2>
              <div className="grid grid-cols-2 gap-3">
                {topPicks.map((item, i) => (
                  <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="grid" priority={i < 2} />
                ))}
              </div>
            </section>
          )}

          {/* Category filter */}
          <div className="sticky top-[56px] z-20 mt-5 bg-stone-50">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={(c) => { setActiveCategory(c); setSearchTerm(""); setSearchOpen(false); }}
            />
          </div>

          {/* Full menu */}
          <section className="px-4 pt-4 pb-10">
            {fullMenu.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-display font-semibold text-stone-700">Nothing found</p>
                <p className="text-xs text-stone-400 mt-1">Try a different search or category</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-sm font-bold text-stone-900">
                    {activeCategory === "All" ? "All Items" : activeCategory}
                  </h2>
                  <span className="text-xs text-stone-400">{fullMenu.length} items</span>
                </div>
                <div className="space-y-2.5">
                  {fullMenu.map((item, i) => (
                    <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="list" priority={i < 3 && showSections} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Floating cart button — only renders when cart has items */}
      <CartButton />
    </div>
  );
}
