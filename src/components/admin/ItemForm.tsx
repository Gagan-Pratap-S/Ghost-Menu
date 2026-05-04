"use client";

import { useState } from "react";
import Image from "next/image";
import { MenuItem } from "@/data/menuData";
import { FALLBACK_IMAGE } from "@/lib/constants";

type FormData = Omit<MenuItem, "id" | "clicks" | "views" | "tag">;

interface Props {
  mode: "add" | "edit";
  item?: MenuItem;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ["Starters", "Mains", "Combos", "Breakfast", "Breads", "Desserts", "Beverages"];

const defaultForm: FormData = {
  name: "", description: "", price: 0, category: "Mains", image: "",
  available: true, featured: false, prep_time: "medium", profit_tag: "medium",
};

const fieldStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function ItemForm({ mode, item, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(
    item ? { name: item.name, description: item.description, price: item.price, category: item.category,
              image: item.image, available: item.available, featured: item.featured,
              prep_time: item.prep_time, profit_tag: item.profit_tag } : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())        e.name = "Required";
    if (form.price <= 0)          e.price = "Must be > 0";
    if (!form.image.trim())       e.image = "Required";
    else if (!form.image.startsWith("http")) e.image = "Must start with http";
    if (!form.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all";

  const isValidImage = form.image.startsWith("http");

  return (
    <div className="rounded-2xl p-4 space-y-3 animate-slideUp"
      style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(249,115,22,0.2)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-bold text-sm text-white tracking-tight">
          {mode === "add" ? "✨ Add New Dish" : "✏️ Edit Dish"}
        </h3>
        <button onClick={onCancel} className="text-slate-600 hover:text-slate-300 text-lg leading-none transition-colors">×</button>
      </div>

      {isValidImage && (
        <div className="relative h-36 rounded-xl overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
          <Image src={form.image} alt="Preview" fill sizes="400px" className="object-cover"
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 50%)" }} />
          <span className="absolute bottom-2 left-3 text-xs text-white/60 font-medium">Preview</span>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Name *</label>
        <input type="text" placeholder="e.g. Paneer Tikka" value={form.name} onChange={e => set("name", e.target.value)}
          className={inputClass} maxLength={60} style={fieldStyle}
          onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
          onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Description *</label>
        <textarea placeholder="Short description shown to customers" value={form.description} onChange={e => set("description", e.target.value)}
          rows={2} maxLength={200}
          className={`${inputClass} resize-none`} style={fieldStyle}
          onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
          onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
        />
        <div className="flex justify-between mt-0.5">
          {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          <p className="text-xs text-slate-700 ml-auto">{form.description.length}/200</p>
        </div>
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Price (₹) *</label>
          <input type="number" placeholder="0" value={form.price || ""} onChange={e => set("price", parseInt(e.target.value) || 0)} min={1} max={9999}
            className={`${inputClass} tabular-nums`} style={fieldStyle}
            onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
            onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
          />
          {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}
            className={`${inputClass} appearance-none cursor-pointer`} style={fieldStyle}
          >
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#0f172a" }}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Image URL *</label>
        <input type="url" placeholder="https://images.unsplash.com/…" value={form.image} onChange={e => set("image", e.target.value)}
          className={inputClass} style={fieldStyle}
          onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.4)"; }}
          onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
        />
        {errors.image && <p className="text-xs text-red-400 mt-1">{errors.image}</p>}
        <p className="text-xs text-slate-700 mt-0.5">Paste any https image URL</p>
      </div>

      {/* Prep + Profit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Prep Time</label>
          <select value={form.prep_time} onChange={e => set("prep_time", e.target.value as FormData["prep_time"])}
            className={`${inputClass} appearance-none cursor-pointer`} style={fieldStyle}
          >
            <option value="fast"   style={{ background: "#0f172a" }}>⚡ Fast (5–10 min)</option>
            <option value="medium" style={{ background: "#0f172a" }}>⏱ Medium (~15 min)</option>
            <option value="slow"   style={{ background: "#0f172a" }}>🕐 Slow (~30 min)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Profit Tag</label>
          <select value={form.profit_tag} onChange={e => set("profit_tag", e.target.value as FormData["profit_tag"])}
            className={`${inputClass} appearance-none cursor-pointer`} style={fieldStyle}
          >
            <option value="high"   style={{ background: "#0f172a" }}>💚 High</option>
            <option value="medium" style={{ background: "#0f172a" }}>🟡 Medium</option>
            <option value="low"    style={{ background: "#0f172a" }}>🔴 Low</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-3">
        {(["available", "featured"] as const).map(key => (
          <button key={key} onClick={() => set(key, !form[key])}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={form[key]
              ? key === "available"
                ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }
                : { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }
            }
          >
            {key === "available" ? (form.available ? "✓ Available" : "Unavailable") : (form.featured ? "⭐ Featured" : "Not Featured")}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 disabled:opacity-50 transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex-1 py-2.5 text-xs disabled:opacity-50 disabled:transform-none"
        >
          {saving ? "Saving…" : mode === "add" ? "Add Dish" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
