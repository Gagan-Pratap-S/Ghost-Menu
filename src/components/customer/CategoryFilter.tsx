"use client";

interface Props {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, onCategoryChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            activeCategory === cat
              ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
              : "bg-white text-stone-600 border border-stone-200 hover:border-orange-300 hover:text-orange-600"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
