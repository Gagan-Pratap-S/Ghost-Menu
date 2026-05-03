"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, fetchRestaurantBySlug, incrementClick, incrementView, Restaurant } from "@/lib/supabase";
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
  const [kitchenStatus]                 = useState<"normal" | "busy">("normal");

  // Load guest info + table number from localStorage / URL param
  useEffect(() => {
    try {
      const n = localStorage.getItem(LS.GUEST_NAME);
      const m = localStorage.getItem(LS.MEMBER_COUNT);
      if (n) setGuestName(n);
      if (m) setMemberCount(parseInt(m) || 1);

      // ?table=4 from QR code takes priority; fall back to localStorage
      const tableParam = searchParams.get("table");
      if (tableParam) {
        const sanitised = tableParam.slice(0, 10); // cap length
        setTableNumber(sanitised);
        localStorage.setItem(LS.TABLE_NUMBER, sanitised);
      } else {
        const storedTable = localStorage.getItem(LS.TABLE_NUMBER);
        if (storedTable) setTableNumber(storedTable);
      }
    } catch {}
  }, [searchParams]);

  // Fetch restaurant then menu — scoped by restaurant_id
  useEffect(() => {
    setLoading(true);
    fetchRestaurantBySlug(slug).then(async (rest) => {
      if (rest) {
        setRestaurant(rest);
        const data = await fetchMenuItems(rest.id);
        if (data && data.length > 0) setItems(data);
      } else {
        // Supabase not configured — fall back to full local dataset
        setItems(initialMenuItems);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleItemClick = useCallback((item: MenuItem) => {
    const updated: MenuItem = { ...item, clicks: item.clicks + 1, views: item.views + 1 };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    incrementClick(item.id, restaurant?.id);
    incrementView(item.id, restaurant?.id);
    setSelectedItem(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

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
        restaurantName={restaurant?.name ?? "Cafe Delight"}
        restaurantId={restaurant?.id}
        onItemClick={handleItemClick}
      />
      <ItemModal
        item={selectedItem}
        onClose={handleModalClose}
        onComboItemClick={handleComboClick}
      />
    </CartProvider>
  );
}

// useSearchParams requires Suspense in App Router
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
