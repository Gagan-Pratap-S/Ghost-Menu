"use client";

import { useEffect } from "react";
import Image from "next/image";
import { MenuItem, comboSuggestions, initialMenuItems } from "@/data/menuData";
import { useCart, lockScroll, unlockScroll } from "@/context/CartContext";
import { FALLBACK_IMAGE } from "@/lib/constants";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
  onComboItemClick?: (item: MenuItem) => void;
}

export default function ItemModal({ item, onClose, onComboItemClick }: Props) {
  const { items: cartItems, add, increment, decrement } = useCart();

  useEffect(() => {
    if (item) { lockScroll(); return unlockScroll; }
  }, [item]);

  if (!item) return null;

  const cartEntry = cartItems.find(i => i.id === item.id);
  const qty       = cartEntry?.quantity ?? 0;

  const comboItems = (comboSuggestions[item.name] ?? [])
    .map(name => initialMenuItems.find(i => i.name === name))
    .filter(Boolean) as MenuItem[];

  const prepLabel = { fast: "⚡ Quick (5–10 min)", medium: "⏱ ~15 min", slow: "🕐 ~30 min" }[item.prep_time];
  const prepStyle = {
    fast:   { background: "rgba(34,197,94,0.1)",  border: "1px solid rgba(34,197,94,0.2)",  color: "#4ade80" },
    medium: { background: "rgba(234,179,8,0.1)",  border: "1px solid rgba(234,179,8,0.2)",  color: "#fbbf24" },
    slow:   { background: "rgba(239,68,68,0.1)",  border: "1px solid rgba(239,68,68,0.2)",  color: "#f87171" },
  }[item.prep_time];

  const handleAdd = () => add({ id: item.id, name: item.name, price: item.price, image: item.image });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 animate-fadeIn" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />

      <div className="relative w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-slideUp"
        style={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none" }}
      >
        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white text-base transition-all active:scale-90"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
        >×</button>

        {/* Image */}
        <div className="relative h-52 w-full rounded-t-3xl overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
          <Image src={item.image} alt={item.name} fill sizes="448px" className="object-cover" priority
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 50%)" }} />
          {item.tag && (
            <span className="absolute bottom-3 left-4 px-3 py-1 text-xs font-bold rounded-full"
              style={item.tag.includes("Popular")
                ? { background: "#f97316", color: "#fff", boxShadow: "0 2px 12px rgba(249,115,22,0.4)" }
                : { background: "rgba(251,191,36,0.9)", color: "#78350f" }
              }
            >{item.tag}</span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-display font-extrabold text-xl text-white leading-snug flex-1 tracking-tight">{item.name}</h2>
            <span className="text-orange-400 font-display text-xl font-bold whitespace-nowrap price tabular-nums">₹{item.price}</span>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.description}</p>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={prepStyle}>{prepLabel}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>{item.category}</span>
            {item.profit_tag === "high" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>Best value</span>
            )}
          </div>

          {comboItems.length > 0 && (
            <div className="mb-5 rounded-2xl p-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <p className="font-display font-bold text-sm text-orange-300 mb-1">🎯 Make it a combo</p>
              <p className="text-xs text-slate-500 mb-3">Pairs perfectly with:</p>
              <div className="flex flex-wrap gap-2">
                {comboItems.map(ci => (
                  <button key={ci.id} onClick={() => onComboItemClick?.(ci)}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}
                  >
                    <span>{ci.name}</span>
                    <span className="font-bold text-orange-500">+₹{ci.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cart CTA */}
          {qty === 0 ? (
            <button onClick={handleAdd} className="btn-primary w-full py-3.5 text-sm">
              Add to Cart · ₹{item.price}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => decrement(item.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl font-bold text-white transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >−</button>
              <span className="flex-1 text-center font-display font-bold text-white tabular-nums">{qty} in cart</span>
              <button onClick={() => increment(item.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl font-bold text-white transition-all active:scale-90"
                style={{ background: "#f97316", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}
              >+</button>
            </div>
          )}

          <button onClick={onClose}
            className="btn-ghost w-full py-3 text-sm mt-3"
          >Back to Menu</button>
        </div>
      </div>
    </div>
  );
}
