"use client";

import { FALLBACK_IMAGE, PREP_LABEL, formatPrice } from "@/lib/constants";
import Image from "next/image";
import { MenuItem } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import { incrementView } from "@/lib/supabase";
import { useEffect, useRef } from "react";

interface Props {
  item: MenuItem;
  onClick: () => void;
  variant?: "quick" | "grid" | "list";
  priority?: boolean;
  restaurantId?: string;
  onView?: (itemId: number) => void;
}

function Tag({ tag }: { tag: string }) {
  const isPopular = tag.includes("Popular");
  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${
      isPopular ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-900"
    }`}>{tag}</span>
  );
}

function PrepBadge({ prep }: { prep: "fast" | "medium" | "slow" }) {
  const colors = { fast: "bg-emerald-100 text-emerald-700", medium: "bg-yellow-100 text-yellow-700", slow: "bg-red-100 text-red-600" };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colors[prep]}`}>
      {PREP_LABEL[prep]}
    </span>
  );
}

function Img({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <Image
      src={src} alt={alt} fill sizes={sizes}
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      placeholder="empty"
      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
    />
  );
}

function QtyControls({ qty, onInc, onDec }: { qty: number; onInc: (e: React.MouseEvent) => void; onDec: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <button onClick={onDec} className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm active:scale-90 transition-all">−</button>
      <span className="font-display font-bold text-xs text-stone-900 w-4 text-center">{qty}</span>
      <button onClick={onInc} className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm active:scale-90 transition-all">+</button>
    </div>
  );
}

export default function ItemCard({ item, onClick, variant = "list", priority = false, restaurantId, onView }: Props) {
  const { items, add, increment, decrement } = useCart();
  const cartItem = items.find(i => i.id === item.id);
  const qty      = cartItem?.quantity ?? 0;
  const cardRef  = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // ── IntersectionObserver: fire incrementView ONCE when card enters viewport ──
  // This fixes the double-counting bug where click also incremented views.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || viewedRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          incrementView(item.id, restaurantId);
          onView?.(item.id);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, restaurantId, onView]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    add({ id: item.id, name: item.name, price: item.price, image: item.image });
  };
  const handleInc = (e: React.MouseEvent) => { e.stopPropagation(); increment(item.id); };
  const handleDec = (e: React.MouseEvent) => { e.stopPropagation(); decrement(item.id); };

  if (variant === "quick") {
    return (
      <button ref={cardRef as React.RefObject<HTMLButtonElement>} onClick={onClick} aria-label={item.name}
        className="flex-shrink-0 w-36 snap-start group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
          <div className="relative h-24 bg-stone-100">
            <Img src={item.image} alt={item.name} sizes="144px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
            {qty > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">{qty}</span>
            )}
          </div>
          <div className="p-2.5">
            <p className="font-display font-semibold text-stone-900 text-xs line-clamp-1">{item.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-orange-600 font-bold text-xs">{formatPrice(item.price)}</p>
              {qty > 0
                ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} />
                : <button onClick={handleAdd} className="w-5 h-5 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold active:scale-90 transition-all">+</button>
              }
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button ref={cardRef as React.RefObject<HTMLButtonElement>} onClick={onClick} aria-label={item.name}
        className="w-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
          <div className="relative h-28 bg-stone-100">
            <Img src={item.image} alt={item.name} sizes="(max-width:448px) 50vw, 224px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
            {qty > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">{qty}</span>
            )}
          </div>
          <div className="p-3">
            <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-orange-600 font-bold text-sm">{formatPrice(item.price)}</p>
              <PrepBadge prep={item.prep_time} />
            </div>
            <div className="flex items-center justify-end mt-1.5">
              {qty > 0
                ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} />
                : <button onClick={handleAdd} className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold active:scale-90 transition-all">+</button>
              }
            </div>
          </div>
        </div>
      </button>
    );
  }

  // list variant
  return (
    <button ref={cardRef as React.RefObject<HTMLButtonElement>} onClick={onClick} aria-label={item.name}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-stone-100 hover:border-orange-100 hover:shadow-md active:scale-[0.98] transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="relative w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <Img src={item.image} alt={item.name} sizes="68px" priority={priority} />
        {!item.available && (
          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold uppercase tracking-wide">Sold Out</span>
          </div>
        )}
        {qty > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">{qty}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
        <p className="text-stone-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <p className="text-orange-600 font-bold text-sm">{formatPrice(item.price)}</p>
            <PrepBadge prep={item.prep_time} />
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {item.tag && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                item.tag.includes("Popular") ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-700"
              }`}>{item.tag}</span>
            )}
            {qty > 0
              ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} />
              : <button onClick={handleAdd} className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold active:scale-90 transition-all">+</button>
            }
          </div>
        </div>
      </div>
    </button>
  );
}
