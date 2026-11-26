"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme-config";

interface ThemeContextValue {
  /** User preference: "system" (follow OS), "light", or "dark". */
  theme: ThemePreference;
  /** Currently active rendered theme: "light" or "dark". */
  resolvedTheme: ResolvedTheme;
  /** True after client mount so interactive controls can expose resolved state safely. */
  mounted: boolean;
  /** Set an explicit preference ("light" | "dark") or return to "system". */
  setTheme: (next: ThemePreference) => void;
  /**
   * Two-state toggle matching web best practices:
   * flips opposite of currently rendered theme, and clears stored override
   * if the target matches current system preference so OS auto-switching resumes.
   */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
  } catch {
    // Ignore storage access errors (e.g. blocked site data in private mode)
  }
  return "system";
}

export function persistThemePreference(next: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    if (next === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  } catch {
    // Theme still applies to current session even if persistence is blocked
  }
}

export function applyThemeToDocument(
  preference: ThemePreference,
  resolved: ResolvedTheme,
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.dataset.theme = resolved;
  root.style.colorScheme = preference === "system" ? "light dark" : preference;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", preference === "system" ? "light dark" : preference);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    const sys = getSystemTheme();
    const resolved = stored === "system" ? sys : stored;

    setThemeState(stored);
    setSystemTheme(sys);
    setMounted(true);
    applyThemeToDocument(stored, resolved);

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      const nextSys: ResolvedTheme = event.matches ? "dark" : "light";
      setSystemTheme(nextSys);
      const currentStored = readStoredTheme();
      const nextResolved = currentStored === "system" ? nextSys : currentStored;
      applyThemeToDocument(currentStored, nextResolved);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
        return;
      }
      const nextStored = readStoredTheme();
      const currentSys = getSystemTheme();
      setThemeState(nextStored);
      setSystemTheme(currentSys);
      applyThemeToDocument(nextStored, nextStored === "system" ? currentSys : nextStored);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleMediaChange);
    }
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  const setTheme = useCallback((next: ThemePreference) => {
    const sys = getSystemTheme();
    const nextResolved = next === "system" ? sys : next;
    setThemeState(next);
    setSystemTheme(sys);
    persistThemePreference(next);
    applyThemeToDocument(next, nextResolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const sys = getSystemTheme();
    const currentResolved = theme === "system" ? sys : theme;
    const target: ResolvedTheme = currentResolved === "dark" ? "light" : "dark";
    const nextPreference: ThemePreference = target === sys ? "system" : target;

    setThemeState(nextPreference);
    setSystemTheme(sys);
    persistThemePreference(nextPreference);
    applyThemeToDocument(nextPreference, target);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, mounted, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useOptionalTheme(): ThemeContextValue | undefined {
  return useContext(ThemeContext);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
