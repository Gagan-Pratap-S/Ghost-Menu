"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  AuthSession, Restaurant,
  signIn, signOut,
  fetchRestaurantByOwner,
  setAuthToken,
  validateSession,
  refreshSession,
} from "@/lib/supabase";

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

  // Restore + validate session on mount
  useEffect(() => {
    (async () => {
      try {
        const rawSession    = localStorage.getItem(SESSION_KEY);
        const rawRestaurant = localStorage.getItem(RESTAURANT_KEY);

        if (rawSession) {
          const stored = JSON.parse(rawSession) as AuthSession;

          // Re-hydrate AuthStore with token + refresh token
          setAuthToken(stored.access_token, stored.refresh_token, stored.expires_in ?? 3600);

          // Validate token is still alive — if expired, try refresh first
          let valid = await validateSession(stored.access_token);
          if (!valid) {
            valid = await refreshSession();
          }

          if (valid) {
            setSession(stored);
            if (rawRestaurant) setRestaurant(JSON.parse(rawRestaurant));
          } else {
            // Token dead and can't refresh — clear everything
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(RESTAURANT_KEY);
          }
        }
      } catch {
        // Corrupt storage — clear it
        try {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(RESTAURANT_KEY);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await signIn(email, password);
    if (error || !s) return error ?? "Login failed";

    const rest = await fetchRestaurantByOwner(s.user.id);

    setSession(s);
    setRestaurant(rest);

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      if (rest) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(rest));
      // Set lightweight cookie so middleware can protect /admin without the JWT
      document.cookie = "ghost_admin_auth=1; path=/; max-age=86400; SameSite=Strict";
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
