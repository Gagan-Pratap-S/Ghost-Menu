"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, fetchRestaurantBySlug, incrementClick, Restaurant } from "@/lib/supabase";
import { CartProvider } from "@/context/CartContext";
import MenuPage from "@/components/customer/MenuPage";
import ItemModal from "@/components/customer/ItemModal";
import { LS } from "@/lib/constants";

function CustomerMenuPageInner() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const slug         = params?.slug as string;

  const [items, setItems]               = useState<MenuItem[]>(initialMenuItems);
  const [restaurant, setRestaurant]     = useState<Restaurant | null>(null);
  const [loading, setLoading]           = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [guestName, setGuestName]       = useState("");
  const [memberCount, setMemberCount]   = useState(1);
  const [tableNumber, setTableNumber]   = useState("QR");
  const [kitchenStatus, setKitchenStatus] = useState<"normal" | "busy">("normal");
  const restaurantIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    try {
      const n = localStorage.getItem(LS.GUEST_NAME);
      const m = localStorage.getItem(LS.MEMBER_COUNT);
      if (n) setGuestName(n);
      if (m) setMemberCount(parseInt(m) || 1);
      const tableParam = searchParams.get("table");
      if (tableParam) {
        const sanitised = tableParam.slice(0, 10);
        setTableNumber(sanitised);
        localStorage.setItem(LS.TABLE_NUMBER, sanitised);
      } else {
        const storedTable = localStorage.getItem(LS.TABLE_NUMBER);
        if (storedTable) setTableNumber(storedTable);
      }
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchRestaurantBySlug(slug).then(async (rest) => {
      if (rest) {
        setRestaurant(rest);
        restaurantIdRef.current = rest.id;
        // Sync kitchen_busy from DB if the column exists
        if (typeof rest.kitchen_busy === "boolean") {
          setKitchenStatus(rest.kitchen_busy ? "busy" : "normal");
        }
        const data = await fetchMenuItems(rest.id);
        if (data && data.length > 0) setItems(data);
      } else {
        setItems(initialMenuItems);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  // FIX: Only increment CLICK here — views are tracked via IntersectionObserver in ItemCard
  const handleItemClick = useCallback((item: MenuItem) => {
    const updated: MenuItem = { ...item, clicks: item.clicks + 1 };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    incrementClick(item.id, restaurantIdRef.current);
    setSelectedItem(updated);
  }, []); // No stale closure — we use the ref for restaurantId

  const handleModalClose   = useCallback(() => setSelectedItem(null), []);
  const handleComboClick   = useCallback((item: MenuItem) => {
    setSelectedItem(null);
    setTimeout(() => handleItemClick(item), 200);
  }, [handleItemClick]);

  return (
    <CartProvider restaurantSlug={slug}>
      <MenuPage
        items={items}
        loading={loading}
        kitchenStatus={kitchenStatus}
        guestName={guestName}
        memberCount={memberCount}
        tableNumber={tableNumber}
        restaurantName={restaurant?.name ?? "Ghost Menu"}
        restaurantId={restaurant?.id}
        onItemClick={handleItemClick}
        onViewItem={(itemId) => {
          // Update local views counter without re-opening modal
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, views: i.views + 1 } : i));
        }}
      />
      <ItemModal
        item={selectedItem}
        onClose={handleModalClose}
        onComboItemClick={handleComboClick}
      />
    </CartProvider>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CustomerMenuPageInner />
    </Suspense>
  );
}
