"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCart, lockScroll, unlockScroll } from "@/context/CartContext";
import { createOrder } from "@/lib/supabase";
import { FALLBACK_IMAGE } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  restaurantId?: string;
  guestName?: string;
  memberCount?: number;
  tableNumber?: string;
}

type PlaceState = "idle" | "placing" | "success" | "error";

export default function CartModal({ open, onClose, restaurantId, guestName, memberCount, tableNumber }: Props) {
  const { items, totalItems, totalPrice, increment, decrement, remove, clear } = useCart();

  const [placeState, setPlaceState] = useState<PlaceState>("idle");
  const [orderId, setOrderId]       = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const submitting                   = useRef(false);

  // Derived flags — avoid TypeScript narrowing conflicts
  const isIdle    = placeState === "idle";
  const isPlacing = placeState === "placing";
  const isSuccess = placeState === "success";
  const isError   = placeState === "error";

  // Shared ref-counted scroll lock
  useEffect(() => {
    if (open) { lockScroll(); return unlockScroll; }
  }, [open]);

  // Reset state when modal re-opens
  useEffect(() => {
    if (open) {
      setPlaceState("idle");
      setOrderId(null);
      setOrderError(null);
      submitting.current = false;
    }
  }, [open]);

  if (!open) return null;

  const handlePlaceOrder = async () => {
    if (submitting.current || !isIdle) return;

    // Hard validation — show errors, never silent success
    if (!restaurantId) {
      setOrderError("Restaurant not identified. Please scan the QR code again.");
      return;
    }
    if (items.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }
    if (totalPrice <= 0) {
      setOrderError("Invalid order total.");
      return;
    }

    submitting.current = true;
    setPlaceState("placing");
    setOrderError(null);

    const { order, error } = await createOrder({
      restaurant_id: restaurantId,
      guest_name:    guestName  || "Guest",
      member_count:  memberCount ?? 1,
      table_number:  tableNumber || "QR",
      items:         items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      total:         totalPrice,
    });

    if (error) {
      setOrderError(error);
      setPlaceState("error");
      submitting.current = false;
      return;
    }

    setOrderId(order?.id ?? null);
    setPlaceState("success");
    clear();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slideUp max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">
              {isSuccess ? "Order Placed! 🎉" : "Your Cart"}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {isSuccess
                ? "Kitchen is preparing your order"
                : tableNumber && tableNumber !== "QR"
                  ? `${totalItems} item${totalItems !== 1 ? "s" : ""} · Table ${tableNumber}`
                  : `${totalItems} item${totalItems !== 1 ? "s" : ""}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && isIdle && (
              <button onClick={clear}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >Clear all</button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-display font-bold text-stone-900 text-lg mb-1">Order received!</p>
              <p className="text-stone-500 text-sm leading-relaxed">
                Your food is being prepared.{tableNumber && tableNumber !== "QR" ? ` We'll bring it to Table ${tableNumber}.` : " We'll bring it to your table."}
              </p>
              {orderId && (
                <p className="text-xs text-stone-400 mt-3 font-mono">
                  Order #{orderId.slice(0, 8).toUpperCase()}
                </p>
              )}
              <button onClick={onClose}
                className="mt-6 w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-display font-bold rounded-2xl text-sm transition-colors"
              >Back to Menu</button>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">😕</p>
              <p className="font-display font-semibold text-stone-700">Couldn't place order</p>
              {orderError && <p className="text-xs text-red-500 mt-2 mb-1">{orderError}</p>}
              <p className="text-xs text-stone-400 mt-1 mb-5">Check connection and try again</p>
              <button
                onClick={() => { setPlaceState("idle"); setOrderError(null); submitting.current = false; }}
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm"
              >Try Again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-display font-semibold text-stone-600">Cart is empty</p>
              <p className="text-xs text-stone-400 mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <p className="text-red-600 text-xs font-medium">{orderError}</p>
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-stone-200">
                    <Image
                      src={item.image} alt={item.name} fill sizes="56px"
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-orange-600 font-bold text-sm">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => decrement(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-100 active:scale-90 transition-all">−</button>
                    <span className="font-display font-bold text-sm text-stone-900 w-5 text-center">{item.quantity}</span>
                    <button onClick={() => increment(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 active:scale-90 transition-all">+</button>
                    <button onClick={() => remove(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 ml-1 active:scale-90 transition-all"
                      aria-label={`Remove ${item.name}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — explicit flags, not narrowed placeState */}
        {items.length > 0 && (isIdle || isPlacing) && (
          <div className="px-5 pb-6 pt-4 border-t border-stone-100 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-stone-700">Total</span>
              <span className="font-display font-bold text-xl text-stone-900">₹{totalPrice}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-display font-bold rounded-2xl text-sm transition-colors shadow-md shadow-orange-100"
            >
              {isPlacing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing order…
                </span>
              ) : `Place Order · ₹${totalPrice}`}
            </button>
            <p className="text-xs text-stone-400 text-center">Your order goes straight to the kitchen</p>
          </div>
        )}
      </div>
    </div>
  );
}
