"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createRestaurant, fetchRestaurantBySlug, supabaseClient } from "@/lib/supabase";

const THEME_COLORS = [
  { name: "Orange",  value: "var(--gm-primary)" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet",  value: "#8b5cf6" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Sky",     value: "#0ea5e9" },
  { name: "Amber",   value: "#f59e0b" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomSuffix() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// tiny helper: darken a hex color
function darkenColor(hex: string, amount = 20): string {
  try {
    const h = hex.replace("#", "");
    const num = parseInt(h, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) - amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) - amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) - amount));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  } catch { return hex; }
}

export default function OnboardPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);

  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [slug, setSlug]           = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [theme, setTheme]         = useState(THEME_COLORS[0].value);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const isAuthenticated = !loading && !!session;
  const needsSignup     = !loading && !session;

  // remember original brand color to restore if user cancels
  const originalBrand = useRef(
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--gm-primary").trim() || "var(--gm-primary)"
      : "var(--gm-primary)"
  );

  // Fix 1: Real-time brand color preview
  useEffect(() => {
    document.documentElement.style.setProperty("--gm-primary", theme);
    document.documentElement.style.setProperty("--gm-primary-hover", darkenColor(theme, 20));
  }, [theme]);

  // Restore on unmount (cancel / navigate away without creating)
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--gm-primary", originalBrand.current);
      document.documentElement.style.setProperty("--gm-primary-hover", darkenColor(originalBrand.current, 20));
    };
  }, []);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  const handleSignup = async () => {
    if (!email.trim() || !password) { setError("Email and password are required."); return; }
    setSaving(true); setError("");
    const { error: signUpError } = await supabaseClient.auth.signUp({ email: email.trim(), password });
    setSaving(false);
    if (signUpError) { setError(signUpError.message); return; }
    setStep(2);
  };

  const ensureUniqueSlug = async (base: string): Promise<string> => {
    const existing = await fetchRestaurantBySlug(base);
    return existing ? `${base}-${randomSuffix()}` : base;
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) { setError("Name and slug are required."); return; }
    setSaving(true); setError("");
    const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
    if (!currentSession?.user?.id) { setError("Not logged in."); setSaving(false); return; }

    const finalSlug = await ensureUniqueSlug(slug.trim());
    if (finalSlug !== slug.trim()) setSlug(finalSlug);

    const rest = await createRestaurant(currentSession.user.id, { name: name.trim(), slug: finalSlug, theme_color: theme });
    setSaving(false);
    if (!rest) { setError("Failed to create restaurant. Try a different slug."); return; }

    // Don't restore brand on success — keep the chosen color
    originalBrand.current = theme;
    router.replace("/admin");
  };

  if (loading) return null;

  const totalSteps = needsSignup ? 3 : 2;
  const stepLabels = needsSignup
    ? ["Create Account", "Restaurant Details", "Brand Color"]
    : ["Restaurant Details", "Brand Color"];

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--gm-text-secondary)", marginBottom: 6,
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div className="animate-slideUp" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--gm-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16, boxShadow: "0 4px 16px rgba(255,122,0,0.25)", transition: "background 0.25s" }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--gm-text)", margin: 0, letterSpacing: "-0.02em" }}>Set Up Your Restaurant</h1>
          <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginTop: 4 }}>
            Step {step} of {totalSteps} — {stepLabels[step - 1]}
          </p>
        </div>

        <div className="gm-card" style={{ padding: 32 }}>

          {/* ── Step 1 for new users: Sign Up ── */}
          {needsSignup && step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input className="gm-input" type="email" placeholder="you@restaurant.com" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input className="gm-input" type={showPass ? "text" : "password"} placeholder="Min 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 60 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", cursor: "pointer" }}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {error && <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--gm-danger)" }}>{error}</div>}
              <button onClick={handleSignup} disabled={saving} className="gm-btn-primary" style={{ width: "100%" }}>
                {saving ? "Creating account…" : "Create Account →"}
              </button>
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--gm-text-tertiary)" }}>
                Already have an account?{" "}
                <a href="/admin/login" style={{ color: "var(--gm-primary)", textDecoration: "none", fontWeight: 500 }}>Sign in →</a>
              </p>
            </div>
          )}

          {/* ── Restaurant Name + Slug ── */}
          {((needsSignup && step === 2) || (isAuthenticated && step === 1)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Restaurant Name *</label>
                <input className="gm-input" type="text" placeholder="e.g. Café Delight" value={name}
                  onChange={e => setName(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug *</label>
                <input className="gm-input" type="text" placeholder="cafe-delight" value={slug}
                  onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }} maxLength={40} />
                {slug && (
                  <div style={{ background: "var(--gm-bg)", borderRadius: 10, padding: "8px 14px", marginTop: 8, fontSize: 13, color: "var(--gm-text-secondary)" }}>
                    Menu URL: /menu/<strong>{slug}</strong>
                  </div>
                )}
              </div>
              {error && <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--gm-danger)" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(needsSignup ? 1 : 1); }} className="gm-btn-secondary" style={{ flex: 1 }}>
                  {isAuthenticated ? "Cancel" : "← Back"}
                </button>
                <button onClick={() => { if (name.trim() && slug.trim()) { setError(""); setStep(needsSignup ? 3 : 2); } else setError("Name and slug are required."); }}
                  className="gm-btn-primary" style={{ flex: 2 }}>Next →</button>
              </div>
            </div>
          )}

          {/* ── Brand Color ── */}
          {((needsSignup && step === 3) || (isAuthenticated && step === 2)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Brand Color</label>
                <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", marginTop: -4, marginBottom: 12 }}>
                  Pick your brand accent — the preview below updates instantly.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {THEME_COLORS.map(c => (
                    <button key={c.value} onClick={() => setTheme(c.value)} title={c.name}
                      style={{
                        width: 44, height: 44, borderRadius: 12, background: c.value,
                        border: theme === c.value ? `3px solid ${c.value}` : "3px solid transparent",
                        outline: theme === c.value ? "3px solid var(--gm-text)" : "none",
                        cursor: "pointer", boxShadow: "var(--gm-shadow-sm)",
                        transform: theme === c.value ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.15s, outline 0.15s",
                      }} />
                  ))}
                </div>
              </div>

              {/* Live preview panel */}
              <div style={{ background: "var(--gm-bg)", borderRadius: 14, padding: 16, border: "1px solid var(--gm-border)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--gm-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Live Preview</p>
                <button className="gm-btn-primary" style={{ width: "100%", marginBottom: 10 }}>Create Restaurant</button>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 12px", borderRadius: 99, background: "var(--gm-primary)", color: "#fff", fontSize: 12, fontWeight: 600 }}>Popular</span>
                  <span style={{ padding: "4px 12px", borderRadius: 99, border: "2px solid var(--gm-primary)", color: "var(--gm-primary)", fontSize: 12, fontWeight: 600, background: "transparent" }}>+ Add Item</span>
                  <span style={{ padding: "4px 12px", borderRadius: 99, background: "var(--gm-primary)", color: "#fff", fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Category</span>
                </div>
              </div>

              {error && <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--gm-danger)" }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(needsSignup ? 2 : 1); }} className="gm-btn-secondary" style={{ flex: 1 }}>← Back</button>
                <button onClick={handleCreate} disabled={saving} className="gm-btn-primary" style={{ flex: 2 }}>
                  {saving ? "Creating…" : "Create Restaurant 🎉"}
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
