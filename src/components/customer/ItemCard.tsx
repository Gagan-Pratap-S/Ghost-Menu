"use client";

import Image from "next/image";
import { MenuItem } from "@/data/menuData";

interface Props {
  item: MenuItem;
  onClick: () => void;
  variant?: "quick" | "grid" | "list";
  priority?: boolean;
}

function Tag({ tag }: { tag: string }) {
  const isPopular = tag.includes("Popular");
  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${
      isPopular ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-900"
    }`}>{tag}</span>
  );
}

function ItemImage({ src, alt, sizes, priority, fill = true }: { src: string; alt: string; sizes: string; priority?: boolean; fill?: boolean }) {
  return (
    <Image
      src={src} alt={alt} fill={fill} sizes={sizes}
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      priority={priority}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

export default function ItemCard({ item, onClick, variant = "list", priority = false }: Props) {
  if (variant === "quick") {
    return (
      <button onClick={onClick} aria-label={item.name}
        className="flex-shrink-0 w-36 snap-start group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
          <div className="relative h-24 bg-stone-100">
            <ItemImage src={item.image} alt={item.name} sizes="144px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
          </div>
          <div className="p-2.5">
            <p className="font-display font-semibold text-stone-900 text-xs line-clamp-1">{item.name}</p>
            <p className="text-orange-600 font-bold text-xs mt-0.5">₹{item.price}</p>
          </div>
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button onClick={onClick} aria-label={item.name}
        className="w-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
          <div className="relative h-28 bg-stone-100">
            <ItemImage src={item.image} alt={item.name} sizes="(max-width:448px) 50vw, 224px" priority={priority} />
            {item.tag && <Tag tag={item.tag} />}
          </div>
          <div className="p-3">
            <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
              <span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold">+</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // list
  return (
    <button onClick={onClick} aria-label={item.name}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-stone-100 hover:border-orange-100 hover:shadow-md active:scale-[0.98] transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="relative w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <ItemImage src={item.image} alt={item.name} sizes="68px" priority={priority} />
        {!item.available && (
          <div className="absolute inset-0 bg-stone-900/50 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold uppercase tracking-wide">Sold Out</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</p>
        <p className="text-stone-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
          <div className="flex items-center gap-1.5">
            {item.tag && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                item.tag.includes("Popular") ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-700"
              }`}>{item.tag}</span>
            )}
            <span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs font-bold">+</span>
          </div>
        </div>
      </div>
    </button>
  );
}
