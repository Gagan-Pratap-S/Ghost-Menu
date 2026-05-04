import { useMemo, useEffect, useState } from "react";
import { LS } from "@/lib/constants";
import { MenuItem } from "@/data/menuData";
import { useRuleEngine } from "./useRuleEngine";

interface MenuOutput {
  topPicks: MenuItem[];
  quickPicks: MenuItem[];
  fullMenu: MenuItem[];
  categories: string[];
}

function getStoredIds(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function useMenuEngine(
  items: MenuItem[],
  kitchenStatus: "normal" | "busy",
  activeCategory: string,
  searchTerm: string
): MenuOutput {
  const { sortByRules, getCustomerTag } = useRuleEngine();

  // Initialise from localStorage immediately — no async gap, no flicker
  const [viewedItemIds, setViewedItemIds] = useState<number[]>(() => getStoredIds(LS.VIEWED_ITEMS));
  const [cartHistoryIds, setCartHistoryIds] = useState<number[]>(() => getStoredIds(LS.CART_HISTORY));

  // Keep in sync if another tab updates it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS.VIEWED_ITEMS)  setViewedItemIds(getStoredIds(LS.VIEWED_ITEMS));
      if (e.key === LS.CART_HISTORY)  setCartHistoryIds(getStoredIds(LS.CART_HISTORY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const availableItems = useMemo(() =>
    items
      .filter(item => item.available)
      .map(item => ({ ...item, tag: getCustomerTag(item) ?? undefined }))
  , [items, getCustomerTag]);

  const categories = useMemo(() => {
    const cats = [...new Set(availableItems.map(i => i.category))];
    return ["All", ...cats];
  }, [availableItems]);

  const sortedItems = useMemo(
    () => sortByRules(availableItems, kitchenStatus, viewedItemIds, cartHistoryIds),
    [availableItems, kitchenStatus, viewedItemIds, cartHistoryIds, sortByRules]
  );

  // Top picks: up to 4, category-diverse
  const topPicks = useMemo(() => {
    const seen  = new Set<string>();
    const picks: MenuItem[] = [];
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

  // Quick picks: fast + popular + high profit, deduplicated, max 5
  const quickPicks = useMemo(() => {
    const fastItems = availableItems
      .filter(i => i.prep_time === "fast")
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 2);

    const popular    = [...availableItems].sort((a, b) => b.clicks - a.clicks)[0];
    const highProfit = availableItems.filter(i => i.profit_tag === "high").sort((a, b) => b.clicks - a.clicks)[0];

    const seen = new Set<number>();
    return ([popular, highProfit, ...fastItems].filter(Boolean) as MenuItem[])
      .filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; })
      .slice(0, 5);
  }, [availableItems]);

  // Full menu: filtered + sorted
  const fullMenu = useMemo(() => {
    let filtered = sortedItems;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }
    if (activeCategory !== "All") {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    return filtered;
  }, [sortedItems, searchTerm, activeCategory]);

  return { topPicks, quickPicks, fullMenu, categories };
}

export function usePersonalizationTracker() {
  // trackView: called via IntersectionObserver in ItemCard (not on click!)
  const trackView = (itemId: number) => {
    try {
      const stored = localStorage.getItem(LS.VIEWED_ITEMS);
      const prev: number[] = stored ? JSON.parse(stored) : [];
      const updated = [itemId, ...prev.filter(id => id !== itemId)].slice(0, 20);
      localStorage.setItem(LS.VIEWED_ITEMS, JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent("storage", { key: LS.VIEWED_ITEMS }));
    } catch {}
  };

  // trackCartAdd: records items added to cart for return-visit boosting
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
