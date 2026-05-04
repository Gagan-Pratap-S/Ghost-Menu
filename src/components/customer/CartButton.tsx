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
  const prevTotal              = useRef(0);

  useEffect(() => {
    if (totalItems > 0 && prevTotal.current === 0) setVisible(true);
    else if (totalItems === 0) setVisible(false);
    prevTotal.current = totalItems;
  }, [totalItems]);

  if (!visible) return null;

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-colors active:scale-95 animate-cartAppear"
        style={{
          background: "rgba(15,23,42,0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.1)",
          maxWidth: "calc(100vw - 32px)",
        }}
        aria-label="Open cart"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0 tabular-nums"
          style={{ background: "#f97316", boxShadow: "0 2px 8px rgba(249,115,22,0.4)" }}
        >{totalItems}</span>
        <span className="font-display font-bold text-sm text-white">View Cart</span>
        <span className="font-display font-bold text-sm text-orange-400 ml-auto price tabular-nums">₹{totalPrice}</span>
      </button>

      <CartModal open={open} onClose={() => setOpen(false)}
        restaurantId={restaurantId} guestName={guestName}
        memberCount={memberCount} tableNumber={tableNumber}
      />
    </>
  );
}
