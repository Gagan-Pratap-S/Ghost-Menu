"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  const submitting               = useRef(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace(searchParams.get("next") ?? "/admin");
    }
  }, [session, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || !email.trim() || !password) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const err = await login(email.trim(), password);
    if (err) {
      setError(err);
      setBusy(false);
      submitting.current = false;
    }
    // On success, useEffect above handles redirect
  };

  if (loading) return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center px-5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slideUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 8px 24px rgba(249,115,22,0.3)" }}
          >
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Ghost Menu · Restaurant Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-premium rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@restaurant.com" required autoComplete="email"
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.5)"; }}
              onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="w-full rounded-2xl px-4 py-3 pr-16 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.5)"; }}
                onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors"
              >{showPass ? "Hide" : "Show"}</button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button type="submit" disabled={busy || !email || !password} className="btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </span>
            ) : "Sign In →"}
          </button>
        </form>

        <p className="text-center text-slate-700 text-xs mt-5">
          <a href="/" className="hover:text-slate-500 transition-colors">← Back to menu</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
