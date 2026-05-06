"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import CartModal from "./CartModal";
import { formatPrice } from "@/lib/constants";

interface Props {
  restaurantId?: string;
  guestName?: string;
  memberCount?: number;
  tableNumber?: string;
}

export default function CartButton({ restaurantId, guestName, memberCount, tableNumber }: Props) {
  const { totalItems, totalPrice } = useCart();
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(false);
  const prevTotal              = useRef(0);
  const badgeRef               = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (totalItems > 0 && prevTotal.current === 0) setVisible(true);
    else if (totalItems === 0) { setVisible(false); setOpen(false); }

    // MOT-2: cart badge pop animation on every count change
    if (totalItems > 0 && prevTotal.current !== totalItems && badgeRef.current) {
      const el = badgeRef.current;
      el.classList.remove("animate-cartPop");
      void el.offsetWidth; // force reflow
      el.classList.add("animate-cartPop");
    }

    prevTotal.current = totalItems;
  }, [totalItems]);

  if (!visible) return null;

  return (
    <>
      {/* CUI-1: full-width sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 animate-cartAppear"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button onClick={() => setOpen(true)}
          className="w-full max-w-md mx-auto flex items-center justify-between rounded-2xl px-5 py-3.5 transition-colors active:scale-[0.98]"
          style={{
            background: "rgba(15,23,42,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(249,115,22,0.1)",
            display: "flex",
          }}
          aria-label="Open cart"
        >
          <div className="flex items-center gap-2.5">
            <span ref={badgeRef} className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 tabular-nums"
              style={{ background: "var(--brand,#f97316)", boxShadow: "0 2px 8px rgba(249,115,22,0.4)" }}
            >{totalItems}</span>
            <span className="font-display font-bold text-sm text-white">View Cart</span>
          </div>
          <span className="font-display font-bold text-sm text-orange-400 price tabular-nums">
            {formatPrice(totalPrice)} →
          </span>
        </button>
      </div>

      <CartModal open={open} onClose={() => setOpen(false)}
        restaurantId={restaurantId} guestName={guestName}
        memberCount={memberCount} tableNumber={tableNumber}
      />
    </>
  );
}
