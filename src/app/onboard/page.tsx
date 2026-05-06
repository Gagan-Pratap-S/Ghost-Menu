"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createRestaurant } from "@/lib/supabase";

const THEME_COLORS = [
  { name: "Orange",  value: "#f97316" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet",  value: "#8b5cf6" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Sky",     value: "#0ea5e9" },
  { name: "Amber",   value: "#f59e0b" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const glass = { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.06)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputFocus = "focus:outline-none focus:border-orange-400";

export default function OnboardPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [step, setStep]         = useState(1);
  const [name, setName]         = useState("");
  const [slug, setSlug]         = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [theme, setTheme]       = useState(THEME_COLORS[0].value);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

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
    <div className="min-h-screen atmospheric-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: theme, boxShadow: `0 8px 24px ${theme}50` }}
          ><span className="text-2xl">🍽️</span></div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Set up your restaurant</h1>
          <p className="text-slate-500 text-sm mt-1">Step {step} of 2</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1,2].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: step >= s ? theme : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>

        <div className="rounded-3xl p-6 space-y-4" style={glass}>
          {step === 1 ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Restaurant Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cafe Delight"
                  className={`w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 ${inputFocus} transition-all`}
                  style={inputStyle} maxLength={60}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">URL Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs whitespace-nowrap">/menu/</span>
                  <input type="text" value={slug}
                    onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
                    placeholder="cafe-delight"
                    className={`flex-1 rounded-2xl px-3 py-3 text-sm text-white placeholder-slate-600 ${inputFocus} transition-all`}
                    style={inputStyle} maxLength={40}
                  />
                </div>
                <p className="text-xs text-slate-700 mt-1">Letters, numbers and dashes only</p>
              </div>
              <button onClick={() => { if (name.trim() && slug.trim()) setStep(2); else setError("Please fill in both fields."); }}
                className="btn-primary w-full py-3.5 text-sm" style={{ background: theme, boxShadow: `0 8px 24px ${theme}40` }}
              >Next →</button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Brand colour</label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_COLORS.map(c => (
                    <button key={c.value} onClick={() => setTheme(c.value)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white transition-all active:scale-95"
                      style={{ background: theme === c.value ? `${c.value}22` : "rgba(255,255,255,0.04)", border: `1px solid ${theme === c.value ? c.value : "rgba(255,255,255,0.08)"}` }}
                    >
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: c.value }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs text-slate-600 mb-1">Preview URL</p>
                <p className="text-sm font-mono text-white">/menu/<span style={{ color: theme }}>{slug}</span></p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 text-sm">← Back</button>
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-3 font-display font-bold rounded-2xl text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: theme, boxShadow: `0 8px 24px ${theme}40` }}
                >
                  {saving ? "Creating…" : "Create Restaurant"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
