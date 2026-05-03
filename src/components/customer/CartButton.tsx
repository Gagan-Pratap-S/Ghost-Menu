"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import CartModal from "./CartModal";

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

  // Delay showing the button until after first hydration to avoid SSR mismatch
  useEffect(() => {
    if (totalItems > 0 && prevTotal.current === 0) {
      // First item added — mount with appear animation
      setVisible(true);
    } else if (totalItems === 0) {
      setVisible(false);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  if (!visible) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        // animate-cartAppear only plays on mount (CSS animation with `both` fill)
        // Re-renders don't replay it because the element stays mounted
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-stone-900/30 transition-colors animate-cartAppear"
        aria-label="Open cart"
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        <span className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full text-xs font-bold flex-shrink-0">
          {totalItems}
        </span>
        <span className="font-display font-bold text-sm">View Cart</span>
        <span className="font-display font-bold text-sm text-orange-400 ml-auto">₹{totalPrice}</span>
      </button>

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
