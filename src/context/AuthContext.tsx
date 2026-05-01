"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  AuthSession, Restaurant,
  signIn, signOut,
  getStoredSession,
  fetchRestaurantByOwner,
  supabaseClient,
} from "@/lib/supabase";

interface AuthContextValue {
  session: AuthSession | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const RESTAURANT_KEY = "ghostMenuRestaurant";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]       = useState<AuthSession | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading]       = useState(true);

  // Restore session on mount via official Supabase client
  // (it manages its own localStorage key and handles token refresh)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const s = await getStoredSession();
        if (cancelled) return;

        if (s) {
          setSession(s);
          // Try restoring restaurant from cache first
          try {
            const raw = localStorage.getItem(RESTAURANT_KEY);
            if (raw) setRestaurant(JSON.parse(raw));
          } catch {}
          // Then re-fetch to ensure it's current
          fetchRestaurantByOwner(s.user.id).then((rest) => {
            if (cancelled || !rest) return;
            setRestaurant(rest);
            try { localStorage.setItem(RESTAURANT_KEY, JSON.stringify(rest)); } catch {}
          });
        }
      } catch {
        // If anything fails, start with no session — user will log in
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Subscribe to Supabase auth state changes (handles token refresh, sign-out from other tabs)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || !s) {
        setSession(null);
        setRestaurant(null);
        try { localStorage.removeItem(RESTAURANT_KEY); } catch {}
        try { document.cookie = "ghost_admin_auth=; path=/; max-age=0; SameSite=Strict"; } catch {}
      }
      // SIGNED_IN / TOKEN_REFRESHED — update session silently, don't re-fetch restaurant
      if (s && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        const mapped: AuthSession = {
          access_token:  s.access_token,
          refresh_token: s.refresh_token ?? "",
          expires_in:    s.expires_in    ?? 3600,
          user: { id: s.user.id, email: s.user.email ?? "" },
        };
        setSession(mapped);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await signIn(email, password);
    if (error || !s) return error ?? "Login failed";

    setSession(s);

    // Fetch restaurant — don't block the login response on this
    fetchRestaurantByOwner(s.user.id).then((rest) => {
      setRestaurant(rest);
      try { if (rest) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(rest)); } catch {}
    });

    // Set cookie for middleware edge protection
    try { document.cookie = "ghost_admin_auth=1; path=/; max-age=86400; SameSite=Strict"; } catch {}

    return null; // null = success
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setRestaurant(null);
    try {
      localStorage.removeItem(RESTAURANT_KEY);
      document.cookie = "ghost_admin_auth=; path=/; max-age=0; SameSite=Strict";
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
