import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "../../lib/api";
import type { RegisterInput, User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return setUser(null);
    try {
      setUser((await api.get<{ user: User }>("/api/auth/me")).user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const onLogout = () => setUser(null);
    window.addEventListener("fag:logout", onLogout);
    return () => window.removeEventListener("fag:logout", onLogout);
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      refresh,
      async login(email, password) {
        const res = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
        tokenStore.set(res.token);
        setUser(res.user);
        return res.user;
      },
      async register(input) {
        const res = await api.post<{ token: string; user: User }>("/api/auth/register", input);
        tokenStore.set(res.token);
        setUser(res.user);
        return res.user;
      },
      logout() {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
