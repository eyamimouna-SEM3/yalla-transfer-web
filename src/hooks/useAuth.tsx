import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { authService, type AuthUser } from "@/services/authService";
import { reconnectSocketsWithCurrentToken } from "@/services/socket";
import { tokenStorage } from "@/utils/tokenStorage";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(tokenStorage.getUser());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const fresh = await authService.me();
      setUser(fresh);
    } catch {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
      reconnectSocketsWithCurrentToken();
      return { error: null };
    } catch (err) {
      const e = err as { message?: string };
      return { error: new Error(e?.message ?? "Echec de connexion") };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const res = await authService.register({
        fullName: fullName ?? email,
        email,
        password,
        phone: "",
        role: "client_b2c",
      });
      setUser(res.user);
      return { error: null };
    } catch (err) {
      const e = err as { message?: string };
      return { error: new Error(e?.message ?? "Echec d'inscription") };
    }
  }, []);

  const signOut = useCallback(async () => {
    authService.logout();
    reconnectSocketsWithCurrentToken();
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
