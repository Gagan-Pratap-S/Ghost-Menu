"use client";

import { useState, useEffect, useMemo } from "react";
import { getStoredAnalytics, AnalyticsEvent } from "@/context/AnalyticsContext";

interface AnalyticsData {
  totalEvents: number;
  uniqueSessions: number;
  menuViews: number;
  itemViews: number;
  cartAdditions: number;
  ordersPlaced: number;
  searches: number;
  feedbacks: number;
  avgOrderValue: number;
  popularItems: Array<{ name: string; views: number; adds: number }>;
  popularCategories: Array<{ category: string; views: number }>;
  searchTerms: Array<{ term: string; count: number }>;
  hourlyActivity: Array<{ hour: number; events: number }>;
  dailyActivity: Array<{ date: string; events: number }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const events = getStoredAnalytics();
    const now = Date.now();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    const filteredEvents = events.filter(event => event.timestamp > cutoff);

    // Process analytics data
    const sessions = new Set(filteredEvents.map(e => e.sessionId));
    const menuViews = filteredEvents.filter(e => e.event === 'menu_view').length;
    const itemViews = filteredEvents.filter(e => e.event === 'item_view').length;
    const cartAdditions = filteredEvents.filter(e => e.event === 'add_to_cart').length;
    const ordersPlaced = filteredEvents.filter(e => e.event === 'order_placed').length;
    const searches = filteredEvents.filter(e => e.event === 'search').length;
    const feedbacks = filteredEvents.filter(e => e.event === 'feedback').length;

    // Calculate average order value
    const orderEvents = filteredEvents.filter(e => e.event === 'order_placed');
    const avgOrderValue = orderEvents.length > 0
      ? orderEvents.reduce((sum, e) => sum + (e.metadata?.total || 0), 0) / orderEvents.length
      : 0;

    // Popular items
    const itemStats: Record<string, { views: number; adds: number }> = {};
    filteredEvents.forEach(event => {
      if (event.event === 'item_view' && event.metadata?.itemName) {
        const name = event.metadata.itemName;
        itemStats[name] = itemStats[name] || { views: 0, adds: 0 };
        itemStats[name].views++;
      } else if (event.event === 'add_to_cart' && event.metadata?.itemName) {
        const name = event.metadata.itemName;
        itemStats[name] = itemStats[name] || { views: 0, adds: 0 };
        itemStats[name].adds++;
      }
    });

    const popularItems = Object.entries(itemStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Popular categories
    const categoryStats: Record<string, number> = {};
    filteredEvents
      .filter(e => e.event === 'item_view' && e.metadata?.category)
      .forEach(e => {
        if (e.metadata?.category) {
          const category = e.metadata.category;
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        }
      });

    const popularCategories = Object.entries(categoryStats)
      .map(([category, views]) => ({ category, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Search terms
    const searchStats: Record<string, number> = {};
    filteredEvents
      .filter(e => e.event === 'search' && e.metadata?.query)
      .forEach(e => {
        if (e.metadata?.query) {
          const query = e.metadata.query.toLowerCase();
          searchStats[query] = (searchStats[query] || 0) + 1;
        }
      });

    const searchTerms = Object.entries(searchStats)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly activity
    const hourlyStats: Record<number, number> = {};
    filteredEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      events: hourlyStats[hour] || 0,
    }));

    // Daily activity
    const dailyStats: Record<string, number> = {};
    filteredEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    const dailyActivity = Object.entries(dailyStats)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);

    setAnalyticsData({
      totalEvents: filteredEvents.length,
      uniqueSessions: sessions.size,
      menuViews,
      itemViews,
      cartAdditions,
      ordersPlaced,
      searches,
      feedbacks,
      avgOrderValue,
      popularItems,
      popularCategories,
      searchTerms,
      hourlyActivity,
      dailyActivity,
    });
  }, [timeRange]);

  if (!analyticsData) {
    return (
      <div className="gm-card" style={{ padding: "40px", textAlign: "center" }}>
        <div className="gm-skeleton" style={{ height: 24, width: 200, margin: "0 auto 16px" }} />
        <div className="gm-skeleton" style={{ height: 16, width: 300, margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "var(--gm-font-page-title)", fontWeight: 600, margin: 0 }}>
          Analytics Dashboard
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
          className="gm-input"
          style={{ width: "auto", minWidth: 120 }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <MetricCard title="Total Events" value={analyticsData.totalEvents.toLocaleString()} />
        <MetricCard title="Unique Sessions" value={analyticsData.uniqueSessions.toLocaleString()} />
        <MetricCard title="Menu Views" value={analyticsData.menuViews.toLocaleString()} />
        <MetricCard title="Item Views" value={analyticsData.itemViews.toLocaleString()} />
        <MetricCard title="Cart Additions" value={analyticsData.cartAdditions.toLocaleString()} />
        <MetricCard title="Orders Placed" value={analyticsData.ordersPlaced.toLocaleString()} />
        <MetricCard title="Searches" value={analyticsData.searches.toLocaleString()} />
        <MetricCard title="Feedbacks" value={analyticsData.feedbacks.toLocaleString()} />
        <MetricCard
          title="Avg Order Value"
          value={`$${analyticsData.avgOrderValue.toFixed(2)}`}
        />
      </div>

      {/* Charts and Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        {/* Popular Items */}
        <div className="gm-card">
          <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 16px" }}>
            Popular Items
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {analyticsData.popularItems.map((item, index) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--gm-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: "var(--gm-font-label)", fontWeight: 500 }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: "var(--gm-font-caption)" }}>
                  <span>{item.views} views</span>
                  <span>{item.adds} adds</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="gm-card">
          <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 16px" }}>
            Popular Categories
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {analyticsData.popularCategories.map((cat, index) => (
              <div key={cat.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--gm-tint-orange)",
                    color: "var(--gm-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: "var(--gm-font-label)", fontWeight: 500 }}>
                    {cat.category}
                  </span>
                </div>
                <span style={{ fontSize: "var(--gm-font-caption)" }}>
                  {cat.views} views
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search Terms */}
        <div className="gm-card">
          <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 16px" }}>
            Popular Search Terms
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {analyticsData.searchTerms.map((search, index) => (
              <div key={search.term} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--gm-info-bg)",
                    color: "var(--gm-info)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: "var(--gm-font-label)", fontWeight: 500 }}>
                    "{search.term}"
                  </span>
                </div>
                <span style={{ fontSize: "var(--gm-font-caption)" }}>
                  {search.count} searches
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="gm-card">
          <h3 style={{ fontSize: "var(--gm-font-section-title)", fontWeight: 600, margin: "0 0 16px" }}>
            Hourly Activity
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {analyticsData.hourlyActivity.map((hour) => (
              <div key={hour.hour} style={{ textAlign: "center" }}>
                <div style={{
                  height: Math.max(20, (hour.events / Math.max(...analyticsData.hourlyActivity.map(h => h.events))) * 60),
                  background: "var(--gm-primary)",
                  borderRadius: 4,
                  marginBottom: 4
                }} />
                <div style={{ fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)" }}>
                  {hour.hour}:00
                </div>
                <div style={{ fontSize: "var(--gm-font-caption)", fontWeight: 500 }}>
                  {hour.events}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="gm-card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "var(--gm-font-caption)", color: "var(--gm-text-secondary)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: "var(--gm-font-page-title)", fontWeight: 700, color: "var(--gm-primary)" }}>
        {value}
      </div>
    </div>
  );
}