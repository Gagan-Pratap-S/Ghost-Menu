"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";
import { MenuItem } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE, PREP_LABEL, formatPrice } from "@/lib/constants";
import { incrementView } from "@/lib/supabase";

interface Props {
  item: MenuItem;
  onClick: () => void;
  variant?: "quick" | "grid" | "list";
  priority?: boolean;
  restaurantId?: string;
  onView?: (itemId: number) => void;
  recentOrderCounts?: Record<number, number>;
}

function PrepBadge({ prep }: { prep: "fast" | "medium" | "slow" }) {
  const style = {
    fast:   { background: "#ECFDF5", color: "#15803D", border: "1px solid #BBF7D0" },
    medium: { background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" },
    slow:   { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" },
  }[prep];
  return <span style={{ ...style, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 99 }}>{PREP_LABEL[prep]}</span>;
}

function Tag({ tag }: { tag: string }) {
  const isPopular = tag.includes("Popular");
  return (
    <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", fontSize: 10, fontWeight: 700, borderRadius: 99,
      ...(isPopular ? { background: "var(--gm-primary)", color: "#fff" } : { background: "rgba(251,191,36,0.9)", color: "#78350f" }) }}>
      {tag}
    </span>
  );
}

function GoingFastBadge() {
  return <span style={{ position: "absolute", top: 8, right: 8, padding: "2px 6px", fontSize: 9, fontWeight: 700, borderRadius: 99, background: "rgba(239,68,68,0.9)", color: "#fff" }}>🔥 Fast</span>;
}

function HighDemandBadge() {
  return <span style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 6px", fontSize: 9, fontWeight: 700, borderRadius: 99, background: "rgba(251,191,36,0.9)", color: "#78350f" }}>⚡ Demand</span>;
}

function Img({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <Image src={src} alt={alt} fill sizes={sizes}
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      placeholder="empty"
      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
    />
  );
}

function QtyControls({ qty, onInc, onDec }: { qty: number; onInc: (e: React.MouseEvent) => void; onDec: (e: React.MouseEvent) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
      <button onClick={onDec} style={{ width: 24, height: 24, borderRadius: 8, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gm-text)", width: 16, textAlign: "center" }} className="tabular-nums">{qty}</span>
      <button onClick={onInc} style={{ width: 24, height: 24, borderRadius: 8, border: "none", background: "var(--gm-primary)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
    </div>
  );
}

function AddButton({ onAdd }: { onAdd: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onAdd} style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: "var(--gm-primary)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(223,88,48,0.3)" }}>+</button>
  );
}

