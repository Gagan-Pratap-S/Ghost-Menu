"use client";

import React, { useEffect, useRef } from "react";

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
}

function haptic() {
  try { navigator.vibrate?.(8); } catch {}
}

export default function BottomNav({ tabs }: BottomNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty("--bottom-nav-height", `${el.offsetHeight}px`);
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
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingLeft:  "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
        paddingTop: 10,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      {/* Floating pill nav — matches JSX BottomNav exactly */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "rgba(255,253,249,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 30,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          padding: "6px 8px",
          gap: 4,
          pointerEvents: "all",
        }}
      >
        {tabs.map((tab) => (
          <NavTab key={tab.key} tab={tab} totalTabs={tabs.length} />
        ))}
      </div>
    </nav>
  );
}

function NavTab({ tab, totalTabs }: { tab: TabConfig; totalTabs: number }) {
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
        // Active tabs show icon + label in a row (matches JSX pattern)
        flexDirection: isActive ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isActive ? 6 : 3,
        padding: isActive ? "10px 16px" : "10px 8px",
        borderRadius: 24,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
        background: isActive ? "var(--gm-primary)" : "transparent",
        boxShadow: isActive
          ? "0 6px 20px rgba(255,122,0,0.28), inset 0 1px 0 rgba(255,255,255,0.20)"
          : "none",
        minWidth: 0,
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        minHeight: 52,
        whiteSpace: "nowrap",
      }}
      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)"; }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = isActive ? "scale(1.02)" : "scale(1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = isActive ? "scale(1.02)" : "scale(1)"; }}
    >
      {/* Icon */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isActive ? "#ffffff" : "#9C9C9C",
          fontSize: 0,
          flexShrink: 0,
          transition: "color 0.22s ease",
          position: "relative",
        }}
      >
        {tab.icon}
        {tab.badge != null && tab.badge > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5, right: -7,
              minWidth: 16, height: 16,
              borderRadius: 99,
              background: isActive ? "#ffffff" : "var(--gm-primary)",
              color: isActive ? "var(--gm-primary)" : "#ffffff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 6px rgba(255,122,0,0.35)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {tab.badge > 99 ? "99+" : tab.badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "#ffffff" : "#9C9C9C",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          // Expand label when active (matches JSX animation)
          maxWidth: isActive ? 60 : 0,
          opacity: isActive ? 1 : (totalTabs <= 3 ? 1 : 0),
          transition: "all 0.22s ease",
          lineHeight: 1,
        }}
      >
        {tab.label}
      </span>
      {/* Always show label below icon when not active (classic tab style) */}
      {!isActive && totalTabs <= 3 && (
        <span style={{ fontSize: 11, fontWeight: 500, color: "#9C9C9C", letterSpacing: "-0.01em", lineHeight: 1 }}>
          {tab.label}
        </span>
      )}
    </button>
  );
}
