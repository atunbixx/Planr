"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSupabaseAuth } from "@/lib/auth/client";

type Theme = "default" | "bridal" | "luxury";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeAttr(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (theme === "bridal") {
    html.setAttribute("data-theme", "bridal");
  } else if (theme === "luxury") {
    html.setAttribute("data-theme", "luxury");
  } else {
    html.removeAttribute("data-theme");
  }
}

export function ThemeProvider({ children, defaultTheme = "default" as Theme }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const { getUser } = useSupabaseAuth();
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUser();
        setIsSignedIn(!!user);
      } catch (error) {
        setIsSignedIn(false);
      }
    };
    checkAuth();
  }, [getUser]);

  // Hydrate theme from server (if signed in) or localStorage
  useEffect(() => {
    let aborted = false;

    async function hydrate() {
      // Try localStorage first (fast paint)
      const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme | null)) || null;
      const initial = stored ?? defaultTheme;
      if (!aborted) {
        setThemeState(initial);
        applyThemeAttr(initial);
      }

      // If signed in, fetch persisted preference from backend
      if (isSignedIn) {
        try {
          const res = await fetch("/api/settings/preferences", { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          const serverTheme = data?.preferences?.theme as Theme | undefined;
          if (serverTheme && !aborted) {
            setThemeState(serverTheme);
            try {
              localStorage.setItem("theme", serverTheme);
            } catch {}
            applyThemeAttr(serverTheme);
          }
        } catch {
          // ignore network errors; fall back to local state
        }
      }
    }

    hydrate();
    return () => {
      aborted = true;
    };
  }, [defaultTheme, isSignedIn]);

  // Setter that syncs to localStorage and server when signed in
  const setTheme = async (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
    applyThemeAttr(t);

    if (isSignedIn) {
      // best-effort sync to backend; ignore failures
      try {
        await fetch("/api/settings/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: t }),
        });
      } catch {
        // ignore
      }
    }
  };

  const toggleTheme = () => {
    let newTheme: Theme;
    if (theme === "default") {
      newTheme = "bridal";
    } else if (theme === "bridal") {
      newTheme = "luxury";
    } else {
      newTheme = "default";
    }
    setTheme(newTheme);
  };

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
