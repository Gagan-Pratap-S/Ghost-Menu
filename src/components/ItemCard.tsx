"use client";

import Image from "next/image";
import { MenuItem } from "@/data/menuData";

interface ItemCardProps {
  item: MenuItem;
  onClick: () => void;
  variant?: "grid" | "list" | "quick" | "featured";
  priority?: boolean;
}

function ItemTag({ tag }: { tag: string }) {
  const isPopular = tag.includes("Popular");
  return (
    <span className={`absolute top-2 left-2 px-2 py-0.5 text-[11px] font-bold rounded-full shadow-sm ${
      isPopular ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-900"
    }`}>
      {tag}
    </span>
  );
}

export default function ItemCard({ item, onClick, variant = "list", priority = false }: ItemCardProps) {

  if (variant === "quick") {
    return (
      <button onClick={onClick} className="flex-shrink-0 w-40 snap-start group cursor-pointer" aria-label={item.name}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="relative h-24 overflow-hidden bg-stone-100">
            <Image src={item.image} alt={item.name} fill sizes="160px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {item.tag && <ItemTag tag={item.tag} />}
          </div>
          <div className="p-2.5">
            <h3 className="font-semibold text-stone-900 text-xs line-clamp-1">{item.name}</h3>
            <p className="text-orange-600 font-bold text-xs mt-0.5">₹{item.price}</p>
          </div>
        </div>
      </button>
    );
  }

  if (variant === "grid") {
    return (
      <button onClick={onClick} className="w-full group cursor-pointer" aria-label={item.name}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="relative h-32 overflow-hidden bg-stone-100">
            <Image src={item.image} alt={item.name} fill sizes="(max-width: 448px) 50vw, 224px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {item.tag && <ItemTag tag={item.tag} />}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</h3>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
              <span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-sm font-bold leading-none">+</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // List variant (default — full menu)
  return (
    <button onClick={onClick} aria-label={item.name}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-stone-100 hover:shadow-md hover:border-orange-100 transition-all text-left group cursor-pointer"
    >
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <Image src={item.image} alt={item.name} fill sizes="72px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-900 text-sm line-clamp-1">{item.name}</h3>
        <p className="text-stone-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
          <div className="flex items-center gap-2">
            {item.tag && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                item.tag.includes("Popular") ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-700"
              }`}>
                {item.tag}
              </span>
            )}
            <span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-sm font-bold leading-none">+</span>
          </div>
        </div>
      </div>
    </button>
  );
}
