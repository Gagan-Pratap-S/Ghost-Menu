"use client";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  categoryCounts?: Record<string, number>;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  categoryCounts,
  onCategoryChange,
}: CategoryFilterProps) {
  if (categories.length <= 2) return null; // only "All" + one category — no need

  return (
    <div style={{ padding: "10px 16px", background: "rgba(255,253,249,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--gm-border)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {categories.map((category) => {
            const isActive = activeCategory === category;
            const count = categoryCounts?.[category];
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={isActive ? "gm-chip-active" : "gm-chip-inactive"}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span>{category}</span>
                {count !== undefined && count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 99,
                    background: isActive ? "rgba(255,255,255,0.2)" : "var(--gm-bg)",
                    color: isActive ? "#fff" : "var(--gm-text-secondary)"
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
