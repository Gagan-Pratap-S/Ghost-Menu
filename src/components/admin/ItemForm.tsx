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

export default function ItemForm({ mode, item, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(
    item ? { name: item.name, description: item.description, price: item.price, category: item.category,
              image: item.image, available: item.available, featured: item.featured,
              prep_time: item.prep_time, profit_tag: item.profit_tag } : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const isValidImage = form.image.startsWith("http");
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div className="gm-card animate-slideUp" style={{ padding: 20, marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--gm-text)", margin: 0 }}>
          {mode === "add" ? "✨ Add New Dish" : "✏️ Edit Dish"}
        </h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, color: "var(--gm-text-tertiary)", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {isValidImage && !imgError && (
        <div style={{ position: "relative", height: 140, borderRadius: 14, overflow: "hidden", background: "var(--gm-bg)", marginBottom: 16 }}>
          <Image src={form.image} alt="Preview" fill sizes="400px" className="object-cover"
            onError={() => setImgError(true)} />
          <span style={{ position: "absolute", bottom: 8, left: 12, fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Preview</span>
        </div>
      )}
      {isValidImage && imgError && (
        <div style={{ height: 48, background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "var(--gm-danger)" }}>⚠ Image URL not loading</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input className="gm-input" type="text" placeholder="e.g. Paneer Tikka" value={form.name}
            onChange={e => set("name", e.target.value)} maxLength={60} />
          {errors.name && <p style={{ fontSize: 12, color: "var(--gm-danger)", marginTop: 4 }}>{errors.name}</p>}
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea className="gm-input" placeholder="Short description shown to customers" value={form.description}
            onChange={e => set("description", e.target.value)} rows={2} maxLength={200}
            style={{ height: "auto", padding: "12px 14px", resize: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {errors.description && <p style={{ fontSize: 12, color: "var(--gm-danger)" }}>{errors.description}</p>}
            <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginLeft: "auto" }}>{form.description.length}/200</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Price (₹) *</label>
           <input className="gm-input tabular-nums" type="number" placeholder="0" value={form.price || ""}
  onChange={e => set("price", parseInt(e.target.value) || 0)} min={1} max={9999} />
            {errors.price && <p style={{ fontSize: 12, color: "var(--gm-danger)", marginTop: 4 }}>{errors.price}</p>}
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select className="gm-input" value={form.category} onChange={e => set("category", e.target.value)} style={{ appearance: "none" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Image URL *</label>
          <input className="gm-input" type="url" placeholder="https://images.unsplash.com/…" value={form.image}
            onChange={e => { set("image", e.target.value); setImgError(false); }} />
          {errors.image && <p style={{ fontSize: 12, color: "var(--gm-danger)", marginTop: 4 }}>{errors.image}</p>}
          <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginTop: 4 }}>Paste any https image URL</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Prep Time</label>
            <select className="gm-input" value={form.prep_time} onChange={e => set("prep_time", e.target.value as FormData["prep_time"])} style={{ appearance: "none" }}>
              <option value="fast">⚡ Fast (5–10 min)</option>
              <option value="medium">⏱ Medium (~15 min)</option>
              <option value="slow">🕐 Slow (~30 min)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Profit Tag</label>
            <select className="gm-input" value={form.profit_tag} onChange={e => set("profit_tag", e.target.value as FormData["profit_tag"])} style={{ appearance: "none" }}>
              <option value="high">💚 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🔴 Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {(["available", "featured"] as const).map(key => (
            <button key={key} onClick={() => set(key, !form[key])} style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
              ...(form[key]
                ? key === "available"
                  ? { background: "var(--gm-success-bg)", border: "1px solid var(--gm-success-border)", color: "#15803D" }
                  : { background: "var(--gm-warning-bg)", border: "1px solid var(--gm-warning-border)", color: "#92400E" }
                : { background: "var(--gm-bg)", border: "1px solid var(--gm-border)", color: "var(--gm-text-secondary)" }) }}>
              {key === "available" ? (form.available ? "✓ Available" : "Unavailable") : (form.featured ? "⭐ Featured" : "Not Featured")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <button onClick={onCancel} disabled={saving} className="gm-btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="gm-btn-primary" style={{ flex: 1 }}>
            {saving ? "Saving…" : mode === "add" ? "Add Dish" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
