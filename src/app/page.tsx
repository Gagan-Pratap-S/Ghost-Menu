"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LS } from "@/lib/constants";
import { useRouter } from "next/navigation";

const DEFAULT_SLUG = "cafe-delight";

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────
function QRScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (url: string) => void }) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const scannerRef  = useRef<import("qr-scanner").default | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        // Dynamically import qr-scanner (client-only)
        const QrScanner = (await import("qr-scanner")).default;

        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          if (!cancelled) setError("no-camera");
          return;
        }

        if (!videoRef.current || cancelled) return;

        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            const text = typeof result === "string" ? result : result.data;
            scanner.stop();
            if (!cancelled) onResult(text);
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
        if (!cancelled) setScanning(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) {
          if (msg.includes("permission") || msg.includes("NotAllowed")) setError("denied");
          else if (msg.includes("NotFound") || msg.includes("device")) setError("no-camera");
          else setError("unavailable");
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <p className="text-white font-display font-bold text-base">Scan QR Code</p>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl"
        >
          ×
        </button>
      </div>

      {/* Camera or error */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {error === "no-camera" || error === "unavailable" ? (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white font-display font-bold text-lg mb-2">Camera not available</p>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Use your phone's camera app or Google Lens to scan the QR code on the table.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl text-sm"
            >
              Got it
            </button>
          </div>
        ) : error === "denied" ? (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-white font-display font-bold text-lg mb-2">Camera access denied</p>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Allow camera access in your browser settings, then try again.
              <br /><br />
              Or use your phone camera app or Google Lens to scan.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl text-sm"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-xs">
            {/* Video element — qr-scanner attaches to this */}
            <video
              ref={videoRef}
              className="w-full rounded-2xl overflow-hidden bg-stone-900"
              style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
              playsInline
              muted
            />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-orange-500 rounded-2xl opacity-80">
                {/* Corner accents */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />
              </div>
            </div>
            {scanning && (
              <p className="text-center text-stone-400 text-xs mt-4">
                Point camera at the QR code on your table
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!error && (
        <div className="px-6 pb-8 flex-shrink-0 text-center">
          <p className="text-stone-600 text-xs">Can't scan? Use Google Lens on your phone</p>
        </div>
      )}
    </div>
  );
}

// ─── Welcome Page ─────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const [name, setName]                 = useState("");
  const [members, setMembers]           = useState(1);
  const [savedName, setSavedName]       = useState("");
  const [savedMembers, setSavedMembers] = useState(0);
  const [mounted, setMounted]           = useState(false);
  const [showScanner, setShowScanner]   = useState(false);
  const [scanError, setScanError]       = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const n = localStorage.getItem(LS.GUEST_NAME);
      const m = localStorage.getItem(LS.MEMBER_COUNT);
      if (n) setSavedName(n);
      if (m) setSavedMembers(parseInt(m) || 1);
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

    // Extract slug from /menu/[slug] URLs
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://placeholder.com${url}`);
      const match  = parsed.pathname.match(/^\/menu\/([^/]+)/);
      if (match?.[1]) {
        router.push(`/menu/${match[1]}`);
        return;
      }
    } catch {}

    // If it's a direct /menu/slug path (not a full URL)
    const pathMatch = url.match(/\/menu\/([^/?\s]+)/);
    if (pathMatch?.[1]) {
      router.push(`/menu/${pathMatch[1]}`);
      return;
    }

    setScanError("QR code doesn't link to a menu. Try again.");
    setTimeout(() => setScanError(null), 4000);
  }, [router]);

  if (!mounted) return null;

  const displayName    = name.trim() || savedName;
  const displayMembers = members || savedMembers;

  return (
    <>
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

            {/* Name */}
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

            {/* Party size */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">Party size</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMembers(m => Math.max(1, m - 1))}
                  className="w-10 h-10 rounded-xl bg-stone-700 text-white text-xl font-bold hover:bg-stone-600 active:scale-95 transition-all flex items-center justify-center"
                >−</button>
                <div className="flex-1 text-center">
                  <span className="text-white font-display font-bold text-2xl">{members}</span>
                  <p className="text-stone-500 text-xs mt-0.5">{members === 1 ? "person" : "people"}</p>
                </div>
                <button
                  onClick={() => setMembers(m => Math.min(20, m + 1))}
                  className="w-10 h-10 rounded-xl bg-stone-700 text-white text-xl font-bold hover:bg-stone-600 active:scale-95 transition-all flex items-center justify-center"
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

            {/* Scan error */}
            {scanError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <p className="text-red-400 text-xs text-center">{scanError}</p>
              </div>
            )}

            {/* CTAs */}
            <button
              onClick={handleEnter}
              className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-display font-bold rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-orange-500/20"
            >
              View Menu →
            </button>

            <button
              onClick={() => { setScanError(null); setShowScanner(true); }}
              className="w-full bg-stone-700/60 hover:bg-stone-700 border border-stone-600/60 text-stone-300 hover:text-white font-semibold rounded-2xl py-3 text-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3zm2 2v3h3V5zm8-2h7v7h-7zm2 2v3h3V5zM3 13h7v7H3zm2 2v3h3v-3zm11-2h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2z"/>
              </svg>
              Scan QR Code
            </button>
          </div>

          <div className="flex justify-between mt-4 px-1">
            <p className="text-stone-700 text-xs">Powered by Ghost Menu</p>
            <a href="/admin/login" className="text-stone-700 text-xs hover:text-stone-500 transition-colors">Admin →</a>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onResult={handleQRResult}
        />
      )}
    </>
  );
}
