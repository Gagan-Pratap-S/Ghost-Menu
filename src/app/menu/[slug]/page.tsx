"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, incrementClick, incrementView } from "@/lib/supabase";
import MenuPage from "@/components/customer/MenuPage";
import ItemModal from "@/components/customer/ItemModal";

export default function CustomerMenuPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [items, setItems]           = useState<MenuItem[]>(initialMenuItems);
  const [loading, setLoading]       = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [guestName, setGuestName]   = useState("");
  const [kitchenStatus]             = useState<"normal" | "busy">("normal");

  // Load guest name from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ghostMenuGuestName");
      if (stored) setGuestName(stored);
    } catch {}
  }, []);

  // Function to refresh menu data
  const refreshMenuData = useCallback(() => {
    fetchMenuItems().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) setItems(data);
    }).catch(() => {});
  }, []);

  // Fetch fresh menu data from Supabase on every load
  useEffect(() => {
    setLoading(true);
    fetchMenuItems().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  // Auto-refresh menu data when window regains focus (e.g., returning from admin panel)
  useEffect(() => {
    const handleWindowFocus = () => {
      refreshMenuData();
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [refreshMenuData]);

  const handleItemClick = useCallback((item: MenuItem) => {
    const updated: MenuItem = { ...item, clicks: item.clicks + 1, views: item.views + 1 };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
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
    <>
      <MenuPage
        items={items}
        loading={loading}
        kitchenStatus={kitchenStatus}
        guestName={guestName}
        onItemClick={handleItemClick}
      />
      <ItemModal
        item={selectedItem}
        onClose={handleModalClose}
        onComboItemClick={handleComboItemClick}
      />
    </>
  );
}
