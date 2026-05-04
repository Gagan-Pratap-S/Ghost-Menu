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
  const prevTotal = useRef(0);
  const badgeRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (totalItems > 0 && prevTotal.current === 0) {
      setVisible(true);
    } else if (totalItems === 0) {
      setVisible(false);
    }

    // Cart badge pop animation on every increment
    if (totalItems > prevTotal.current && badgeRef.current) {
      const el = badgeRef.current;
      el.classList.remove("animate-cartPop");
      void el.offsetWidth; // force reflow to re-trigger animation
      el.classList.add("animate-cartPop");
    }

    prevTotal.current = totalItems;
  }, [totalItems]);

  if (!visible) return null;

  const label = tableNumber && tableNumber !== "QR" ? `Table ${tableNumber} · ` : "";

  return (
    <>
      {/* Full-width sticky cart bar — Zomato/Swiggy style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-bottom" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full max-w-md mx-auto flex items-center justify-between bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-stone-900/40 transition-colors animate-cartAppear"
          aria-label="Open cart"
          style={{ display: "flex" }}
        >
          <div className="flex items-center gap-2.5">
            <span ref={badgeRef} className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full text-xs font-bold flex-shrink-0">
              {totalItems}
            </span>
            <span className="font-display font-bold text-sm">
              {label}View Cart
            </span>
          </div>
          <span className="font-display font-bold text-sm text-orange-400">{formatPrice(totalPrice)} →</span>
        </button>
      </div>

      <CartModal
        open={open}
        onClose={() => setOpen(false)}
        restaurantId={restaurantId}
        guestName={guestName}
        memberCount={memberCount}
        tableNumber={tableNumber}
      />
    </>
  );
}
