"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  add: (item: Omit<CartItem, "quantity">) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(slug: string) { return `ghostCart_${slug}`; }

export function CartProvider({ children, restaurantSlug }: { children: ReactNode; restaurantSlug: string }) {
  const [items, setItems]   = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(cartKey(restaurantSlug));
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, [restaurantSlug]);

  // Persist after mount only
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(cartKey(restaurantSlug), JSON.stringify(items)); }
    catch {}
  }, [items, mounted, restaurantSlug]);

  const add = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const increment = useCallback((id: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
  , []);

  const decrement = useCallback((id: number) =>
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    })
  , []);

  const remove = useCallback((id: number) => setItems(prev => prev.filter(i => i.id !== id)), []);
  const clear  = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, add, increment, decrement, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

// ─── Shared scroll lock with ref-counting ────────────────────────────────────
// Multiple modals can call lockScroll/unlockScroll — body scroll only restored
// when ALL callers have unlocked, preventing the collision bug.
let _lockCount = 0;

export function lockScroll() {
  _lockCount++;
  if (_lockCount === 1) document.body.style.overflow = "hidden";
}

export function unlockScroll() {
  _lockCount = Math.max(0, _lockCount - 1);
  if (_lockCount === 0) document.body.style.overflow = "";
}
