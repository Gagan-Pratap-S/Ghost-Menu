"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  AuthSession, Restaurant,
  signIn, signOut,
  getStoredSession,
  fetchRestaurantByOwner,
  supabaseClient,
} from "@/lib/supabase";
import { LS } from "@/lib/constants";

interface AuthContextValue {
  session: AuthSession | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setRestaurant: (r: Restaurant) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persist(s: AuthSession | null, r: Restaurant | null) {
  try {
    if (s) {
      localStorage.setItem("ghostMenuSession", JSON.stringify(s));
      document.cookie = "ghost_admin_auth=1; path=/; max-age=86400; SameSite=Strict";
    }
    if (r) localStorage.setItem(LS.RESTAURANT, JSON.stringify(r));
  } catch {}
}

function clear() {
  try {
    localStorage.removeItem("ghostMenuSession");
    localStorage.removeItem(LS.RESTAURANT);
    document.cookie = "ghost_admin_auth=; path=/; max-age=0; SameSite=Strict";
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [restaurant, setRestaurantState] = useState<Restaurant | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    // Restore via official Supabase client (handles token refresh)
    getStoredSession().then(async (s) => {
      if (s) {
        setSession(s);
        // Restore restaurant from localStorage (fast path)
        try {
          const raw = localStorage.getItem(LS.RESTAURANT);
          if (raw) setRestaurantState(JSON.parse(raw));
          else {
            const r = await fetchRestaurantByOwner(s.user.id);
            if (r) { setRestaurantState(r); persist(s, r); }
          }
        } catch {}
      }
      setLoading(false);
    });

    // Keep session in sync when token refreshes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, supabaseSession) => {
      if (supabaseSession) {
        const mapped: AuthSession = {
          access_token:  supabaseSession.access_token,
          refresh_token: supabaseSession.refresh_token ?? "",
          expires_in:    supabaseSession.expires_in    ?? 3600,
          user: { id: supabaseSession.user.id, email: supabaseSession.user.email ?? "" },
        };
        setSession(mapped);
        document.cookie = "ghost_admin_auth=1; path=/; max-age=86400; SameSite=Strict";
      } else {
        setSession(null);
        document.cookie = "ghost_admin_auth=; path=/; max-age=0; SameSite=Strict";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await signIn(email, password);
    if (error || !s) return error ?? "Login failed";

    const r = await fetchRestaurantByOwner(s.user.id);
    setSession(s);
    setRestaurantState(r);
    persist(s, r);

    // If no restaurant yet → redirect to onboard (caller handles nav)
    return null;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setRestaurantState(null);
    clear();
  }, []);

  const setRestaurant = useCallback((r: Restaurant) => {
    setRestaurantState(r);
    try { localStorage.setItem(LS.RESTAURANT, JSON.stringify(r)); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ session, restaurant, loading, login, logout, setRestaurant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
