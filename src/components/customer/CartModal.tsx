"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCart, lockScroll, unlockScroll } from "@/context/CartContext";
import { createOrder } from "@/lib/supabase";
import { FALLBACK_IMAGE, formatPrice } from "@/lib/constants";

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

  // Explicit boolean flags to avoid TS narrowing issues
  const isIdle    = placeState === "idle";
  const isPlacing = placeState === "placing";
  const isSuccess = placeState === "success";
  const isError   = placeState === "error";

  // Ref-counted scroll lock shared with ItemModal
  useEffect(() => {
    if (open) { lockScroll(); return unlockScroll; }
  }, [open]);

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

    // Hard validation
    if (!restaurantId) { setOrderError("Restaurant not identified. Please scan the QR code again."); return; }
    if (items.length === 0) { setOrderError("Your cart is empty."); return; }
    if (totalPrice <= 0)    { setOrderError("Invalid order total."); return; }

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

  const sheetStyle = {
    background: "var(--color-surface,#0f172a)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fadeIn"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-t-3xl shadow-2xl animate-slideUp max-h-[88vh] flex flex-col" style={sheetStyle}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div>
            <h2 className="font-display font-bold text-lg text-white tracking-tight">
              {isSuccess ? "Order Placed! 🎉" : "Your Cart"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSuccess
                ? "Kitchen is preparing your order"
                : tableNumber && tableNumber !== "QR"
                  ? `${totalItems} item${totalItems !== 1 ? "s" : ""} · Table ${tableNumber}`
                  : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && isIdle && (
              <button onClick={clear}
                className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.08)" }}
              >Clear all</button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors text-base"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-glowPulse"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <svg className="w-8 h-8" style={{ color: "#4ade80" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-display font-bold text-white text-lg mb-1 tracking-tight">Order received!</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {tableNumber && tableNumber !== "QR"
                  ? `We'll bring it to Table ${tableNumber}.`
                  : "We'll bring it to your table shortly."}
              </p>
              {orderId && (
                <p className="text-xs text-slate-600 mt-3 font-mono">
                  #{orderId.slice(0, 8).toUpperCase()}
                </p>
              )}
              <button onClick={onClose}
                className="mt-6 w-full py-3.5 font-display font-bold rounded-2xl text-sm text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
              >Back to Menu</button>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">😕</p>
              <p className="font-display font-semibold text-white">Couldn't place order</p>
              {orderError && <p className="text-xs text-red-400 mt-2 mb-1">{orderError}</p>}
              <p className="text-xs text-slate-500 mt-1 mb-5">Check your connection and try again</p>
              <button
                onClick={() => { setPlaceState("idle"); setOrderError(null); submitting.current = false; }}
                className="btn-primary px-6 py-2.5 text-sm"
              >Try Again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-display font-semibold text-white">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderError && (
                <div className="rounded-xl px-4 py-2.5"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <p className="text-red-400 text-xs font-medium">{orderError}</p>
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden"
                    style={{ background: "rgba(30,41,59,0.8)" }}
                  >
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-white text-sm line-clamp-1 tracking-tight">{item.name}</p>
                    <p className="text-orange-400 font-bold text-sm price tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => decrement(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm text-white active:scale-90 transition-transform duration-75"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >−</button>
                    <span className="font-display font-bold text-sm text-white w-5 text-center tabular-nums">{item.quantity}</span>
                    <button onClick={() => increment(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm text-white active:scale-90 transition-transform duration-75"
                      style={{ background: "var(--brand,#f97316)" }}
                    >+</button>
                    <button onClick={() => remove(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg active:scale-90 transition-transform duration-75 ml-1"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}
                      aria-label={`Remove ${item.name}`}
                    >
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

        {/* Footer — explicit boolean flags, no TS narrowing conflict */}
        {items.length > 0 && (isIdle || isPlacing) && (
          <div className="px-5 pb-6 pt-4 flex-shrink-0 space-y-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-slate-300">Total</span>
              <span className="font-display font-bold text-xl text-white price tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="btn-primary w-full py-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isPlacing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing order…
                </span>
              ) : `Place Order · ${formatPrice(totalPrice)}`}
            </button>
            <p className="text-xs text-slate-600 text-center">Your order goes straight to the kitchen</p>
          </div>
        )}
      </div>
    </div>
  );
}
