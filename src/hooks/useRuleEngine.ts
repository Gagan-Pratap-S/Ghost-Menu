import { useCallback } from "react";
import { MenuItem } from "@/data/menuData";

// ─── Pure functions — defined outside hook so they're never recreated ─────────

function getMealPeriod(): "breakfast" | "lunch" | "dinner" | "snacks" {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return "breakfast";
  if (h >= 12 && h < 16) return "lunch";
  if (h >= 16 && h < 21) return "snacks";
  return "dinner";
}

const TIME_BOOST_MAP: Record<string, string[]> = {
  breakfast: ["Breakfast", "Beverages"],
  lunch:     ["Mains", "Starters", "Combos"],
  dinner:    ["Mains", "Combos", "Desserts"],
  snacks:    ["Starters", "Beverages", "Desserts"],
};

export function calculateScore(
  item: MenuItem,
  kitchenStatus: "normal" | "busy",
  viewedItemIds: number[],
  cartHistoryIds: number[] = []
): number {
  let score = 0;

  // CTR signal — only meaningful once views bug is fixed (views via IntersectionObserver)
  const ctr = item.views > 0 ? item.clicks / item.views : 0;
  score += Math.min(ctr, 1) * 20;

  // Raw click popularity (secondary signal)
  score += Math.min(item.clicks / 200, 1) * 15;

  // Profit
  if (item.profit_tag === "high")   score += 12;
  else if (item.profit_tag === "medium") score += 5;

  // Featured
  if (item.featured) score += 6;

  // Combos boost
  if (item.category === "Combos") score += 10;

  // Kitchen mode — busy kitchen boosts fast items
  if (kitchenStatus === "busy") {
    if (item.prep_time === "fast") score += 15;
    if (item.prep_time === "slow") score -= 15;
  }

  // Time of day
  const period = getMealPeriod();
  if (TIME_BOOST_MAP[period]?.includes(item.category)) score += 10;

  // Return-visit personalisation: items in cart history get a strong boost
  if (cartHistoryIds.includes(item.id)) score += 12;
  // Previously viewed gets a lighter nudge
  if (viewedItemIds.includes(item.id) && !cartHistoryIds.includes(item.id)) score += 4;

  // Freshness boost for new/undiscovered items
  if (item.views + item.clicks < 30) score += 6;

  // Decay — high views, low CTR means poor conversion; demote
  if (item.views > 80 && ctr < 0.08) score -= 10;

  return score;
}

function _sortByRules(
  items: MenuItem[],
  kitchenStatus: "normal" | "busy",
  viewedItemIds: number[],
  cartHistoryIds: number[] = []
): MenuItem[] {
  return [...items].sort(
    (a, b) =>
      calculateScore(b, kitchenStatus, viewedItemIds, cartHistoryIds) -
      calculateScore(a, kitchenStatus, viewedItemIds, cartHistoryIds)
  );
}

function _getCustomerTag(item: MenuItem): string | null {
  if (item.clicks > 50) return "🔥 Popular";
  if (item.featured)    return "⭐ Chef Special";
  return null;
}

function _getQualityIndicators(
  items: MenuItem[]
): Record<number, { label: string; suggestion: string } | null> {
  const out: Record<number, { label: string; suggestion: string } | null> = {};
  for (const item of items) {
    const ctr = item.views > 0 ? item.clicks / item.views : 0;
    if (item.views > 100 && ctr < 0.15) {
      out[item.id] = { label: "⚠️ Low conversion", suggestion: "Improve image or rename" };
    } else if (item.profit_tag === "high" && item.views < 50) {
      out[item.id] = { label: "📈 Promote this", suggestion: "High-profit, low visibility — feature it" };
    } else if (item.clicks > 50 && item.views < 150) {
      out[item.id] = { label: "✨ High performer", suggestion: "Strong CTR — consider featuring" };
    } else {
      out[item.id] = null;
    }
  }
  return out;
}

// ─── Hook — just stable references via useCallback ───────────────────────────
export function useRuleEngine() {
  const sortByRules = useCallback(_sortByRules, []);
  const getCustomerTag = useCallback(_getCustomerTag, []);
  const getQualityIndicators = useCallback(_getQualityIndicators, []);
  return { getMealPeriod, calculateScore, sortByRules, getCustomerTag, getQualityIndicators };
}
