import { useMemo, useEffect, useState } from "react";
import { MenuItem } from "@/data/menuData";
import { useRuleEngine } from "./useRuleEngine";

interface MenuOutput {
  topPicks: MenuItem[];
  quickPicks: MenuItem[];
  fullMenu: MenuItem[];
  categories: string[];
}

export function useMenuEngine(
  items: MenuItem[],
  kitchenStatus: "normal" | "busy",
  activeCategory: string,
  searchTerm: string
): MenuOutput {
  const { sortByRules, getCustomerTag } = useRuleEngine();

  const [viewedItemIds, setViewedItemIds] = useState<number[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ghostMenuViewedItems");
      if (stored) setViewedItemIds(JSON.parse(stored));
    } catch {}
  }, []);

  const availableItems = useMemo(() => {
    return items
      .filter((item) => item.available)
      .map((item) => ({ ...item, tag: getCustomerTag(item) ?? undefined }));
  }, [items, getCustomerTag]);

  const categories = useMemo(() => {
    const cats = [...new Set(availableItems.map((i) => i.category))];
    return ["All", ...cats];
  }, [availableItems]);

  const sortedItems = useMemo(
    () => sortByRules(availableItems, kitchenStatus, viewedItemIds),
    [availableItems, kitchenStatus, viewedItemIds, sortByRules]
  );

  // Top picks: up to 4, ensuring category diversity
  const topPicks = useMemo(() => {
    const seen = new Set<string>();
    const picks: MenuItem[] = [];
    for (const item of sortedItems) {
      if (picks.length >= 4) break;
      if (!seen.has(item.category)) {
        seen.add(item.category);
        picks.push(item);
      }
    }
    if (picks.length < 4) {
      for (const item of sortedItems) {
        if (picks.length >= 4) break;
        if (!picks.find((p) => p.id === item.id)) picks.push(item);
      }
    }
    return picks;
  }, [sortedItems]);

  // Quick picks: fast prep + popular + high profit (deduplicated, max 5)
  const quickPicks = useMemo(() => {
    const fastItems = availableItems
      .filter((i) => i.prep_time === "fast")
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 2);

    const popularItem = [...availableItems].sort((a, b) => b.clicks - a.clicks)[0];
    const highProfitItem = availableItems
      .filter((i) => i.profit_tag === "high")
      .sort((a, b) => b.clicks - a.clicks)[0];

    const candidates = [popularItem, highProfitItem, ...fastItems].filter(Boolean) as MenuItem[];
    const seen = new Set<number>();
    return candidates.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 5);
  }, [availableItems]);

  // Full menu: filtered and sorted
  const fullMenu = useMemo(() => {
    let filtered = sortedItems;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)
      );
    }

    if (activeCategory !== "All") {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }

    return filtered;
  }, [sortedItems, searchTerm, activeCategory]);

  return { topPicks, quickPicks, fullMenu, categories };
}

export function usePersonalizationTracker() {
  const trackView = (itemId: number) => {
    try {
      const stored = localStorage.getItem("ghostMenuViewedItems");
      const prev: number[] = stored ? JSON.parse(stored) : [];
      const updated = [itemId, ...prev.filter((id) => id !== itemId)].slice(0, 20);
      localStorage.setItem("ghostMenuViewedItems", JSON.stringify(updated));
    } catch {}
  };

  const getViewedIds = (): number[] => {
    try {
      const stored = localStorage.getItem("ghostMenuViewedItems");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  return { trackView, getViewedIds };
}
