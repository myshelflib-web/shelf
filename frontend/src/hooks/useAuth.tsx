"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@/types";
import { api, getStoredUser, clearAuth, isNetworkError } from "@/lib/api";
import { bindAccountLocalState, clearAccountLocalState } from "@/lib/accountLocalState";
import {
  AnalyticsEvents,
  identifyFromUser,
  isFreshSignup,
  resetAnalytics,
  track,
} from "@/lib/analytics";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, otp: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithTelegram: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const stored = getStoredUser();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (stored && token) {
      bindAccountLocalState(stored.id);
      setUser(stored);
      setLoading(false);
      api.auth
        .me()
        .then(({ user: next }) => {
          bindAccountLocalState(next.id);
          localStorage.setItem("user", JSON.stringify(next));
          setUser(next);
        })
        .catch((err) => {
          if (isNetworkError(err)) {
            setUser(stored);
            return;
          }
          clearAuth();
          setUser(null);
        });
      return;
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await api.auth.login(email, password);
    bindAccountLocalState(user.id);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    identifyFromUser(user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, otp: string) => {
      const { user, token } = await api.auth.register(email, password, name, otp);
      bindAccountLocalState(user.id);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      identifyFromUser(user);
      track(AnalyticsEvents.signupCompleted, { method: "email" });
    },
    []
  );

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { user, token } = await api.auth.google(credential);
    bindAccountLocalState(user.id);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    identifyFromUser(user);
    if (isFreshSignup(user)) {
      track(AnalyticsEvents.signupCompleted, { method: "google" });
    }
  }, []);

  const loginWithTelegram = useCallback(async (payload: Record<string, unknown>) => {
    const { user, token } = await api.auth.telegram(payload);
    bindAccountLocalState(user.id);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    identifyFromUser(user);
    if (isFreshSignup(user)) {
      track(AnalyticsEvents.signupCompleted, { method: "telegram" });
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    resetAnalytics();
    void clearAccountLocalState().finally(() => {
      window.location.replace("/login");
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.auth.me();
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithTelegram,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
