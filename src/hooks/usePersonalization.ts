"use client";

import { useState, useEffect } from "react";

export function usePersonalization() {
  const [viewedItems, setViewedItems] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ghostMenuViewedItems");
      if (stored) setViewedItems(JSON.parse(stored));
    } catch {}
  }, []);

  const trackView = (itemId: number) => {
    setViewedItems((prev) => {
      const updated = [itemId, ...prev.filter((id) => id !== itemId)].slice(0, 20);
      try {
        localStorage.setItem("ghostMenuViewedItems", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getWelcomeMessage = () => {
    if (viewedItems.length === 0) return null;
    return `👋 Welcome back!`;
  };

  return { viewedItems, trackView, getWelcomeMessage };
}
