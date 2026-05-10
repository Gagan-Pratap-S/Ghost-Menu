"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--gm-bg)" }}>
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { session, restaurant, loading: authLoading } = useAuth();

  // ENH-4 + BUG-2 fix: unified auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    // Session exists but no restaurant → guide to onboarding
    if (!restaurant) {
      router.replace("/onboard");
    }
  }, [session, restaurant, authLoading, router]);

  if (authLoading) return <LoadingScreen message="Checking auth…" />;
  if (!session)    return <LoadingScreen message="Redirecting…" />;

  return <AnalyticsDashboard />;
}