"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import CartModal from "./CartModal";

export default function CartButton() {
  const { totalItems, totalPrice } = useCart();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-stone-900/40 transition-all animate-slideUp"
        aria-label="Open cart"
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        {/* Badge */}
        <span className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full text-xs font-bold flex-shrink-0">
          {totalItems}
        </span>
        <span className="font-display font-bold text-sm">View Cart</span>
        <span className="font-display font-bold text-sm text-orange-400 ml-auto">₹{totalPrice}</span>
      </button>

      <CartModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
