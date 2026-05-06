"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import {
  fetchMenuItems, fetchRestaurantBySlug, fetchRecentOrderCounts,
  incrementClick, incrementView, Restaurant,
} from "@/lib/supabase";
import { CartProvider } from "@/context/CartContext";
import MenuPage from "@/components/customer/MenuPage";
import ItemModal from "@/components/customer/ItemModal";
import { LS } from "@/lib/constants";

interface WeatherContext { temp: number; isRaining: boolean; }

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
  const [weatherContext, setWeatherContext] = useState<WeatherContext | undefined>(undefined);
  const [recentOrderCounts, setRecentOrderCounts] = useState<Record<number, number>>({});

  // BUG-3: useRef for restaurantId so handleItemClick has no stale closure
  const restaurantIdRef = useRef<string | undefined>(undefined);

  // Load guest info + table from localStorage / URL param
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

  // Fetch restaurant + menu
  useEffect(() => {
    setLoading(true);
    fetchRestaurantBySlug(slug).then(async (rest) => {
      if (rest) {
        setRestaurant(rest);
        restaurantIdRef.current = rest.id;
        // QUAL-1: read kitchen_busy from DB
        if (rest.kitchen_busy) setKitchenStatus("busy");
        // SCALE-1: apply theme color
        if (rest.theme_color) {
          document.documentElement.style.setProperty("--brand", rest.theme_color);
        }
        const data = await fetchMenuItems(rest.id);
        if (data && data.length > 0) setItems(data);
      } else {
        setItems(initialMenuItems);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  // REC-4: weather-aware scoring
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`
        );
        const data = await res.json();
        const temp = data.current_weather?.temperature ?? 25;
        const code = data.current_weather?.weathercode ?? 0;
        setWeatherContext({ temp, isRaining: code >= 61 && code <= 82 });
      } catch {}
    });
  }, []);

  // AI-2: recent order counts — refresh every 5 minutes
  useEffect(() => {
    if (!restaurantIdRef.current) return;
    const load = () => fetchRecentOrderCounts(restaurantIdRef.current!).then(setRecentOrderCounts);
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [restaurant?.id]);

  // BUG-1: clicks only — views tracked by IntersectionObserver in ItemCard
  const handleItemClick = useCallback((item: MenuItem) => {
    const updated: MenuItem = { ...item, clicks: item.clicks + 1 };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    incrementClick(item.id, restaurantIdRef.current);
    setSelectedItem(updated);
  }, []); // no stale closure — uses ref

  // BUG-1: called by ItemCard's IntersectionObserver
  const handleViewItem = useCallback((itemId: number) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, views: i.views + 1 } : i));
  }, []);

  const handleModalClose  = useCallback(() => setSelectedItem(null), []);
  const handleComboClick  = useCallback((item: MenuItem) => {
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
        restaurantSlug={slug}
        weatherContext={weatherContext}
        recentOrderCounts={recentOrderCounts}
        onItemClick={handleItemClick}
        onViewItem={handleViewItem}
      />
      <ItemModal
        item={selectedItem}
        onClose={handleModalClose}
        onComboItemClick={handleComboClick}
        restaurantId={restaurant?.id}
      />
    </CartProvider>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <CustomerMenuPageInner />
    </Suspense>
  );
}

function MenuSkeleton() {
  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 h-16" style={{ background: "rgba(2,6,23,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)" }} />
      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        <div className="flex gap-3 overflow-hidden">
          {[0,1,2,3].map(i => <div key={i} className="flex-shrink-0 w-36 h-32 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
        <div className="space-y-2">
          {[0,1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(30,41,59,0.5)" }} />)}
        </div>
      </div>
    </div>
  );
}
