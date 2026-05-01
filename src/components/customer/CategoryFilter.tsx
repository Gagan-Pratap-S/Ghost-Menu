"use client";

import { useEffect, useRef } from "react";

interface Props {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, onCategoryChange }: Props) {
  const activeRef    = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll active pill into view when category changes
  useEffect(() => {
    const btn = activeRef.current;
    const container = containerRef.current;
    if (!btn || !container) return;
    const { left, right } = btn.getBoundingClientRect();
    const { left: cLeft, right: cRight } = container.getBoundingClientRect();
    if (left < cLeft) {
      container.scrollBy({ left: left - cLeft - 16, behavior: "smooth" });
    } else if (right > cRight) {
      container.scrollBy({ left: right - cRight + 16, behavior: "smooth" });
    }
  }, [activeCategory]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none"
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(cat)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              isActive
                ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                : "bg-white text-stone-600 border border-stone-200 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
