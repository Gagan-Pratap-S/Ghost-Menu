"use client";

import { useState, useCallback } from "react";
import { MenuItem } from "@/data/menuData";
import ItemCard from "./ItemCard";
import CategoryFilter from "./CategoryFilter";
import { useMenuEngine, usePersonalizationTracker } from "@/hooks/useMenuEngine";

interface MenuPageProps {
  items: MenuItem[];
  kitchenStatus: "normal" | "busy";
  onItemClick: (item: MenuItem) => void;
}

function SkeletonCard({ variant = "list" }: { variant?: "list" | "grid" | "quick" }) {
  if (variant === "quick") {
    return (
      <div className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 animate-pulse">
        <div className="h-24 bg-stone-200" />
        <div className="p-2.5 space-y-1.5">
          <div className="h-3 bg-stone-200 rounded w-3/4" />
          <div className="h-3 bg-stone-200 rounded w-1/3" />
        </div>
      </div>
    );
  }
  if (variant === "grid") {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 animate-pulse">
        <div className="h-32 bg-stone-200" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-stone-200 rounded w-3/4" />
          <div className="h-3 bg-stone-200 rounded w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-stone-100 animate-pulse">
      <div className="w-[72px] h-[72px] rounded-xl bg-stone-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-stone-200 rounded w-2/3" />
        <div className="h-3 bg-stone-200 rounded w-full" />
        <div className="h-3 bg-stone-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function MenuPage({ items, kitchenStatus, onItemClick }: MenuPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const { trackView } = usePersonalizationTracker();

  const { topPicks, quickPicks, fullMenu, categories } = useMenuEngine(
    items, kitchenStatus, activeCategory, searchTerm
  );

  const handleItemClick = useCallback((item: MenuItem) => {
    trackView(item.id);
    onItemClick(item);
  }, [trackView, onItemClick]);

  const isLoading = items.length === 0;
  const showSections = !searchTerm && activeCategory === "All";

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning ☀️" : hour < 17 ? "Good afternoon 👋" : "Good evening 🌙";

  return (
    <div className="min-h-screen pb-24 bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-transparent border-b-0 shadow-none">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">Cafe Delight</h1>
              <p className="text-xs text-stone-400 mt-0.5">{greeting} · What'll it be?</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSearchVisible((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
                aria-label="Search"
              >
                <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                kitchenStatus === "normal" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${kitchenStatus === "normal" ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                {kitchenStatus === "normal" ? "Open" : "Busy"}
              </div>
            </div>
          </div>

          {searchVisible && (
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 pl-9 bg-stone-100 border border-stone-200 rounded-full text-sm placeholder-stone-400 focus:outline-none focus:bg-white focus:border-orange-300 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-sm">✕</button>
              )}
            </div>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="max-w-md mx-auto px-4 py-5 space-y-6">
          <div className="flex gap-3 overflow-hidden">
            {[0,1,2].map(i => <SkeletonCard key={i} variant="quick" />)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => <SkeletonCard key={i} variant="grid" />)}
          </div>
          <div className="space-y-3">
            {[0,1,2,3].map(i => <SkeletonCard key={i} variant="list" />)}
          </div>
        </div>
      ) : (
        <>
          {/* ── ⚡ Quick Picks (horizontal scroll) ── */}
          {quickPicks.length > 0 && showSections && (
            <section className="pt-5">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h2 className="text-sm font-bold text-stone-900">⚡ Quick Picks</h2>
                  <span className="text-xs text-stone-400">Fast · Popular · Best value</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-0 px-4 snap-x scrollbar-none">
                  {quickPicks.map((item, i) => (
                    <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="quick" priority={i === 0} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 🔥 Most Ordered / Top Picks ── */}
          {topPicks.length > 0 && showSections && (
            <section className="pt-5">
              <div className="max-w-md mx-auto px-4">
                <h2 className="text-sm font-bold text-stone-900 mb-3">🔥 Most Ordered</h2>
                <div className="grid grid-cols-2 gap-3">
                  {topPicks.map((item, i) => (
                    <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="grid" priority={i < 3} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Category Filter ── */}
          <div className="sticky top-[64px] z-20 mt-5">
            <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          {/* ── Full Menu ── */}
          <section className="pt-4 px-4 pb-4">
            <div className="max-w-md mx-auto">
              {fullMenu.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-stone-500 font-medium">Nothing found</p>
                  <p className="text-xs text-stone-400 mt-1">Try a different search or category</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-stone-900">
                      {activeCategory === "All" ? "All Items" : activeCategory}
                    </h2>
                    <span className="text-xs text-stone-400">{fullMenu.length} items</span>
                  </div>
                  <div className="space-y-2.5">
                    {fullMenu.map((item, i) => (
                      <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item)} variant="list" priority={i < 2 && activeCategory !== "All"} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
