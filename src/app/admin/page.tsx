"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/supabase";
import AdminDashboard from "@/components/admin/AdminDashboard";

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--gm-bg)" }}>
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { session, restaurant, loading: authLoading } = useAuth();

  const [items, setItems]           = useState<MenuItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

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

  // Fetch menu items once we have a confirmed session + restaurant
  useEffect(() => {
    if (!session || !restaurant?.id) return;
    setDataLoading(true);
    fetchMenuItems(restaurant.id)
      .then(data => {
        if (data && data.length > 0) setItems(data);
        else setItems(initialMenuItems);
      })
      .catch(() => setItems(initialMenuItems))
      .finally(() => setDataLoading(false));
  }, [session, restaurant?.id]);

  if (authLoading) return <LoadingScreen message="Checking auth…" />;
  if (!session)    return <LoadingScreen message="Redirecting…" />;

  const handleAdd = async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => {
    if (!restaurant?.id) return;
    const tempId = -Date.now();
    setItems(prev => [...prev, { ...data, id: tempId, clicks: 0, views: 0 }]);
    const created = await createMenuItem(data, restaurant.id);
    if (created) setItems(prev => prev.map(i => i.id === tempId ? created : i));
    else         setItems(prev => prev.filter(i => i.id !== tempId));
  };

  // BUG-2: snapshot before optimistic update, rollback on null response
  const handleUpdate = async (id: number, data: Partial<MenuItem>) => {
    if (!restaurant?.id) return;
    const prev = items.find(i => i.id === id); // snapshot
    setItems(curr => curr.map(i => i.id === id ? { ...i, ...data } : i));
    const updated = await updateMenuItem(id, restaurant.id, data);
    if (updated) {
      setItems(curr => curr.map(i => i.id === id ? { ...i, ...updated } : i));
    } else if (prev) {
      setItems(curr => curr.map(i => i.id === id ? prev : i)); // rollback
      console.error("[ghost-menu] handleUpdate: server returned null, rolled back item", id);
    }
  };

  const handleDelete = async (id: number) => {
    if (!restaurant?.id) return;
    setItems(prev => prev.filter(i => i.id !== id));
    const ok = await deleteMenuItem(id, restaurant.id);
    if (!ok) fetchMenuItems(restaurant.id).then(d => { if (d) setItems(d); });
  };

  return (
    <AdminDashboard
      items={items}
      loading={dataLoading}
      restaurant={restaurant}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
