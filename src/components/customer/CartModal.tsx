"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [placeState, setPlaceState] = useState<PlaceState>("idle");
  const [orderId, setOrderId]       = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const submitting                  = useRef(false);

  const isIdle    = placeState === "idle";
  const isPlacing = placeState === "placing";
  const isSuccess = placeState === "success";
  const isError   = placeState === "error";

  const TAX_RATE = 0.05;
  const subtotal = totalPrice;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

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
      total:         total,
    });

    if (error) {
      setOrderError(error);
      setPlaceState("error");
      submitting.current = false;
      return;
    }
    setPlaceState("success");
    if (typeof navigator !== "undefined") navigator.vibrate?.([30, 10, 30]);
    clear();
    if (order?.id) {
      setTimeout(() => {
        onClose();
        router.push(`/order/${order.id}`);
      }, 700);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} role="dialog" aria-modal="true">
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        className="animate-fadeIn" onClick={onClose} />

      <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "var(--gm-surface)", borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "var(--gm-shadow-xl)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        className="animate-slideUp">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid var(--gm-border)", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--gm-text)", margin: 0 }}>
              {isSuccess ? "Order Confirmed! 🎉" : "Your Cart"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginTop: 2 }}>
              {isSuccess
                ? "Kitchen is preparing your order"
                : tableNumber && tableNumber !== "QR"
                  ? `${totalItems} item${totalItems !== 1 ? "s" : ""} · Table ${tableNumber}`
                  : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {items.length > 0 && isIdle && (
              <button onClick={clear}
                style={{ fontSize: 13, fontWeight: 500, padding: "4px 10px", borderRadius: 8, color: "var(--gm-danger)", background: "var(--gm-danger-bg)", border: "none", cursor: "pointer" }}>
                Clear
              </button>
            )}
            <button onClick={onClose}
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--gm-bg)", border: "none", color: "var(--gm-text-secondary)", fontSize: 18, cursor: "pointer" }}>
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gm-success-bg)", border: "2px solid var(--gm-success-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="32" height="32" style={{ color: "var(--gm-success)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--gm-text)", marginBottom: 8 }}>Order received!</p>
              <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", lineHeight: 1.6 }}>
                {tableNumber && tableNumber !== "QR" ? `We'll bring it to Table ${tableNumber}.` : "We'll bring it to your table shortly."}
              </p>
              {orderId && <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginTop: 12, fontFamily: "monospace" }}>#{orderId.slice(0, 8).toUpperCase()}</p>}
              <button onClick={onClose} style={{ marginTop: 24, width: "100%", height: 48, borderRadius: "var(--gm-radius-pill)", border: "1px solid var(--gm-border)", background: "var(--gm-bg)", color: "var(--gm-text)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Back to Menu</button>
            </div>
          ) : isError ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>😕</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)", marginBottom: 8 }}>Couldn&apos;t place order</p>
              {orderError && (
                <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: "var(--gm-danger)" }}>{orderError}</p>
                </div>
              )}
              <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 20 }}>Check your connection and try again</p>
              <button onClick={() => { setPlaceState("idle"); setOrderError(null); submitting.current = false; }} className="gm-btn-primary" style={{ padding: "0 24px" }}>
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gm-text)" }}>Cart is empty</p>
              <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginTop: 4 }}>Add items from the menu</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orderError && (
                <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 12, padding: "12px 16px" }}>
                  <p style={{ fontSize: 13, color: "var(--gm-danger)", fontWeight: 500 }}>{orderError}</p>
                </div>
              )}

              {/* Cart items */}
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--gm-bg)", borderRadius: "var(--gm-radius-md)", padding: 14 }}>
                  <div style={{ position: "relative", width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--gm-border)" }}>
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gm-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--gm-primary)", margin: "2px 0 0" }} className="price tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  {/* Qty controls matching JSX style */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => decrement(item.id)}
                      style={{ width: 28, height: 28, borderRadius: 9999, border: "none", background: "var(--gm-tint-orange)", color: "var(--gm-primary)", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gm-text)", width: 20, textAlign: "center" }} className="tabular-nums">{item.quantity}</span>
                    <button onClick={() => increment(item.id)}
                      style={{ width: 28, height: 28, borderRadius: 9999, border: "none", background: "var(--gm-primary)", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    <button onClick={() => remove(item.id)}
                      style={{ width: 28, height: 28, borderRadius: 9, border: "none", background: "var(--gm-danger-bg)", color: "var(--gm-danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2 }}
                      aria-label={`Remove ${item.name}`}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Coupon — matching JSX CartScreen */}
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gm-text)", marginBottom: 8 }}>Have a coupon?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    disabled={couponApplied}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--gm-border)", background: "var(--gm-bg)", fontSize: 13, color: "var(--gm-text)", outline: "none", fontFamily: "inherit" }}
                  />
                  <button
                    onClick={() => { if (couponCode.trim()) setCouponApplied(!couponApplied); }}
                    style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: couponApplied ? "var(--gm-tint-green)" : "var(--gm-tint-orange)", color: couponApplied ? "var(--gm-success)" : "var(--gm-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {couponApplied ? "Applied ✓" : "Apply"}
                  </button>
                </div>
              </div>

              {/* Pricing summary matching JSX */}
              <div style={{ background: "var(--gm-bg)", borderRadius: 16, padding: 16, marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span className="price tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--gm-text-secondary)", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--gm-border)" }}>
                  <span>Tax (5%)</span>
                  <span className="price tabular-nums">{formatPrice(tax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "var(--gm-text)" }}>
                  <span>Total</span>
                  <span className="price tabular-nums">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (isIdle || isPlacing) && (
          <div style={{ padding: "12px 20px 24px", borderTop: "1px solid var(--gm-border)", flexShrink: 0 }}>
            <button onClick={handlePlaceOrder} disabled={isPlacing} className="gm-btn-primary" style={{ width: "100%", height: 54, fontSize: 15, borderRadius: "9999px" }}>
              {isPlacing ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Placing order…
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Proceed to Checkout
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </span>
              )}
            </button>
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", textAlign: "center", marginTop: 10 }}>Your order goes straight to the kitchen</p>
          </div>
        )}
      </div>
    </div>
  );
}
