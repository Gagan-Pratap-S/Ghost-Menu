"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchOrders } from "@/lib/supabase";
import BottomNav from "./BottomNav";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 4 5.5 4 9c0 2.4 1.3 4.5 3 5.7V17h10v-2.3C18.7 13.5 20 11.4 20 9c0-3.5-3.6-7-8-7z" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  );
}
function IconQR() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h.01M14 17h3M17 14v3M20 20h.01" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-3-3-4 4" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconOrders() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

interface Props {
  restaurantId?: string;
}

export default function AdminBottomNav({ restaurantId }: Props) {
  const pathname = usePathname() ?? "";
  const [pendingCount, setPendingCount] = useState(0);

  // Poll for pending orders every 30s
  useEffect(() => {
    if (!restaurantId) return;
    const load = async () => {
      const orders = await fetchOrders(restaurantId);
      setPendingCount(orders.filter(o => o.status === "pending").length);
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [restaurantId]);

  const tabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <IconDashboard />,
      active: pathname === "/admin",
      href: "/admin",
    },
    {
      key: "menu",
      label: "Menu",
      icon: <IconMenu />,
      active: pathname.startsWith("/admin/menu"),
      href: "/admin/menu",
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: <IconAnalytics />,
      active: pathname.startsWith("/admin/analytics"),
      href: "/admin/analytics",
    },
    {
      key: "settings",
      label: "Settings",
      icon: <IconSettings />,
      active: pathname.startsWith("/admin/settings"),
      href: "/admin/settings",
    },
    {
      key: "qr",
      label: "QR",
      icon: <IconQR />,
      active: pathname.startsWith("/admin/qr"),
      href: "/admin/qr",
    },
    {
      key: "orders",
      label: "Orders",
      icon: <IconOrders />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      active: pathname.startsWith("/admin/orders"),
      href: "/admin/orders",
    },
  ];

  return <BottomNav tabs={tabs} />;
}
