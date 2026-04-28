"use client";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  if (categories.length <= 2) return null; // only "All" + one category — no need

  return (
    <div className="py-2.5 px-4 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-md mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 snap-x scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-medium text-xs transition-all whitespace-nowrap snap-start ${
                activeCategory === category
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
