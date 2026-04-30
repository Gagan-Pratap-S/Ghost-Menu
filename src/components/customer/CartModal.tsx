"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart, lockScroll, unlockScroll } from "@/context/CartContext";
import { createOrder } from "@/lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  restaurantId?: string;
  guestName?: string;
  memberCount?: number;
}

type PlaceState = "idle" | "placing" | "success" | "error";

export default function CartModal({
  open,
  onClose,
  restaurantId,
  guestName,
  memberCount,
}: Props) {
  const { items, totalItems, totalPrice, increment, decrement, remove, clear } =
    useCart();

  const [placeState, setPlaceState] = useState<PlaceState>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);

  const isIdle = placeState === "idle";
  const isPlacing = placeState === "placing";

  // Scroll lock
  useEffect(() => {
    if (open) {
      lockScroll();
      return unlockScroll;
    }
  }, [open]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setPlaceState("idle");
      setOrderId(null);
    }
  }, [open]);

  if (!open) return null;

  const handlePlaceOrder = async () => {
    if (isPlacing) return;

    if (!restaurantId) {
      console.error("Missing restaurantId");
      setPlaceState("error");
      return;
    }

    setPlaceState("placing");

    try {
      const order = await createOrder({
        restaurant_id: restaurantId,
        guest_name: guestName ?? "Guest",
        member_count: memberCount ?? 1,
        table_number: "QR",
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: totalPrice,
      });

      if (order) {
        if (order?.id) setOrderId(order.id);
        setPlaceState("success");
        clear();
      } else {
        // fallback demo mode
        setPlaceState("success");
        clear();
      }
    } catch (err) {
      console.error("ORDER ERROR:", err);
      setPlaceState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={isPlacing ? undefined : onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slideUp max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">
              {placeState === "success" ? "Order Placed! 🎉" : "Your Cart"}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {placeState === "success"
                ? "Kitchen is preparing your order"
                : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && isIdle && (
              <button
                onClick={clear}
                className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear all
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {placeState === "success" ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <p className="font-display font-bold text-stone-900 text-lg mb-1">
                Order received!
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">
                Your food is being prepared. We'll bring it to your table shortly.
              </p>

              {orderId && (
                <p className="text-xs text-stone-400 mt-3 font-mono">
                  Order #{orderId.slice(0, 8).toUpperCase()}
                </p>
              )}

              <button
                onClick={onClose}
                className="mt-6 w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-display font-bold rounded-2xl text-sm transition-colors"
              >
                Back to Menu
              </button>
            </div>
          ) : placeState === "error" ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">😕</p>
              <p className="font-display font-semibold text-stone-700">
                Couldn't place order
              </p>
              <p className="text-xs text-stone-400 mt-1 mb-5">
                Check connection and try again
              </p>

              <button
                onClick={() => setPlaceState("idle")}
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-display font-semibold text-stone-600">
                Cart is empty
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Add items from the menu
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-stone-50 rounded-2xl p-3"
                >
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-stone-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                      onError={(e) => {
                        (e.currentTarget as any).src = "/fallback.png";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-orange-600 font-bold text-sm">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => decrement(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-sm"
                    >
                      −
                    </button>

                    <span className="font-display font-bold text-sm text-stone-900 w-5 text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increment(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm"
                    >
                      +
                    </button>

                    <button
                      onClick={() => remove(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 pb-6 pt-4 border-t border-stone-100 flex-shrink-0 space-y-3">
            {isIdle && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-stone-700">
                    Total
                  </span>
                  <span className="font-display font-bold text-xl text-stone-900">
                    ₹{totalPrice}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacing}
                  className="w-full py-4 bg-orange-500 disabled:opacity-60 text-white font-display font-bold rounded-2xl text-sm"
                >
                  {isPlacing
                    ? "Placing order..."
                    : `Place Order · ₹${totalPrice}`}
                </button>

                <p className="text-xs text-stone-400 text-center">
                  Your order goes straight to the kitchen
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}