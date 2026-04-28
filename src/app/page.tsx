"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Default restaurant slug — in production each restaurant gets their own
const DEFAULT_SLUG = "cafe-delight";

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("ghostMenuGuestName");
      if (stored) setSavedName(stored);
    } catch {}
  }, []);

  const handleEnter = () => {
    const trimmed = name.trim();
    if (trimmed) {
      try { localStorage.setItem("ghostMenuGuestName", trimmed); } catch {}
    }
    router.push(`/menu/${DEFAULT_SLUG}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEnter();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-800/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slideUp">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Ghost Menu</h1>
          <p className="text-stone-400 mt-2 text-sm">Cafe Delight · QR Menu</p>
        </div>

        {/* Welcome card */}
        <div className="bg-stone-800/80 backdrop-blur-sm border border-stone-700 rounded-3xl p-6 shadow-2xl">
          {savedName ? (
            <div className="mb-4">
              <p className="text-stone-400 text-sm mb-1">Welcome back,</p>
              <p className="text-white font-semibold text-lg">{savedName} 👋</p>
            </div>
          ) : (
            <p className="text-stone-300 text-sm mb-5 leading-relaxed">
              Enter your name to personalise your experience, or jump straight in.
            </p>
          )}

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={32}
                className="w-full bg-stone-700/60 border border-stone-600 text-white placeholder-stone-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-stone-700 transition-all"
              />
            </div>

            <button
              onClick={handleEnter}
              className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-semibold rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              {name.trim() ? `Continue as ${name.trim()}` : "View Menu →"}
            </button>
          </div>
        </div>

        {/* QR hint */}
        <div className="flex items-center gap-3 mt-5 px-2">
          <div className="flex-1 h-px bg-stone-700" />
          <p className="text-stone-600 text-xs whitespace-nowrap">scan QR at your table</p>
          <div className="flex-1 h-px bg-stone-700" />
        </div>

        <p className="text-center text-stone-600 text-xs mt-4">
          Powered by Ghost Menu
        </p>
      </div>
    </div>
  );
}
