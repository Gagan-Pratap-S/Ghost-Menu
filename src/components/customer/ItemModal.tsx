"use client";

import { useEffect } from "react";
import Image from "next/image";
import { MenuItem, comboSuggestions, initialMenuItems } from "@/data/menuData";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
  onComboItemClick?: (item: MenuItem) => void;
}

export default function ItemModal({ item, onClose, onComboItemClick }: Props) {
  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const comboItems = (comboSuggestions[item.name] ?? [])
    .map((name) => initialMenuItems.find((i) => i.name === name))
    .filter(Boolean) as MenuItem[];

  const prepLabel = { fast: "⚡ Quick (5–10 min)", medium: "⏱ ~15 min", slow: "🕐 ~30 min" }[item.prep_time];
  const prepColor = { fast: "bg-emerald-100 text-emerald-700", medium: "bg-yellow-100 text-yellow-700", slow: "bg-red-100 text-red-600" }[item.prep_time];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={item.name}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative h-52 w-full bg-stone-200 overflow-hidden rounded-t-3xl">
          <Image src={item.image} alt={item.name} fill sizes="448px"
            className="object-cover" priority
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {item.tag && (
            <span className={`absolute bottom-3 left-4 px-3 py-1 text-xs font-bold rounded-full shadow ${
              item.tag.includes("Popular") ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-900"
            }`}>{item.tag}</span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-display text-xl font-bold text-stone-900 leading-snug flex-1">{item.name}</h2>
            <span className="text-orange-600 font-display text-xl font-bold whitespace-nowrap">₹{item.price}</span>
          </div>

          <p className="text-stone-500 text-sm leading-relaxed mb-4">{item.description}</p>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${prepColor}`}>{prepLabel}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">{item.category}</span>
            {item.profit_tag === "high" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Best value</span>
            )}
          </div>

          {/* Combo suggestion */}
          {comboItems.length > 0 && (
            <div className="mb-5 bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="font-display font-bold text-sm text-orange-900 mb-1">🎯 Make it a combo</p>
              <p className="text-xs text-orange-600 mb-3">Pairs perfectly with:</p>
              <div className="flex flex-wrap gap-2">
                {comboItems.map((ci) => (
                  <button key={ci.id} onClick={() => onComboItemClick?.(ci)}
                    className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-100 active:scale-95 transition-all"
                  >
                    <span>{ci.name}</span>
                    <span className="text-orange-500 font-bold">+₹{ci.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-display font-bold rounded-2xl text-sm transition-colors shadow-md shadow-orange-200"
          >
            Back to Menu
          </button>
          <div className="h-safe-bottom" />
        </div>
      </div>
    </div>
  );
}
