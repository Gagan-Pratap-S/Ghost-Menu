"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, session, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Already logged in → forward to ?next or /admin
  useEffect(() => {
  if (!loading && session) {
    const next = searchParams.get("next") ?? "/admin";
    setBusy(false); // ✅ ensure UI resets
    router.replace(next);
  }
}, [session, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError("");
    const err = await login(email.trim(), password);
    if (err) {
      setError(err);
      setBusy(false);
    } 
  };

if (loading) {
  return null; // or loader
}

if (!session) {
  router.replace("/admin/login");
  return null;
}

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-5">
      <div className="w-full max-w-sm animate-slideUp">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl mb-3 shadow-lg shadow-orange-500/30">
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-stone-500 text-sm mt-1">Ghost Menu · Restaurant Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-stone-800/70 backdrop-blur-md border border-stone-700/60 rounded-3xl p-6 space-y-4 shadow-2xl"
        >
          <div>
            <label className="text-xs font-semibold text-stone-400 block mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-stone-700/60 border border-stone-600/60 text-white placeholder-stone-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/70 focus:bg-stone-700 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-400 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-stone-700/60 border border-stone-600/60 text-white placeholder-stone-600 rounded-2xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-orange-500/70 focus:bg-stone-700 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs font-medium"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-orange-500/20"
          >
            {busy ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p className="text-center text-stone-700 text-xs mt-5">
          <a href="/" className="hover:text-stone-500 transition-colors">← Back to menu</a>
        </p>
      </div>
    </div>
  );
}

// useSearchParams requires Suspense boundary in Next.js App Router
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
