"use client";

import Image from "next/image";
import { MenuItem } from "@/data/menuData";
import { useRuleEngine } from "@/hooks/useRuleEngine";

interface Props {
  items: MenuItem[];
  kitchenStatus: "normal" | "busy";
  onKitchenStatusChange: (s: "normal" | "busy") => void;
  onItemsChange: (items: MenuItem[]) => void;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-stone-300"}`}
      aria-label="Toggle"
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  );
}

function StatCard({ value, label, color = "text-orange-500" }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function OwnerDashboard({ items, kitchenStatus, onKitchenStatusChange, onItemsChange }: Props) {
  const { getQualityIndicators } = useRuleEngine();
  const qualityIndicators = getQualityIndicators(items);

  const toggleAvailability = (id: number) =>
    onItemsChange(items.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));

  const toggleFeatured = (id: number) =>
    onItemsChange(items.map((i) => (i.id === id ? { ...i, featured: !i.featured } : i)));

  const totalViews  = items.reduce((s, i) => s + i.views, 0);
  const totalClicks = items.reduce((s, i) => s + i.clicks, 0);
  const avgCTR      = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  const topPerformers   = [...items].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  const needsAttention  = items.filter((i) => {
    const ctr = i.views > 0 ? i.clicks / i.views : 0;
    return i.views > 100 && ctr < 0.15;
  });
  const promoteItems    = items.filter((i) => i.profit_tag === "high" && i.views < 50);

  return (
    <div className="min-h-screen pb-24 bg-stone-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-stone-900">Admin Dashboard</h1>
          <p className="text-xs text-stone-400">Menu · Insights · Kitchen</p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-5">

        {/* Kitchen Mode */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-stone-900 text-sm">Kitchen Mode</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {kitchenStatus === "normal" ? "✅ Accepting all orders" : "🔴 Busy — fast items prioritised"}
              </p>
            </div>
            <Toggle enabled={kitchenStatus === "normal"} onChange={(v) => onKitchenStatusChange(v ? "normal" : "busy")} />
          </div>
        </div>

        {/* Analytics */}
        <div>
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Analytics</h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard value={totalViews.toLocaleString()} label="Views" />
            <StatCard value={totalClicks.toLocaleString()} label="Clicks" color="text-blue-500" />
            <StatCard value={`${avgCTR}%`} label="CTR" color="text-emerald-600" />
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">🏆 Top Performers</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-50">
            {topPerformers.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-bold text-stone-300 w-4">#{idx + 1}</span>
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill sizes="36px" className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">{item.name}</p>
                  <p className="text-xs text-stone-400">{item.clicks} clicks · {item.views} views</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.profit_tag === "high" ? "bg-emerald-100 text-emerald-700" :
                  item.profit_tag === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-stone-100 text-stone-500"
                }`}>
                  {item.profit_tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">⚠️ Needs Attention</h2>
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 space-y-2">
              <p className="text-xs text-orange-600">High views, low clicks — improve image or name</p>
              {needsAttention.slice(0, 4).map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="font-medium text-orange-900 truncate flex-1 mr-2">{item.name}</span>
                  <span className="text-orange-600 whitespace-nowrap">{item.views}v / {item.clicks}c</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promote */}
        {promoteItems.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">📈 Promote These</h2>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 space-y-2">
              <p className="text-xs text-emerald-600">High-profit items with low visibility — feature them</p>
              {promoteItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="font-medium text-emerald-900 truncate flex-1 mr-2">{item.name}</span>
                  <span className="text-emerald-600">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Management */}
        <div>
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Menu Items ({items.length})</h2>
          <div className="space-y-2">
            {items.map((item) => {
              const indicator = qualityIndicators[item.id];
              return (
                <div key={item.id}
                  className={`bg-white rounded-2xl p-3 shadow-sm border transition-opacity ${
                    !item.available ? "border-stone-100 opacity-50" : "border-stone-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-400">₹{item.price} · {item.views}v · {item.clicks}c</p>
                    </div>
                    {indicator && (
                      <span className="text-xs font-medium text-stone-500 px-2 py-0.5 bg-stone-50 rounded-lg border border-stone-100 whitespace-nowrap">
                        {indicator.label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAvailability(item.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        item.available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}>
                      {item.available ? "Available" : "Sold Out"}
                    </button>
                    <button onClick={() => toggleFeatured(item.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        item.featured ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}>
                      {item.featured ? "⭐ Featured" : "Feature"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
