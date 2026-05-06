"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LS } from "@/lib/constants";

const DEFAULT_SLUG = "cafe-delight";

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────
function QRScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (url: string) => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) { if (!cancelled) setError("no-camera"); return; }
        if (!videoRef.current || cancelled) return;
        const scanner = new QrScanner(
          videoRef.current,
          (result) => { const text = typeof result === "string" ? result : result.data; scanner.stop(); if (!cancelled) onResult(text); },
          { preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true }
        );
        scannerRef.current = scanner;
        await scanner.start();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) {
          if (msg.includes("permission") || msg.includes("NotAllowed")) setError("denied");
          else setError("no-camera");
        }
      }
    }
    start();
    return () => { cancelled = true; scannerRef.current?.stop(); scannerRef.current?.destroy(); };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-between px-5 py-5 relative z-10 flex-shrink-0">
        <div>
          <p className="font-display font-bold text-white text-lg tracking-tight">Scan QR Code</p>
          <p className="text-slate-500 text-xs mt-0.5">Point at the code on your table</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
        >×</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {error ? (
          <div className="text-center max-w-xs glass-premium rounded-3xl p-8">
            <div className="text-5xl mb-4">{error === "denied" ? "🔒" : "📷"}</div>
            <p className="font-display font-bold text-white text-lg mb-2">
              {error === "denied" ? "Camera access denied" : "Camera not available"}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {error === "denied"
                ? "Allow camera access in your browser settings, then try again."
                : "Use your phone's camera app or Google Lens to scan the QR code on your table."}
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3 text-sm">Got it</button>
          </div>
        ) : (
          <div className="w-full max-w-xs">
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "1/1", background: "#111" }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Corner frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-500 rounded-br-lg" />
                </div>
              </div>
              {/* Scan line */}
              <div className="absolute inset-x-8 h-px bg-orange-500/60 animate-pulse" style={{ top: "50%" }} />
            </div>
            <p className="text-center text-slate-500 text-xs mt-4">Align QR code within the frame</p>
          </div>
        )}
      </div>

      {!error && (
        <div className="px-6 pb-10 flex-shrink-0 text-center relative z-10">
          <p className="text-slate-700 text-xs">Can't scan? Use Google Lens on your phone</p>
        </div>
      )}
    </div>
  );
}

// ─── Welcome Page ─────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [members, setMembers]         = useState(1);
  const [savedName, setSavedName]     = useState("");
  const [mounted, setMounted]         = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError]     = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem(LS.GUEST_NAME);
      const m = localStorage.getItem(LS.MEMBER_COUNT);
      if (n) setSavedName(n);
      if (m) setMembers(parseInt(m) || 1);
    } catch {}
  }, []);

  const handleEnter = () => {
    try {
      if (name.trim()) localStorage.setItem(LS.GUEST_NAME, name.trim());
      localStorage.setItem(LS.MEMBER_COUNT, String(members));
    } catch {}
    router.push(`/menu/${DEFAULT_SLUG}`);
  };

  const handleQRResult = useCallback((url: string) => {
    setShowScanner(false);
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://x.com${url}`);
      const match  = parsed.pathname.match(/^\/menu\/([^/]+)/);
      if (match?.[1]) { router.push(`/menu/${match[1]}`); return; }
    } catch {}
    const pathMatch = url.match(/\/menu\/([^/?\\s]+)/);
    if (pathMatch?.[1]) { router.push(`/menu/${pathMatch[1]}`); return; }
    setScanError("QR code doesn't link to a menu. Try again.");
    setTimeout(() => setScanError(null), 4000);
  }, [router]);

  if (!mounted) return null;

  const displayName = name.trim() || savedName;

  return (
    <>
      <div className="atmospheric-bg min-h-screen flex flex-col items-center justify-center px-5 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, rgba(15,23,42,0.8) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-sm animate-slideUp">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 8px 32px rgba(249,115,22,0.35), 0 0 0 1px rgba(249,115,22,0.2)" }}
            >
              <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Ghost Menu</h1>
            <p className="text-slate-500 mt-1.5 text-sm">Cafe Delight</p>
          </div>

          {/* Main card */}
          <div className="glass-premium rounded-3xl p-6 space-y-4">
            {savedName && !name && (
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                <p className="text-slate-500 text-xs">Welcome back</p>
                <p className="text-white font-semibold mt-0.5">{savedName} 👋</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">Your name</label>
              <input
                type="text"
                placeholder={savedName || "e.g. Raj"}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEnter()}
                maxLength={32}
                className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.border = "1px solid rgba(249,115,22,0.5)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-wide uppercase">Party size</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setMembers(m => Math.max(1, m - 1))}
                  className="w-11 h-11 rounded-xl text-white text-xl font-bold transition-all active:scale-90 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >−</button>
                <div className="flex-1 text-center">
                  <span className="font-display font-extrabold text-3xl text-white tabular-nums">{members}</span>
                  <p className="text-slate-500 text-xs mt-0.5">{members === 1 ? "person" : "people"}</p>
                </div>
                <button onClick={() => setMembers(m => Math.min(20, m + 1))}
                  className="w-11 h-11 rounded-xl text-white text-xl font-bold transition-all active:scale-90 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >+</button>
              </div>
            </div>

            {displayName && (
              <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <p className="text-orange-400 text-xs font-medium">
                  Hi {displayName} · Table for {members} 🪑
                </p>
              </div>
            )}

            {scanError && (
              <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-red-400 text-xs">{scanError}</p>
              </div>
            )}

            <button onClick={handleEnter} className="btn-primary w-full py-3.5 text-sm">
              View Menu →
            </button>

            <button onClick={() => { setScanError(null); setShowScanner(true); }} className="btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3zm2 2v3h3V5zm8-2h7v7h-7zm2 2v3h3V5zM3 13h7v7H3zm2 2v3h3v-3zm11-2h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2z"/>
              </svg>
              Scan QR Code
            </button>
          </div>

          <div className="flex justify-between mt-5 px-1">
            <p className="text-slate-700 text-xs">Powered by Ghost Menu</p>
            <a href="/admin/login" className="text-slate-700 text-xs hover:text-slate-500 transition-colors">Admin →</a>
          </div>
        </div>
      </div>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} onResult={handleQRResult} />}
    </>
  );
}
