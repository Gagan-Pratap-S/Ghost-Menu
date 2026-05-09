"use client";

import React, { useEffect, useRef } from "react";

// ─── Tab configuration type ────────────────────────────────────────────────────
export interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}

interface BottomNavProps {
  tabs: TabConfig[];
  /** Adds extra padding when true so sticky header doesn't overlap */
  elevated?: boolean;
}

function haptic() {
  try { navigator.vibrate?.(8); } catch {}
}

/**
 * BottomNav — Premium floating pill navigation
 * Visual: frosted card, orange active pill, safe-area aware
 */
export default function BottomNav({ tabs, elevated }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  // Expose nav height to CSS for page padding
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--bottom-nav-height",
        `${el.offsetHeight}px`
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        // Safe area padding
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(12px, env(safe-area-inset-left))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
        paddingTop: 10,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid #DFE2EC",
          borderRadius: 28,
          boxShadow: "0 20px 50px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.05)",
          display: "flex",
          alignItems: "center",
          padding: "6px 8px",
          gap: 4,
          pointerEvents: "all",
        }}
      >
        {tabs.map((tab) => (
          <NavTab key={tab.key} tab={tab} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({ tab }: { tab: TabConfig }) {
  const isActive = !!tab.active;

  const handleClick = () => {
    haptic();
    tab.onClick?.();
    if (tab.href) window.location.href = tab.href;
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={tab.label}
      onClick={handleClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: isActive ? "10px 16px" : "10px 8px",
        borderRadius: 22,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
        transform: isActive ? "scale(1.03)" : "scale(1)",
        // Active: orange filled pill with glow
        // Inactive: transparent
        background: isActive
          ? "linear-gradient(135deg, #F97316 0%, #FD5B30 100%)"
          : "transparent",
        boxShadow: isActive
          ? "0 8px 24px rgba(249,115,22,0.30), inset 0 1px 0 rgba(255,255,255,0.20)"
          : "none",
        minWidth: 0,
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = isActive ? "scale(1.03)" : "scale(1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = isActive ? "scale(1.03)" : "scale(1)";
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isActive ? "#ffffff" : "#4B5563",
          fontSize: 0,
          flexShrink: 0,
          transition: "color 0.22s ease",
          position: "relative",
        }}
      >
        {tab.icon}
        {/* Badge */}
        {tab.badge != null && tab.badge > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -7,
              minWidth: 16,
              height: 16,
              borderRadius: 99,
              background: isActive ? "#ffffff" : "#F97316",
              color: isActive ? "#F97316" : "#ffffff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 6px rgba(249,115,22,0.35)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {tab.badge > 99 ? "99+" : tab.badge}
          </span>
        )}
      </span>

      {/* Label — only show when active for cleaner look */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isActive ? "#ffffff" : "#4B5563",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          transition: "all 0.22s ease",
          maxWidth: isActive ? 80 : 0,
          overflow: "hidden",
          opacity: isActive ? 1 : 0,
        }}
      >
        {tab.label}
      </span>
    </button>
  );
}
