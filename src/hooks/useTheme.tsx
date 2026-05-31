import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark"; // ce qui est vraiment appliqué
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LS_KEY = "yalla.themeMode";

const detectSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: "light" | "dark") => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

/**
 * ThemeProvider — applique le thème (clair/sombre/système) à toute l'app.
 *
 * Priorité d'initialisation :
 *  1. localStorage (pour appliquer le thème AVANT que useAuth ne charge l'user)
 *  2. user.themeMode (synchronisé via useEffect quand l'user est connu)
 *  3. système (par défaut)
 *
 * Les changements via setThemeMode :
 *  - mettent à jour le DOM immédiatement
 *  - persistent en localStorage
 *  - le backend est mis à jour séparément via authService.updatePreferences
 *    (déjà appelé depuis SettingsContent → on évite la double écriture).
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = (typeof window !== "undefined"
      ? localStorage.getItem(LS_KEY)
      : null) as ThemeMode | null;
    return saved || "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    return themeMode === "system" ? detectSystemTheme() : (themeMode as "light" | "dark");
  });

  // Quand l'utilisateur est chargé / change, synchronise le thème depuis ses préférences DB
  useEffect(() => {
    const fromUser = (user as any)?.themeMode as ThemeMode | undefined;
    if (fromUser && (fromUser === "system" || fromUser === "light" || fromUser === "dark")) {
      setThemeModeState(fromUser);
    }
  }, [user]);

  // Calcule et applique le thème résolu à chaque changement
  useEffect(() => {
    const compute = (): "light" | "dark" =>
      themeMode === "system" ? detectSystemTheme() : (themeMode as "light" | "dark");

    const current = compute();
    setResolvedTheme(current);
    applyTheme(current);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, themeMode);
    }

    // Si on est en mode "system", on écoute les changements de préférence OS
    if (themeMode === "system" && typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const next = mql.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyTheme(next);
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
