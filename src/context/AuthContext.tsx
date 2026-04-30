"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AuthSession, Restaurant, signIn, signOut, fetchRestaurantByOwner, setAuthToken } from "@/lib/supabase";

interface AuthContextValue {
  session: AuthSession | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY    = "ghostMenuSession";
const RESTAURANT_KEY = "ghostMenuRestaurant";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading]       = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const rest = localStorage.getItem(RESTAURANT_KEY);
      if (raw) {
        const s = JSON.parse(raw) as AuthSession;
        setAuthToken(s.access_token);
        setSession(s);
      }
      if (rest) setRestaurant(JSON.parse(rest));
    } catch {}
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await signIn(email, password);
    if (error || !s) return error ?? "Login failed";

    // Fetch the restaurant owned by this user
    const rest = await fetchRestaurantByOwner(s.user.id);

    setSession(s);
    setRestaurant(rest);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      if (rest) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(rest));
    } catch {}

    return null; // null = success
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setRestaurant(null);
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(RESTAURANT_KEY);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ session, restaurant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
