import { useCallback } from "react";
import { MenuItem } from "@/data/menuData";

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

interface ScoreContext {
  kitchenStatus: "normal" | "busy";
  viewedItemIds: number[];
  cartHistoryIds: number[];
  memberCount: number;
  weatherContext?: { temp: number; isRaining: boolean };
}

function calculateScore(item: MenuItem, ctx: ScoreContext): number {
  let score = 0;

  // Primary: clicks normalised 0→30
  score += Math.min(item.clicks / 200, 1) * 30;

  // Profit
  if (item.profit_tag === "high")   score += 12;
  else if (item.profit_tag === "medium") score += 5;

  if (item.featured) score += 6;
  if (item.category === "Combos") score += 10;

  // Kitchen mode
  if (ctx.kitchenStatus === "busy") {
    if (item.prep_time === "fast") score += 15;
    if (item.prep_time === "slow") score -= 15;
  }

  // Time of day
  const period = getMealPeriod();
  if (TIME_BOOST_MAP[period]?.includes(item.category)) score += 10;

  // REC-1: personalisation — cart history > views
  if (ctx.cartHistoryIds.includes(item.id)) score += 12;
  else if (ctx.viewedItemIds.includes(item.id)) score += 4;

  // REC-2: party-size aware
  const isSharing = item.category === "Combos" || item.name.toLowerCase().includes("combo");
  if (ctx.memberCount > 2 && isSharing) score += 8;
  if (ctx.memberCount > 3 && isSharing) score += 6;
  if (ctx.memberCount === 1 && item.prep_time === "fast") score += 5;

  // REC-4: weather-aware
  if (ctx.weatherContext) {
    const { temp, isRaining } = ctx.weatherContext;
    if (temp > 32 && (item.category === "Beverages" || item.name.toLowerCase().includes("cold"))) score += 10;
    if (isRaining && (item.category === "Beverages" || item.name.toLowerCase().includes("chai") || item.name.toLowerCase().includes("soup"))) score += 12;
  }

  // Freshness
  if (item.views + item.clicks < 30) score += 6;

  // Decay
  if (item.views > 80 && item.clicks / item.views < 0.08) score -= 10;

  return score;
}

function _sortByRules(items: MenuItem[], ctx: ScoreContext): MenuItem[] {
  return [...items].sort((a, b) => calculateScore(b, ctx) - calculateScore(a, ctx));
}

function _getCustomerTag(item: MenuItem): string | null {
  if (item.clicks > 50) return "🔥 Popular";
  if (item.featured)    return "⭐ Chef Special";
  return null;
}

function _getQualityIndicators(items: MenuItem[]): Record<number, { label: string; suggestion: string } | null> {
  const out: Record<number, { label: string; suggestion: string } | null> = {};
  for (const item of items) {
    const ctr = item.views > 0 ? item.clicks / item.views : 0;
    if (item.views > 100 && ctr < 0.15) out[item.id] = { label: "⚠️ Low conversion", suggestion: "Improve image or rename" };
    else if (item.profit_tag === "high" && item.views < 50) out[item.id] = { label: "📈 Promote this", suggestion: "High-profit, low visibility" };
    else if (item.clicks > 50 && item.views < 150) out[item.id] = { label: "✨ High performer", suggestion: "Consider featuring" };
    else out[item.id] = null;
  }
  return out;
}

export function useRuleEngine() {
  const sortByRules = useCallback(_sortByRules, []);
  const getCustomerTag = useCallback(_getCustomerTag, []);
  const getQualityIndicators = useCallback(_getQualityIndicators, []);
  return { getMealPeriod, calculateScore, sortByRules, getCustomerTag, getQualityIndicators };
}
