"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createRestaurant } from "@/lib/supabase";

const THEME_COLORS = [
  { name: "Orange",  value: "#DF5830" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet",  value: "#8b5cf6" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Sky",     value: "#0ea5e9" },
  { name: "Amber",   value: "#f59e0b" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function OnboardPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [slug, setSlug]           = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [theme, setTheme]         = useState(THEME_COLORS[0].value);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login?next=/onboard");
  }, [session, loading, router]);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  if (loading || !session) return null;

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) { setError("Name and slug are required."); return; }
    if (!session.user.id)             { setError("Not logged in."); return; }
    setSaving(true); setError("");
    const rest = await createRestaurant(session.user.id, { name: name.trim(), slug, theme_color: theme });
    setSaving(false);
    if (!rest) { setError("Slug may already be taken. Try a different one."); return; }
    router.replace("/admin");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div className="animate-slideUp" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--gm-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16, boxShadow: "0 4px 16px rgba(223,88,48,0.25)" }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--gm-text)", margin: 0, letterSpacing: "-0.02em" }}>Set Up Your Restaurant</h1>
          <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginTop: 4 }}>Step {step} of 2</p>
        </div>

        <div className="gm-card" style={{ padding: 32 }}>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Restaurant Name *</label>
                <input className="gm-input" type="text" placeholder="e.g. Café Delight" value={name}
                  onChange={e => setName(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>URL Slug *</label>
                <input className="gm-input" type="text" placeholder="cafe-delight" value={slug}
                  onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }} maxLength={40} />
                {slug && (
                  <div style={{ background: "var(--gm-bg)", borderRadius: 10, padding: "8px 14px", marginTop: 8, fontSize: 13, color: "var(--gm-text-secondary)" }}>
                    Menu URL: /menu/{slug}
                  </div>
                )}
              </div>
              <button onClick={() => { if (name.trim() && slug.trim()) setStep(2); else setError("Name and slug are required."); }}
                className="gm-btn-primary" style={{ width: "100%" }}>
                Next →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Brand Color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {THEME_COLORS.map(c => (
                    <button key={c.value} onClick={() => setTheme(c.value)} title={c.name}
                      style={{ width: 36, height: 36, borderRadius: 10, background: c.value, border: theme === c.value ? `3px solid ${c.value}` : "3px solid transparent", outline: theme === c.value ? "2px solid var(--gm-text)" : "none", cursor: "pointer", boxShadow: "var(--gm-shadow-sm)" }} />
                  ))}
                </div>
              </div>
              {error && (
                <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--gm-danger)" }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} className="gm-btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button onClick={handleCreate} disabled={saving} className="gm-btn-primary" style={{ flex: 2 }}>
                  {saving ? "Creating…" : "Create Restaurant"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--gm-text-tertiary)", marginTop: 20 }}>
          <a href="/admin/login" style={{ color: "var(--gm-text-tertiary)", textDecoration: "none" }}>← Back to login</a>
        </p>
      </div>
    </div>
  );
}
