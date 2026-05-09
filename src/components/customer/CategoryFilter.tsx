"use client";

import { useEffect, useRef } from "react";

interface Props {
  categories: string[];
  activeCategory: string;
  categoryCounts?: Record<string, number>;
  onCategoryChange: (cat: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, categoryCounts, onCategoryChange }: Props) {
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
    <div ref={containerRef} style={{ overflowX: "auto", padding: "12px 16px" }} className="scrollbar-none">
      <div style={{ display: "flex", gap: 8, width: "max-content" }}>
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              ref={isActive ? activeRef : null}
              onClick={() => onCategoryChange(cat)}
              className={isActive ? "gm-chip-active" : "gm-chip-inactive"}
            >
              {cat}
              {categoryCounts?.[cat] !== undefined && cat !== "All" && (
                <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>{categoryCounts[cat]}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
