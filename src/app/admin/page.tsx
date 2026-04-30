"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/supabase";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { session, restaurant, loading: authLoading } = useAuth();

  const [items, setItems]     = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) router.replace("/admin/login");
  }, [session, authLoading, router]);

  // Fetch items scoped to this admin's restaurant
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetchMenuItems(restaurant?.id).then((data) => {
      if (data && Array.isArray(data) && data.length > 0) setItems(data);
      else setItems(initialMenuItems); // fallback for local dev
      setLoading(false);
    }).catch(() => {
      setItems(initialMenuItems);
      setLoading(false);
    });
  }, [session, restaurant?.id]);

  const handleAdd = async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => {
    if (!restaurant) return;
    const tempId   = -Date.now();
    const tempItem: MenuItem = { ...data, id: tempId, clicks: 0, views: 0 };
    setItems(prev => [...prev, tempItem]);
    const created = await createMenuItem(data, restaurant.id);
    if (created) setItems(prev => prev.map(i => i.id === tempId ? created : i));
    else         setItems(prev => prev.filter(i => i.id !== tempId));
  };

  const handleUpdate = async (id: number, data: Partial<MenuItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    const updated = await updateMenuItem(id, data);
    if (updated) setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  };

  const handleDelete = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const ok = await deleteMenuItem(id);
    if (!ok) fetchMenuItems(restaurant?.id).then(d => { if (d) setItems(d); });
  };

  if (authLoading || !session) return null;

  return (
    <AdminDashboard
      items={items}
      loading={loading}
      restaurant={restaurant}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