export default function ItemCard({ item, onClick, variant = "list", priority = false, restaurantId, onView, recentOrderCounts }: Props) {
  const { items, add, increment, decrement } = useCart();
  const cartItem  = items.find(i => i.id === item.id);
  const qty       = cartItem?.quantity ?? 0;
  const isUnavail = !item.available;
  const cardRef   = useRef<HTMLButtonElement | HTMLDivElement | null>(null);
  const viewedRef = useRef(false);

  const recentCount  = recentOrderCounts?.[item.id] ?? 0;
  const isGoingFast  = recentCount >= 3;
  const isHighDemand = recentCount >= 5;

  useEffect(() => {
    const el = cardRef.current;
    if (!el || viewedRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !viewedRef.current) {
        viewedRef.current = true;
        incrementView(item.id, restaurantId);
        onView?.(item.id);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, restaurantId, onView]);

  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); add({ id: item.id, name: item.name, price: item.price, image: item.image }); };
  const handleInc = (e: React.MouseEvent) => { e.stopPropagation(); increment(item.id); };
  const handleDec = (e: React.MouseEvent) => { e.stopPropagation(); decrement(item.id); };

  const pointerStart = useRef<{ x: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { pointerStart.current = { x: e.clientX, t: Date.now() }; };
  const onPointerUp   = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dt = Date.now() - pointerStart.current.t;
    if (dx > 50 && dt < 200 && !isUnavail) {
      e.stopPropagation();
      add({ id: item.id, name: item.name, price: item.price, image: item.image });
    }
    pointerStart.current = null;
  };

  const cardStyle = { background: "var(--gm-surface)", border: "1px solid var(--gm-border)", boxShadow: "var(--gm-shadow-sm)" };

  if (variant === "quick") {
    return (
      <button ref={el => { cardRef.current = el; }} onClick={onClick} aria-label={item.name}
        className="group focus:outline-none"
        style={{ flexShrink: 0, width: 144, borderRadius: 18, overflow: "hidden", ...cardStyle, opacity: isUnavail ? 0.5 : 1, cursor: "pointer", border: "none", padding: 0, transition: "box-shadow 0.15s, transform 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--gm-shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--gm-shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
        <div style={{ position: "relative", height: 96, background: "var(--gm-bg)" }}>
          <Img src={item.image} alt={item.name} sizes="144px" priority={priority} />
          {item.tag && <Tag tag={item.tag} />}
          {isGoingFast && !isHighDemand && <GoingFastBadge />}
          {isHighDemand && <HighDemandBadge />}
          {qty > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "var(--gm-primary)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }} className="tabular-nums">{qty}</span>}
          {isUnavail && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)" }}><span style={{ fontSize: 9, fontWeight: 700, color: "var(--gm-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unavailable</span></div>}
        </div>
        <div style={{ padding: "10px 10px 10px", background: "var(--gm-surface)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gm-text)", lineHeight: 1.3, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gm-primary)" }} className="price tabular-nums">{formatPrice(item.price)}</p>
            {!isUnavail && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
          </div>
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button ref={el => { cardRef.current = el; }} onClick={onClick} aria-label={item.name}
        className="group focus:outline-none"
        style={{ width: "100%", borderRadius: 18, overflow: "hidden", ...cardStyle, opacity: isUnavail ? 0.5 : 1, cursor: "pointer", border: "none", padding: 0, transition: "box-shadow 0.15s, transform 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--gm-shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--gm-shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
        <div style={{ position: "relative", height: 112, background: "var(--gm-bg)" }}>
          <Img src={item.image} alt={item.name} sizes="(max-width:448px) 50vw, 224px" priority={priority} />
          {item.tag && <Tag tag={item.tag} />}
          {isGoingFast && !isHighDemand && <GoingFastBadge />}
          {isHighDemand && <HighDemandBadge />}
          {qty > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "var(--gm-primary)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }} className="tabular-nums">{qty}</span>}
          {isUnavail && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)" }}><span style={{ fontSize: 9, fontWeight: 700, color: "var(--gm-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unavailable</span></div>}
        </div>
        <div style={{ padding: 12, background: "var(--gm-surface)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gm-text)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--gm-primary)" }} className="price tabular-nums">{formatPrice(item.price)}</p>
              <PrepBadge prep={item.prep_time} />
            </div>
            {!isUnavail && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
          </div>
        </div>
      </button>
    );
  }

  // list variant
  return (
    <button ref={el => { cardRef.current = el; }} onClick={onClick} aria-label={item.name}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, ...cardStyle, borderRadius: 16, padding: 12, cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s, border-color 0.15s", opacity: isUnavail ? 0.5 : 1 }}
      className="focus:outline-none"
      onMouseEnter={e => { if (!isUnavail) { (e.currentTarget as HTMLElement).style.borderColor = "var(--gm-primary)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--gm-shadow-md)"; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gm-border)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--gm-shadow-sm)"; }}>
      <div style={{ position: "relative", width: 68, height: 68, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--gm-bg)" }}>
        <Img src={item.image} alt={item.name} sizes="68px" priority={priority} />
        {isUnavail && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)" }}><span style={{ fontSize: 8, fontWeight: 700, color: "var(--gm-text-secondary)", textTransform: "uppercase", textAlign: "center" }}>Un<br/>avail</span></div>}
        {qty > 0 && !isUnavail && <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--gm-primary)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }} className="tabular-nums">{qty}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
        <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--gm-primary)", margin: 0 }} className="price tabular-nums">{formatPrice(item.price)}</p>
            <PrepBadge prep={item.prep_time} />
            {isGoingFast && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "var(--gm-danger-bg)", color: "var(--gm-danger)" }}>🔥</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
            {item.tag && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              ...(item.tag.includes("Popular") ? { background: "#FFF7ED", color: "var(--gm-primary)", border: "1px solid #FDBA74" } : { background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }) }}>
              {item.tag}
            </span>}
            {!isUnavail && (qty > 0 ? <QtyControls qty={qty} onInc={handleInc} onDec={handleDec} /> : <AddButton onAdd={handleAdd} />)}
          </div>
        </div>
      </div>
    </button>
  );
}
