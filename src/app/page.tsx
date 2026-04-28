"use client";

import { useState, useEffect } from "react";
import MenuPage from "@/components/MenuPage";
import ItemModal from "@/components/ItemModal";
import OwnerDashboard from "@/components/OwnerDashboard";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, incrementClick, incrementView } from "@/lib/supabase";

type View = "menu" | "owner";

const CACHE_KEY = "ghostMenuCache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadCachedItems(): MenuItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { items, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return items;
  } catch {
    return null;
  }
}

function saveCachedItems(items: MenuItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, timestamp: Date.now() }));
  } catch {}
}

export default function Home() {
  const [view, setView] = useState<View>("menu");
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [kitchenStatus, setKitchenStatus] = useState<"normal" | "busy">("normal");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Hydrate from Supabase on mount (with localStorage cache fallback)
  useEffect(() => {
    const cached = loadCachedItems();
    if (cached) {
      setItems(cached);
      return;
    }
    fetchMenuItems().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setItems(data);
        saveCachedItems(data);
      }
    });
  }, []);

  const handleItemClick = (item: MenuItem) => {
    // Optimistic local update
    setItems((prev: MenuItem[]) =>
      prev.map((i: MenuItem) => (i.id === item.id ? { ...i, clicks: i.clicks + 1 } : i))
    );
    // Persist to Supabase (fire-and-forget)
    incrementClick(item.id);
    setSelectedItem(item);
  };

  const handleModalClose = () => {
    if (selectedItem) {
      setItems((prev: MenuItem[]) =>
        prev.map((i: MenuItem) => (i.id === selectedItem.id ? { ...i, views: i.views + 1 } : i))
      );
      incrementView(selectedItem.id);
    }
    setSelectedItem(null);
  };

  const handleComboItemClick = (item: MenuItem) => {
    setSelectedItem(null);
    setTimeout(() => {
      setSelectedItem(item);
      handleItemClick(item);
    }, 200);
  };

  return (
    <>
      {view === "menu" ? (
        <MenuPage items={items} kitchenStatus={kitchenStatus} onItemClick={handleItemClick} />
      ) : (
        <OwnerDashboard
          items={items}
          kitchenStatus={kitchenStatus}
          onKitchenStatusChange={setKitchenStatus}
          onItemsChange={setItems}
        />
      )}

      <ItemModal item={selectedItem} onClose={handleModalClose} onComboItemClick={handleComboItemClick} />

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200 z-40">
        <div className="max-w-md mx-auto flex">
          {(["menu", "owner"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
                view === v ? "text-orange-600" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span className="text-lg leading-none">{v === "menu" ? "🍽️" : "⚙️"}</span>
              <span>{v === "menu" ? "Menu" : "Admin"}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
