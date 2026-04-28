"use client";

import { useEffect } from "react";
import Image from "next/image";
import { MenuItem, comboSuggestions, initialMenuItems } from "@/data/menuData";

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onComboItemClick?: (item: MenuItem) => void;
}

export default function ItemModal({ item, onClose, onComboItemClick }: ItemModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const comboNames = comboSuggestions[item.name] ?? [];
  const comboItems = comboNames
    .map((name) => initialMenuItems.find((i) => i.name === name))
    .filter(Boolean) as MenuItem[];

  const prepLabel =
    item.prep_time === "fast" ? "⚡ Quick" :
    item.prep_time === "medium" ? "⏱ ~15 min" : "🕐 ~30 min";

  const prepColor =
    item.prep_time === "fast" ? "bg-green-100 text-green-700" :
    item.prep_time === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative h-56 w-full overflow-hidden bg-stone-100">
          <Image src={item.image} alt={item.name} fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover" priority
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {item.tag && (
            <span className={`absolute top-4 left-4 px-3 py-1 text-sm font-bold rounded-full shadow-md ${
              item.tag.includes("Popular") ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-900"
            }`}>
              {item.tag}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-stone-900 leading-tight">{item.name}</h2>
            <p className="text-orange-600 text-xl font-bold whitespace-nowrap">₹{item.price}</p>
          </div>

          <p className="text-stone-500 text-sm leading-relaxed mb-4">{item.description}</p>

          <div className="flex items-center gap-2 mb-5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${prepColor}`}>{prepLabel}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">{item.category}</span>
            {item.profit_tag === "high" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Best value</span>
            )}
          </div>

          {/* Combo suggestion */}
          {comboItems.length > 0 && (
            <div className="mb-5 bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-orange-900 mb-2">🎯 Make it a combo</p>
              <p className="text-xs text-orange-700 mb-3">Pairs perfectly with:</p>
              <div className="flex gap-2 flex-wrap">
                {comboItems.map((ci) => (
                  <button
                    key={ci.id}
                    onClick={() => { onComboItemClick?.(ci); }}
                    className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-100 transition-colors"
                  >
                    <span>{ci.name}</span>
                    <span className="text-orange-500 font-bold">+₹{ci.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-2xl transition-colors text-sm"
          >
            Back to Menu
          </button>
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
