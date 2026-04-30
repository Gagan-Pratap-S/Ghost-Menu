"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_SLUG = "cafe-delight";

export default function WelcomePage() {
  const router  = useRouter();
  const [name, setName]               = useState("");
  const [members, setMembers]         = useState(1);
  const [savedName, setSavedName]     = useState("");
  const [savedMembers, setSavedMembers] = useState(0);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem("ghostMenuGuestName");
      const m = localStorage.getItem("ghostMenuMemberCount");
      if (n) setSavedName(n);
      if (m) setSavedMembers(parseInt(m));
    } catch {}
  }, []);

  const handleEnter = () => {
    const trimmed = name.trim() || savedName;
    try {
      if (name.trim()) localStorage.setItem("ghostMenuGuestName", name.trim());
      localStorage.setItem("ghostMenuMemberCount", String(members));
    } catch {}
    router.push(`/menu/${DEFAULT_SLUG}`);
  };

  if (!mounted) return null;

  const displayName    = name.trim() || savedName;
  const displayMembers = members || savedMembers;

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slideUp">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-xl shadow-orange-500/30">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Ghost Menu</h1>
          <p className="text-stone-500 mt-1.5 text-sm">Cafe Delight</p>
        </div>

        {/* Card */}
        <div className="bg-stone-800/70 backdrop-blur-md border border-stone-700/60 rounded-3xl p-6 shadow-2xl space-y-4">
          {savedName && !name && (
            <div className="bg-stone-700/50 rounded-2xl px-4 py-3">
              <p className="text-stone-400 text-xs">Welcome back</p>
              <p className="text-white font-semibold mt-0.5">{savedName} 👋</p>
            </div>
          )}

          {/* Name input */}
          <div>
            <label className="text-xs font-semibold text-stone-400 block mb-1.5">Your name</label>
            <input
              type="text"
              placeholder={savedName || "e.g. Raj"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              maxLength={32}
              className="w-full bg-stone-700/60 border border-stone-600/60 text-white placeholder-stone-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/70 focus:bg-stone-700 transition-all"
            />
          </div>

          {/* Members counter */}
          <div>
            <label className="text-xs font-semibold text-stone-400 block mb-1.5">Party size</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMembers(m => Math.max(1, m - 1))}
                className="w-10 h-10 rounded-xl bg-stone-700 text-white text-xl font-bold hover:bg-stone-600 active:scale-95 transition-all flex items-center justify-center"
                aria-label="Decrease"
              >−</button>
              <div className="flex-1 text-center">
                <span className="text-white font-display font-bold text-2xl">{members}</span>
                <p className="text-stone-500 text-xs mt-0.5">{members === 1 ? "person" : "people"}</p>
              </div>
              <button
                onClick={() => setMembers(m => Math.min(20, m + 1))}
                className="w-10 h-10 rounded-xl bg-stone-700 text-white text-xl font-bold hover:bg-stone-600 active:scale-95 transition-all flex items-center justify-center"
                aria-label="Increase"
              >+</button>
            </div>
          </div>

          {/* Preview pill */}
          {(displayName || displayMembers > 0) && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
              <p className="text-orange-300 text-xs text-center">
                {displayName ? `Hi ${displayName}` : "Hey there"} · Table for {displayMembers || members} 🪑
              </p>
            </div>
          )}

          <button
            onClick={handleEnter}
            className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-display font-bold rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-orange-500/20"
          >
            View Menu →
          </button>
        </div>

        {/* QR divider */}
        <div className="flex items-center gap-3 mt-5 px-1">
          <div className="flex-1 h-px bg-stone-800" />
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-stone-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3zm2 2v3h3V5zm8-2h7v7h-7zm2 2v3h3V5zM3 13h7v7H3zm2 2v3h3v-3zm11-2h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2z"/>
            </svg>
            <p className="text-stone-600 text-xs whitespace-nowrap">scan QR at your table</p>
          </div>
          <div className="flex-1 h-px bg-stone-800" />
        </div>

        <div className="flex justify-between mt-4 px-1">
          <p className="text-stone-700 text-xs">Powered by Ghost Menu</p>
          <a href="/admin/login" className="text-stone-700 text-xs hover:text-stone-500 transition-colors">Admin →</a>
        </div>
      </div>
    </div>
  );
}
