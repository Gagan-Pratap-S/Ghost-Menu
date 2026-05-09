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
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid var(--gm-border)", borderTopColor: "var(--gm-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div className="animate-slideUp" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--gm-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16, boxShadow: "0 6px 20px rgba(255,122,0,0.28)" }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--gm-text)", margin: 0, letterSpacing: "-0.02em" }}>Admin Login</h1>
          <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginTop: 4 }}>Ghost Menu · Restaurant Portal</p>
        </div>

        <div className="gm-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
              <input className="gm-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@restaurant.com" required autoComplete="email" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="gm-input" type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  autoComplete="current-password" style={{ paddingRight: 60 }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", cursor: "pointer" }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: "var(--gm-radius-sm)", padding: "12px 16px", fontSize: 13, color: "var(--gm-danger)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="gm-btn-primary" disabled={busy || !email || !password} style={{ width: "100%" }}>
              {busy ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "var(--gm-text-tertiary)", marginTop: 4 }}>
              First time?{" "}
              <a href="/onboard" style={{ color: "var(--gm-primary)", textDecoration: "none", fontWeight: 500 }}>
                Set up your restaurant →
              </a>
            </p>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--gm-text-tertiary)", marginTop: 20 }}>
          <a href="/" style={{ color: "var(--gm-text-tertiary)", textDecoration: "none" }}>← Back to menu</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
