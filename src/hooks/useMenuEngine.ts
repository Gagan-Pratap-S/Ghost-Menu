import { useMemo, useEffect, useState } from "react";
import { LS } from "@/lib/constants";
import { MenuItem } from "@/data/menuData";
import { useRuleEngine } from "./useRuleEngine";

interface WeatherContext { temp: number; isRaining: boolean; }

interface MenuOutput {
  topPicks: MenuItem[];
  quickPicks: MenuItem[];
  fullMenu: MenuItem[];
  categories: string[];
}

function getIds(key: string): number[] {
  if (typeof window === "undefined") return [];
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : []; }
  catch { return []; }
}

export function useMenuEngine(
  items: MenuItem[],
  kitchenStatus: "normal" | "busy",
  activeCategory: string,
  searchTerm: string,
  memberCount = 1,
  activeTags: string[] = [],
  weatherContext?: WeatherContext
): MenuOutput {
  const { sortByRules, getCustomerTag } = useRuleEngine();

  const [viewedItemIds, setViewedItemIds]   = useState<number[]>(() => getIds(LS.VIEWED_ITEMS));
  const [cartHistoryIds, setCartHistoryIds] = useState<number[]>(() => getIds(LS.CART_HISTORY));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS.VIEWED_ITEMS)  setViewedItemIds(getIds(LS.VIEWED_ITEMS));
      if (e.key === LS.CART_HISTORY)  setCartHistoryIds(getIds(LS.CART_HISTORY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const ctx = useMemo(() => ({
    kitchenStatus, viewedItemIds, cartHistoryIds, memberCount, weatherContext,
  }), [kitchenStatus, viewedItemIds, cartHistoryIds, memberCount, weatherContext]);

  const availableItems = useMemo(() =>
    items.filter(i => i.available).map(i => ({ ...i, tag: getCustomerTag(i) ?? undefined }))
  , [items, getCustomerTag]);

  const categories = useMemo(() => {
    const cats = [...new Set(availableItems.map(i => i.category))];
    return ["All", ...cats];
  }, [availableItems]);

  const sortedItems = useMemo(() => sortByRules(availableItems, ctx), [availableItems, ctx, sortByRules]);

  const topPicks = useMemo(() => {
    const seen = new Set<string>(); const picks: MenuItem[] = [];
    for (const item of sortedItems) {
      if (picks.length >= 4) break;
      if (!seen.has(item.category)) { seen.add(item.category); picks.push(item); }
    }
    for (const item of sortedItems) {
      if (picks.length >= 4) break;
      if (!picks.find(p => p.id === item.id)) picks.push(item);
    }
    return picks;
  }, [sortedItems]);

  const quickPicks = useMemo(() => {
    const fastItems = availableItems.filter(i => i.prep_time === "fast").sort((a,b) => b.clicks - a.clicks).slice(0, 2);
    const popular   = [...availableItems].sort((a,b) => b.clicks - a.clicks)[0];
    const highProfit = availableItems.filter(i => i.profit_tag === "high").sort((a,b) => b.clicks - a.clicks)[0];
    const seen = new Set<number>();
    return ([popular, highProfit, ...fastItems].filter(Boolean) as MenuItem[])
      .filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; })
      .slice(0, 5);
  }, [availableItems]);

  const fullMenu = useMemo(() => {
    let filtered = sortedItems;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)
      );
    }
    if (activeCategory !== "All") filtered = filtered.filter(i => i.category === activeCategory);
    if (activeTags.length > 0) filtered = filtered.filter(i => activeTags.every(t => i.tags?.includes(t)));
    return filtered;
  }, [sortedItems, searchTerm, activeCategory, activeTags]);

  return { topPicks, quickPicks, fullMenu, categories };
}

export function usePersonalizationTracker() {
  const trackView = (itemId: number) => {
    try {
      const stored = localStorage.getItem(LS.VIEWED_ITEMS);
      const prev: number[] = stored ? JSON.parse(stored) : [];
      const updated = [itemId, ...prev.filter(id => id !== itemId)].slice(0, 20);
      localStorage.setItem(LS.VIEWED_ITEMS, JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent("storage", { key: LS.VIEWED_ITEMS }));
    } catch {}
  };

  const trackCartAdd = (itemId: number) => {
    try {
      const stored = localStorage.getItem(LS.CART_HISTORY);
      const prev: number[] = stored ? JSON.parse(stored) : [];
      const updated = [itemId, ...prev.filter(id => id !== itemId)].slice(0, 10);
      localStorage.setItem(LS.CART_HISTORY, JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent("storage", { key: LS.CART_HISTORY }));
    } catch {}
  };

  return { trackView, trackCartAdd };
}
