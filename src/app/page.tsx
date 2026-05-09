"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LS } from "@/lib/constants";
import { useRouter } from "next/navigation";

function QRScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        if (!await QrScanner.hasCamera()) { if (!cancelled) setError("no-camera"); return; }
        if (!videoRef.current || cancelled) return;
        const scanner = new QrScanner(
          videoRef.current,
          (result) => { scanner.stop(); if (!cancelled) onResult(typeof result === "string" ? result : result.data); },
          { preferredCamera: "environment", highlightScanRegion: true }
        );
        scannerRef.current = scanner;
        await scanner.start();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) setError(msg.includes("permission") || msg.includes("NotAllowed") ? "denied" : "no-camera");
      }
    }
    start();
    return () => { cancelled = true; scannerRef.current?.stop(); scannerRef.current?.destroy(); };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div className="flex items-center justify-between px-5 py-5">
        <p style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Scan QR Code</p>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        {error ? (
          <div style={{ textAlign: "center", maxWidth: 280 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
              {error === "denied" ? "Camera access denied" : "Camera not available"}
            </p>
            <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              {error === "denied" ? "Allow camera access in your browser settings, then try again." : "Use your phone camera app or Google Lens to scan."}
            </p>
            <button className="gm-btn-primary" style={{ width: "100%" }} onClick={onClose}>Got it</button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 280, position: "relative" }}>
            <video ref={videoRef} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 20, background: "#111" }} playsInline muted />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 180, height: 180, border: "2.5px solid var(--gm-primary)", borderRadius: 16, position: "relative" }}>
                {[["0","0","tl"],["auto","0","tr"],["0","auto","bl"],["auto","auto","br"]].map(([t,l,k]) => (
                  <div key={k} style={{ position: "absolute", top: t !== "auto" ? -2 : "auto", bottom: t === "auto" ? -2 : "auto", left: l !== "auto" ? -2 : "auto", right: l === "auto" ? -2 : "auto", width: 20, height: 20, borderTop: t !== "auto" ? `4px solid var(--gm-primary)` : "none", borderBottom: t === "auto" ? `4px solid var(--gm-primary)` : "none", borderLeft: l !== "auto" ? `4px solid var(--gm-primary)` : "none", borderRight: l === "auto" ? `4px solid var(--gm-primary)` : "none", borderRadius: 3 }} />
                ))}
              </div>
            </div>
            <p style={{ color: "#999", fontSize: 13, textAlign: "center", marginTop: 16 }}>Point camera at the QR code on your table</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [members, setMembers]     = useState(1);
  const [savedName, setSavedName] = useState("");
  const [mounted, setMounted]     = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem(LS.GUEST_NAME);
      const m = localStorage.getItem(LS.MEMBER_COUNT);
      if (n) setSavedName(n);
      if (m) setMembers(parseInt(m) || 1);
    } catch {}
  }, []);

  const handleQRResult = useCallback((url: string) => {
    setShowScanner(false);
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://x.com${url}`);
      const match = parsed.pathname.match(/^\/menu\/([^/]+)/);
      if (match?.[1]) { router.push(`/menu/${match[1]}`); return; }
    } catch {}
    setScanError("QR code doesn't link to a menu. Try again.");
    setTimeout(() => setScanError(null), 4000);
  }, [router]);

  const handleEnter = () => {
    try {
      if (name.trim()) localStorage.setItem(LS.GUEST_NAME, name.trim());
      localStorage.setItem(LS.MEMBER_COUNT, String(members));
    } catch {}
    setShowScanner(true);
  };

  if (!mounted) return null;

  return (
    <>
      <div style={{ minHeight: "100vh", background: "var(--gm-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div className="animate-slideUp" style={{ width: "100%", maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--gm-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16, boxShadow: "0 4px 16px rgba(255,122,0,0.25)" }}>🍽️</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--gm-text)", margin: 0, letterSpacing: "-0.02em" }}>Ghost Menu</h1>
            <p style={{ fontSize: 14, color: "var(--gm-text-secondary)", marginTop: 4 }}>Scan the QR code on your table to begin</p>
          </div>

          {/* Card */}
          <div className="gm-card" style={{ padding: 24 }}>
            {savedName && !name && (
              <div style={{ background: "var(--gm-bg)", borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: "var(--gm-text-tertiary)", marginBottom: 2 }}>Welcome back</p>
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--gm-text)" }}>{savedName} 👋</p>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your name (optional)</label>
              <input className="gm-input" type="text" placeholder={savedName || "e.g. Raj"} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEnter()} maxLength={32} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--gm-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Party size</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setMembers(m => Math.max(1, m - 1))}
                  style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid var(--gm-border-strong)", background: "var(--gm-surface)", fontSize: 22, cursor: "pointer", color: "var(--gm-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gm-text)" }}>{members}</div>
                  <div style={{ fontSize: 12, color: "var(--gm-text-tertiary)" }}>{members === 1 ? "person" : "people"}</div>
                </div>
                <button onClick={() => setMembers(m => Math.min(20, m + 1))}
                  style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid var(--gm-border-strong)", background: "var(--gm-surface)", fontSize: 22, cursor: "pointer", color: "var(--gm-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>

            {scanError && (
              <div style={{ background: "var(--gm-danger-bg)", border: "1px solid var(--gm-danger-border)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, fontSize: 13, color: "var(--gm-danger)" }}>
                {scanError}
              </div>
            )}

            <button className="gm-btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={handleEnter}>
              Scan QR Code
            </button>
            <a href="/admin/login" style={{ display: "block", textAlign: "center", fontSize: 13, color: "var(--gm-text-tertiary)", textDecoration: "none", marginTop: 4 }}>
              Admin login →
            </a>
          </div>
        </div>
      </div>
      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} onResult={handleQRResult} />}
    </>
  );
}
