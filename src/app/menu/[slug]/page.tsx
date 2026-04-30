"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, fetchRestaurantBySlug, incrementClick, incrementView, Restaurant } from "@/lib/supabase";
import { CartProvider } from "@/context/CartContext";
import MenuPage from "@/components/customer/MenuPage";
import ItemModal from "@/components/customer/ItemModal";

export default function CustomerMenuPage() {
  const params = useParams();
  const slug   = params?.slug as string;

  const [items, setItems]               = useState<MenuItem[]>(initialMenuItems);
  const [restaurant, setRestaurant]     = useState<Restaurant | null>(null);
  const [loading, setLoading]           = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [guestName, setGuestName]       = useState("");
  const [memberCount, setMemberCount]   = useState(1);
  const [kitchenStatus]                 = useState<"normal" | "busy">("normal");

  // Guest info from welcome page
  useEffect(() => {
    try {
      const n = localStorage.getItem("ghostMenuGuestName");
      const m = localStorage.getItem("ghostMenuMemberCount");
      if (n) setGuestName(n);
      if (m) setMemberCount(parseInt(m) || 1);
    } catch {}
  }, []);

  // Fetch restaurant then its menu
  useEffect(() => {
    setLoading(true);
    fetchRestaurantBySlug(slug).then(async (rest) => {
      if (rest) {
        setRestaurant(rest);
        const data = await fetchMenuItems(rest.id);
        if (data && Array.isArray(data) && data.length > 0) setItems(data);
      } else {
        // Supabase not configured or slug unknown — use local fallback
        const data = await fetchMenuItems();
        if (data && Array.isArray(data) && data.length > 0) setItems(data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleItemClick = useCallback((item: MenuItem) => {
    const updated: MenuItem = { ...item, clicks: item.clicks + 1, views: item.views + 1 };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    incrementClick(item.id);
    incrementView(item.id);
    setSelectedItem(updated);
  }, []);

  const handleModalClose = useCallback(() => setSelectedItem(null), []);

  const handleComboItemClick = useCallback((item: MenuItem) => {
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
        restaurantName={restaurant?.name ?? "Cafe Delight"}
        onItemClick={handleItemClick}
      />
      <ItemModal
        item={selectedItem}
        onClose={handleModalClose}
        onComboItemClick={handleComboItemClick}
      />
    </CartProvider>
  );
}
