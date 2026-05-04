"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MenuItem } from "@/data/menuData";
import { formatPrice } from "@/lib/constants";

type FormData = Omit<MenuItem, "id" | "clicks" | "views" | "tag">;

interface Props {
  mode: "add" | "edit";
  item?: MenuItem;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ["Starters", "Mains", "Combos", "Breakfast", "Breads", "Desserts", "Beverages"];

// Trusted image domains (also aligned with next.config.ts)
const TRUSTED_IMAGE_DOMAINS = ["images.unsplash.com", "supabase.co", "supabase.in", "cloudinary.com", "imgix.net", "amazonaws.com"];

function isTrustedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return TRUSTED_IMAGE_DOMAINS.some(d => parsed.hostname.endsWith(d));
  } catch { return false; }
}

const defaultForm: FormData = {
  name: "",
  description: "",
  price: 0,
  category: "Mains",
  image: "",
  available: true,
  featured: false,
  prep_time: "medium",
  profit_tag: "medium",
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputClass = "w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors";
const selectClass = `${inputClass} appearance-none`;

export default function ItemForm({ mode, item, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(
    item ? {
      name:        item.name,
      description: item.description,
      price:       item.price,
      category:    item.category,
      image:       item.image,
      available:   item.available,
      featured:    item.featured,
      prep_time:   item.prep_time,
      profit_tag:  item.profit_tag,
    } : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  // Live image preview with debounce
  const [previewUrl, setPreviewUrl] = useState(item?.image ?? "");
  const [imageError, setImageError] = useState(false);

  // Debounce image URL changes for live preview
  useEffect(() => {
    setImageError(false);
    if (!form.image) { setPreviewUrl(""); return; }
    const timer = setTimeout(() => {
      if (form.image.startsWith("https://")) setPreviewUrl(form.image);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.image]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())        e.name = "Name is required";
    if (form.price <= 0)          e.price = "Price must be greater than 0";
    if (!form.image.trim())       e.image = "Image URL is required";
    else if (!form.image.startsWith("https://")) e.image = "Must be a valid HTTPS URL";
    else if (!isTrustedImageUrl(form.image)) e.image = "Use images from Unsplash, Supabase Storage, or Cloudinary";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const showPreview = previewUrl && !imageError;

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-md p-4 space-y-3 animate-slideUp">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-bold text-sm text-stone-900">
          {mode === "add" ? "✨ Add New Dish" : "✏️ Edit Dish"}
        </h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-700 text-lg leading-none">×</button>
      </div>

      {/* Live image preview — updates 500ms after URL input */}
      {showPreview ? (
        <div className="relative h-36 rounded-xl overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <span className="absolute bottom-2 left-2 text-white text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full">Preview</span>
        </div>
      ) : form.image && !imageError ? (
        <div className="h-12 bg-stone-100 rounded-xl flex items-center justify-center">
          <span className="text-xs text-stone-400">Loading preview…</span>
        </div>
      ) : imageError ? (
        <div className="h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
          <span className="text-xs text-red-500">⚠️ Image URL not loading — check the link</span>
        </div>
      ) : null}

      <Field label="Dish Name *" error={errors.name}>
        <input
          type="text"
          placeholder="e.g. Paneer Tikka"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
          maxLength={60}
        />
      </Field>

      <Field label="Description *" error={errors.description}>
        <textarea
          placeholder="Short description shown to customers"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          maxLength={200}
        />
        <p className="text-xs text-stone-400 mt-0.5 text-right">{form.description.length}/200</p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹) *" error={errors.price}>
          <input
            type="number"
            placeholder="0"
            value={form.price || ""}
            onChange={(e) => set("price", parseInt(e.target.value) || 0)}
            min={1}
            max={9999}
            className={inputClass}
          />
          {form.price > 0 && <p className="text-xs text-stone-400 mt-0.5">{formatPrice(form.price)}</p>}
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectClass}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Image URL *" error={errors.image}>
        <input
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={form.image}
          onChange={(e) => set("image", e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-stone-400 mt-0.5">Unsplash, Supabase Storage, or Cloudinary only. Preview updates live.</p>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prep Time">
          <select value={form.prep_time} onChange={(e) => set("prep_time", e.target.value as FormData["prep_time"])} className={selectClass}>
            <option value="fast">⚡ Fast (~5 min)</option>
            <option value="medium">⏱ Medium (~15 min)</option>
            <option value="slow">🕐 Slow (~25 min)</option>
          </select>
        </Field>
        <Field label="Profit Tag">
          <select value={form.profit_tag} onChange={(e) => set("profit_tag", e.target.value as FormData["profit_tag"])} className={selectClass}>
            <option value="high">💚 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔴 Low</option>
          </select>
        </Field>
      </div>

      <div className="flex gap-3">
        {(["available", "featured"] as const).map((key) => (
          <button
            key={key}
            onClick={() => set(key, !form[key])}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              form[key]
                ? key === "available"
                  ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                  : "bg-amber-100 border-amber-200 text-amber-700"
                : "bg-stone-50 border-stone-200 text-stone-500"
            }`}
          >
            {key === "available" ? (form.available ? "✓ Available" : "Unavailable") : (form.featured ? "⭐ Featured" : "Not Featured")}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} disabled={saving} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm shadow-orange-200">
          {saving ? "Saving..." : mode === "add" ? "Add Dish" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
