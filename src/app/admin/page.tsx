"use client";

import { useState, useEffect } from "react";
import { initialMenuItems, MenuItem } from "@/data/menuData";
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/supabase";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [items, setItems]     = useState<MenuItem[]>(initialMenuItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (data: Omit<MenuItem, "id" | "clicks" | "views" | "tag">) => {
    // Optimistic: create a temp item with a negative id
    const tempId = -Date.now();
    const tempItem: MenuItem = { ...data, id: tempId, clicks: 0, views: 0 };
    setItems((prev) => [...prev, tempItem]);

    const created = await createMenuItem(data);
    if (created) {
      // Replace temp with the real DB item
      setItems((prev) => prev.map((i) => (i.id === tempId ? created : i)));
    } else {
      // Rollback on failure
      setItems((prev) => prev.filter((i) => i.id !== tempId));
    }
  };

  const handleUpdate = async (id: number, data: Partial<MenuItem>) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    const updated = await updateMenuItem(id, data);
    if (updated) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }
  };

  const handleDelete = async (id: number) => {
    // Optimistic remove
    setItems((prev) => prev.filter((i) => i.id !== id));
    const ok = await deleteMenuItem(id);
    if (!ok) {
      // Rollback: re-fetch
      fetchMenuItems().then((data) => {
        if (data && Array.isArray(data)) setItems(data);
      });
    }
  };

  return (
    <AdminDashboard
      items={items}
      loading={loading}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
