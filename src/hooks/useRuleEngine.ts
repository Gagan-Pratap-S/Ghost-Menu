import { MenuItem } from "@/data/menuData";

export function useRuleEngine() {
  const getMealPeriod = (): "breakfast" | "lunch" | "dinner" | "snacks" => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "breakfast";
    if (hour >= 12 && hour < 16) return "lunch";
    if (hour >= 16 && hour < 21) return "snacks";
    return "dinner";
  };

  /**
   * Balanced scoring — no single factor dominates.
   *   clicks (normalised 0–30)    → primary signal
   *   profit_tag high             → +12 / medium → +5
   *   featured                    → +6
   *   combo category              → +10 extra boost
   *   time-of-day match           → +10
   *   busy kitchen fast item      → +15 / slow → −15
   *   personalization (viewed)    → +4
   *   freshness (new item)        → +6
   *   decay (high views + low CTR)→ −10
   */
  const calculateScore = (
    item: MenuItem,
    kitchenStatus: "normal" | "busy",
    viewedItemIds: number[] = []
  ): number => {
    let score = 0;

    // Clicks — primary signal
    const maxClicksRef = 200;
    score += Math.min(item.clicks / maxClicksRef, 1) * 30;

    // Profit
    if (item.profit_tag === "high") score += 12;
    else if (item.profit_tag === "medium") score += 5;

    // Featured
    if (item.featured) score += 6;

    // Combos boost
    if (item.category === "Combos") score += 10;

    // Kitchen mode
    if (kitchenStatus === "busy") {
      if (item.prep_time === "fast") score += 15;
      if (item.prep_time === "slow") score -= 15;
    }

    // Time of day
    const mealPeriod = getMealPeriod();
    const timeBoostMap: Record<string, string[]> = {
      breakfast: ["Breakfast", "Beverages"],
      lunch:     ["Mains", "Starters", "Combos"],
      dinner:    ["Mains", "Combos", "Desserts"],
      snacks:    ["Starters", "Beverages", "Desserts"],
    };
    if (timeBoostMap[mealPeriod]?.includes(item.category)) score += 10;

    // Personalization — slight nudge for viewed items
    if (viewedItemIds.includes(item.id)) score += 4;

    // Freshness (low total interactions)
    const totalInteractions = item.views + item.clicks;
    if (totalInteractions < 30) score += 6;

    // Decay — high views but no one clicks
    if (item.views > 80) {
      const ctr = item.clicks / item.views;
      if (ctr < 0.08) score -= 10;
    }

    return score;
  };

  const sortByRules = (
    items: MenuItem[],
    kitchenStatus: "normal" | "busy",
    viewedItemIds: number[] = []
  ): MenuItem[] => {
    return [...items].sort(
      (a, b) =>
        calculateScore(b, kitchenStatus, viewedItemIds) -
        calculateScore(a, kitchenStatus, viewedItemIds)
    );
  };

  // Single tag shown on the customer card
  const getCustomerTag = (item: MenuItem): string | null => {
    if (item.clicks > 50) return "🔥 Popular";
    if (item.featured) return "⭐ Chef Special";
    return null;
  };

  // Admin quality indicators
  const getQualityIndicators = (
    items: MenuItem[]
  ): Record<number, { label: string; suggestion: string } | null> => {
    const indicators: Record<number, { label: string; suggestion: string } | null> = {};
    items.forEach((item) => {
      const ctr = item.views > 0 ? item.clicks / item.views : 0;
      if (item.views > 100 && ctr < 0.15) {
        indicators[item.id] = {
          label: "⚠️ Low conversion",
          suggestion: "Improve the image or rename the item",
        };
      } else if (item.profit_tag === "high" && item.views < 50) {
        indicators[item.id] = {
          label: "📈 Promote this",
          suggestion: "High-profit item with low visibility — feature it",
        };
      } else if (item.clicks > 50 && item.views < 150) {
        indicators[item.id] = {
          label: "✨ High performer",
          suggestion: "Strong CTR — consider featuring",
        };
      } else {
        indicators[item.id] = null;
      }
    });
    return indicators;
  };

  return { getMealPeriod, calculateScore, sortByRules, getQualityIndicators, getCustomerTag };
}
