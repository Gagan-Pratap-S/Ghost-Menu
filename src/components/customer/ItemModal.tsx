"use client";

import { useEffect } from "react";
import Image from "next/image";
import { MenuItem, comboSuggestions, initialMenuItems } from "@/data/menuData";
import { useCart, lockScroll, unlockScroll } from "@/context/CartContext";
import { FALLBACK_IMAGE, PREP_LABEL, formatPrice } from "@/lib/constants";
import { incrementView } from "@/lib/supabase";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
  onComboItemClick?: (item: MenuItem) => void;
  restaurantId?: string;
}

export default function ItemModal({ item, onClose, onComboItemClick, restaurantId }: Props) {
  const { items: cartItems, add, increment, decrement } = useCart();

  useEffect(() => {
    if (item) {
      lockScroll();
      incrementView(item.id, restaurantId);
      return unlockScroll;
    }
  }, [item, restaurantId]);

  if (!item) return null;

  const cartEntry = cartItems.find(i => i.id === item.id);
  const qty       = cartEntry?.quantity ?? 0;

  const comboItems = (comboSuggestions[item.name] ?? [])
    .map(name => initialMenuItems.find(i => i.name === name))
    .filter(Boolean) as MenuItem[];

  const prepStyle = {
    fast:   { background: "var(--gm-success-bg)", border: "1px solid var(--gm-success-border)", color: "#15803D" },
    medium: { background: "var(--gm-warning-bg)", border: "1px solid var(--gm-warning-border)", color: "#92400E" },
    slow:   { background: "var(--gm-danger-bg)",  border: "1px solid var(--gm-danger-border)",  color: "#B91C1C" },
  }[item.prep_time];

  const handleAdd = () => {
    add({ id: item.id, name: item.name, price: item.price, image: item.image });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} role="dialog" aria-modal="true" aria-label={item.name}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
        className="animate-fadeIn" onClick={onClose} />

      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "var(--gm-surface)", borderTopLeftRadius: "var(--gm-radius-xl)", borderTopRightRadius: "var(--gm-radius-xl)", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--gm-shadow-xl)", paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}
        className="gm-animate-slide-up">

        {/* Close button */}
        <button onClick={onClose} aria-label="Close" className="gm-icon-btn"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 18 }}>
          ×
        </button>

        {/* Image */}
        <div style={{ position: "relative", height: 210, background: "var(--gm-bg)", borderTopLeftRadius: "var(--gm-radius-xl)", borderTopRightRadius: "var(--gm-radius-xl)", overflow: "hidden" }}>
          <Image src={item.image} alt={item.name} fill sizes="448px" className="object-cover" priority
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }} />
          {item.tag && (
            <span style={{ position: "absolute", bottom: 12, left: 16, padding: "4px 10px", fontSize: 11, fontWeight: 700, borderRadius: 99,
              ...(item.tag.includes("Popular") ? { background: "var(--gm-primary)", color: "#fff" } : { background: "rgba(251,191,36,0.9)", color: "#78350f" }) }}>
              {item.tag}
            </span>
          )}
        </div>

        <div style={{ padding: 20 }}>
          {/* Title + price */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gm-text)", lineHeight: 1.2, flex: 1, margin: 0 }}>{item.name}</h2>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--gm-primary)", whiteSpace: "nowrap" }} className="price tabular-nums">
              {formatPrice(item.price)}
            </span>
          </div>

          <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>{item.description}</p>

          {/* Meta badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <span style={{ ...prepStyle, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 99 }}>
              {item.prep_time === "fast" ? "⚡" : item.prep_time === "medium" ? "⏱" : "🕐"} {PREP_LABEL[item.prep_time]}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 99, background: "var(--gm-bg)", border: "1px solid var(--gm-border)", color: "var(--gm-text-secondary)" }}>{item.category}</span>
            {item.profit_tag === "high" && (
              <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 99, background: "var(--gm-success-bg)", border: "1px solid var(--gm-success-border)", color: "#15803D" }}>Best value</span>
            )}
            {item.tags?.map(t => (
              <span key={t} style={{ fontSize: 12, fontWeight: 500, padding: "3px 8px", borderRadius: 99, background: "var(--gm-bg)", border: "1px solid var(--gm-border)", color: "var(--gm-text-secondary)" }}>{t}</span>
            ))}
          </div>

          {/* Combo suggestions */}
          {comboItems.length > 0 && (
            <div style={{ marginBottom: 20, background: "#FFF7ED", border: "1px solid rgba(255,122,0,0.25)", borderRadius: "var(--gm-radius-md)", padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#C2410C", marginBottom: 4 }}>🎯 Make it a combo</p>
              <p style={{ fontSize: 13, color: "#92400E", marginBottom: 12 }}>Pairs perfectly with:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {comboItems.map(ci => (
                  <button key={ci.id} onClick={() => onComboItemClick?.(ci)} className="gm-btn-ghost"
                    style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: "var(--gm-radius-md)", padding: "8px 12px", fontSize: 13, fontWeight: 500 }}>
                    <span>{ci.name}</span>
                    <span style={{ fontWeight: 700, color: "var(--gm-primary)" }}>+{formatPrice(ci.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {qty === 0 ? (
            <button onClick={(e) => {
              handleAdd();
              const btn = e.currentTarget as HTMLButtonElement;
              btn.classList.add('gm-animate-cart-pop');
              setTimeout(() => btn.classList.remove('gm-animate-cart-pop'), 300);
            }} className="gm-btn-primary" style={{ width: "100%", fontSize: "var(--gm-font-label)" }}>
              Add to Cart · {formatPrice(item.price)}
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--gm-bg)", borderRadius: "var(--gm-radius-md)", padding: "12px 16px" }}>
              <button onClick={() => decrement(item.id)} className="gm-icon-btn" style={{ width: 40, height: 40, fontSize: 18, fontWeight: 600 }}>−</button>
              <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--gm-text)" }} className="tabular-nums">{qty} in cart</span>
              <button onClick={() => {
                increment(item.id);
                const btn = event?.currentTarget as HTMLButtonElement;
                if (btn) {
                  btn.classList.add('gm-animate-cart-pop');
                  setTimeout(() => btn.classList.remove('gm-animate-cart-pop'), 300);
                }
              }} className="gm-add-btn" style={{ width: 40, height: 40, fontSize: 18 }}>+</button>
            </div>
          )}

          <button onClick={onClose} className="gm-btn-ghost" style={{ width: "100%", marginTop: 12 }}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
