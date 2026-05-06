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

  useEffect(() => {
    const btn = activeRef.current;
    const container = containerRef.current;
    if (!btn || !container) return;
    const { left, right } = btn.getBoundingClientRect();
    const { left: cLeft, right: cRight } = container.getBoundingClientRect();
    if (left < cLeft) container.scrollBy({ left: left - cLeft - 16, behavior: "smooth" });
    else if (right > cRight) container.scrollBy({ left: right - cRight + 16, behavior: "smooth" });
  }, [activeCategory]);

  return (
    <div ref={containerRef} className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {categories.map(cat => {
        const isActive = activeCategory === cat;
        return (
          <button key={cat} ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(cat)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={isActive
              ? { background: "#f97316", color: "#fff", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
            }
          >{cat}</button>
        );
      })}
    </div>
  );
}
