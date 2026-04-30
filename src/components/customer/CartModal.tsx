"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartModal({ open, onClose }: Props) {
  const { items, totalItems, totalPrice, increment, decrement, remove, clear } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Cart">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slideUp max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">Your Cart</h2>
            <p className="text-xs text-stone-400 mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clear}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >Clear all</button>
            )}
            <button onClick={onClose} aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors text-base"
            >×</button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-display font-semibold text-stone-600">Cart is empty</p>
              <p className="text-xs text-stone-400 mt-1">Add items from the menu</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3">
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-stone-200">
                  <Image
                    src={item.image} alt={item.name} fill sizes="56px"
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
                  <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => decrement(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-100 active:scale-90 transition-all"
                  >−</button>
                  <span className="font-display font-bold text-sm text-stone-900 w-5 text-center">{item.quantity}</span>
                  <button onClick={() => increment(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 active:scale-90 transition-all"
                  >+</button>
                  <button onClick={() => remove(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 ml-1 active:scale-90 transition-all text-sm"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 pb-6 pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-stone-700">Total</span>
              <span className="font-display font-bold text-xl text-stone-900">₹{totalPrice}</span>
            </div>
            <button
              onClick={() => { alert("Order placed! 🎉\n\nIn production this would send the order to the kitchen."); clear(); onClose(); }}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-display font-bold rounded-2xl text-sm transition-colors shadow-lg shadow-orange-200"
            >
              Place Order · ₹{totalPrice}
            </button>
            <p className="text-xs text-stone-400 text-center">Your order will be prepared by the kitchen</p>
          </div>
        )}
      </div>
    </div>
  );
}
