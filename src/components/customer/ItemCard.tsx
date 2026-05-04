"use client";

import Image from "next/image";
import { MenuItem } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE } from "@/lib/constants";

interface Props {
  item: MenuItem;
  onClick: () => void;
  variant?: "quick" | "grid" | "list";
  priority?: boolean;
}

function Tag({ tag }: { tag: string }) {
  const isPopular = tag.includes("Popular");
  return (
    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full"
      style={isPopular
        ? { background: "#f97316", color: "#fff", boxShadow: "0 2px 8px rgba(249,115,22,0.4)" }
        : { background: "rgba(251,191,36,0.9)", color: "#78350f" }
      }
    >{tag}</span>
  );
}

function Img({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <Image src={src} alt={alt} fill sizes={sizes}
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      priority={priority}
      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
    />
  );
}

function QtyControls({ qty, onInc, onDec }: { qty: number; onInc: (e: React.MouseEvent) => void; onDec: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <button onClick={onDec}
        className="w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs active:scale-90 transition-all text-white"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
      >−</button>
      <span className="font-display font-bold text-xs text-white w-4 text-center tabular-nums">{qty}</span>
      <button onClick={onInc}
        className="w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs active:scale-90 transition-all text-white"
        style={{ background: "#f97316" }}
      >+</button>
    </div>
  );
}

function AddButton({ onAdd }: { onAdd: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onAdd}
      className="w-6 h-6 flex items-center justify-center rounded-full text-white font-bold text-xs active:scale-90 transition-all"
      style={{ background: "#f97316", boxShadow: "0 2px 8px rgba(249,115,22,0.35)" }}
    >+</button>
  );
}

const cardBase = { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)" };

export default function ItemCard({ item, onClick, variant = "list", priority = false }: Props) {
  const { items, add, increment, decrement } = useCart();
  const cartItem = items.find(i => i.id === item.id);
  const qty      = cartItem?.quantity ?? 0;
  const isUnavailable = !item.available;

  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); add({ id: item.id, name: item.name, price: item.price, image: item.image }); };
  const handleInc = (e: React.MouseEvent) => { e.stopPropagation(); increment(item.id); };
  const handleDec = (e: React.MouseEvent) => { e.stopPropagation(); decrement(item.id); };

  if (variant === "quick") {
    return (
      <button onClick={onClick} aria-label={item.name}
        className={`flex-shrink-0 w-36 snap-start group cursor-pointer focus:outline-none rounded-2xl ${isUnavailable ? "item-unavailable" : ""}`}
      >
        <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95" style={cardBase}>
          <div className="relative h-24" style={{ background: "rgba(30,41,59,0.8)" }}>
            <Img src={item.image} alt={item.name} sizes="144px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
            {qty > 0 && <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums" style={{ background: "#f97316" }}>{qty}</span>}
            {isUnavailable && <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(2,6,23,0.6)" }}><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unavailable</span></div>}
          </div>
          <div className="p-2.5">
            <p className="font-display font-semibold text-white text-xs line-clamp-1 tracking-tight">{item.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-orange-400 font-bold text-xs price tabular-nums">₹{item.price}</p>
              {!isUnavailable && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button onClick={onClick} aria-label={item.name}
        className={`w-full group cursor-pointer focus:outline-none rounded-2xl ${isUnavailable ? "item-unavailable" : ""}`}
      >
        <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95" style={cardBase}>
          <div className="relative h-28" style={{ background: "rgba(30,41,59,0.8)" }}>
            <Img src={item.image} alt={item.name} sizes="(max-width:448px) 50vw, 224px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
            {qty > 0 && <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums" style={{ background: "#f97316" }}>{qty}</span>}
            {isUnavailable && <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(2,6,23,0.6)" }}><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unavailable</span></div>}
          </div>
          <div className="p-3">
            <p className="font-display font-semibold text-white text-sm line-clamp-1 tracking-tight">{item.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-orange-400 font-bold text-sm price tabular-nums">₹{item.price}</p>
              {!isUnavailable && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} aria-label={item.name}
      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left group cursor-pointer focus:outline-none transition-all active:scale-[0.98] ${isUnavailable ? "item-unavailable" : ""}`}
      style={cardBase}
      onMouseEnter={e => { if (!isUnavailable) (e.currentTarget as HTMLElement).style.border = "1px solid rgba(249,115,22,0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.06)"; }}
    >
      <div className="relative w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
        <Img src={item.image} alt={item.name} sizes="68px" priority={priority} />
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(2,6,23,0.7)" }}>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-tight text-center">Un<br/>avail</span>
          </div>
        )}
        {qty > 0 && !isUnavailable && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white tabular-nums" style={{ background: "#f97316" }}>{qty}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white text-sm line-clamp-1 tracking-tight">{item.name}</p>
        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-orange-400 font-bold text-sm price tabular-nums">₹{item.price}</p>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {item.tag && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={item.tag.includes("Popular")
                  ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }
                  : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }
                }
              >{item.tag}</span>
            )}
            {!isUnavailable && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
          </div>
        </div>
      </div>
    </button>
  );
}
