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

    if (totalItems > 0 && prevTotal.current !== totalItems && badgeRef.current) {
      const el = badgeRef.current;
      el.classList.remove("animate-cartPop");
      void el.offsetWidth;
      el.classList.add("animate-cartPop");
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  if (!visible) return null;

  return (
    <>
      <div
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, padding: `0 16px max(16px, env(safe-area-inset-bottom)) 16px` }}
        className="animate-cartAppear"
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center",
            justifyContent: "space-between", background: "var(--gm-text)", color: "#fff",
            borderRadius: 18, padding: "14px 20px", border: "none", cursor: "pointer",
            boxShadow: "var(--gm-shadow-xl)",
          }}
          aria-label="Open cart"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              ref={badgeRef}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--gm-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
              className="tabular-nums"
            >{totalItems}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {tableNumber && tableNumber !== "QR" ? `Table ${tableNumber} · ` : ""}View Cart
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }} className="price tabular-nums">
            {formatPrice(totalPrice)} →
          </span>
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
