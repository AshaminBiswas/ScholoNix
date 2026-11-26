"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  applyThemeToDocument,
  getSystemTheme,
  persistThemePreference,
  readStoredTheme,
  useOptionalTheme,
} from "./theme-provider";
import type { ResolvedTheme, ThemePreference } from "./theme-config";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: "icon" | "pill";
}

/**
 * Accessible Light/Dark theme toggle button synchronized across tabs and sessions.
 * Uses CSS class visibility so SSR renders immediately without hydration mismatch or icon flash.
 * Safe when rendered standalone outside ThemeProvider (e.g. isolated unit tests).
 */
export function ThemeToggle({
  className,
  showLabel = false,
  variant = "icon",
}: ThemeToggleProps) {
  const ctx = useOptionalTheme();
  const [fallbackPref, setFallbackPref] = useState<ThemePreference>("system");
  const [fallbackSys, setFallbackSys] = useState<ResolvedTheme>("light");
  const [fallbackMounted, setFallbackMounted] = useState(false);

  useEffect(() => {
    if (ctx) return;
    const stored = readStoredTheme();
    const sys = getSystemTheme();
    setFallbackPref(stored);
    setFallbackSys(sys);
    setFallbackMounted(true);
    applyThemeToDocument(stored, stored === "system" ? sys : stored);
  }, [ctx]);

  const fallbackToggle = useCallback(() => {
    const sys = getSystemTheme();
    const currentResolved = fallbackPref === "system" ? sys : fallbackPref;
    const target: ResolvedTheme = currentResolved === "dark" ? "light" : "dark";
    const nextPref: ThemePreference = target === sys ? "system" : target;
    setFallbackPref(nextPref);
    setFallbackSys(sys);
    persistThemePreference(nextPref);
    applyThemeToDocument(nextPref, target);
  }, [fallbackPref]);

  const resolvedTheme: ResolvedTheme = ctx
    ? ctx.resolvedTheme
    : fallbackPref === "system"
      ? fallbackSys
      : fallbackPref;
  const mounted = ctx ? ctx.mounted : fallbackMounted;
  const handleToggle = ctx ? ctx.toggleTheme : fallbackToggle;

  const isDark = resolvedTheme === "dark";
  const accessibleLabel = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle color theme";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={accessibleLabel}
      aria-pressed={mounted ? isDark : undefined}
      title={accessibleLabel}
      data-testid="theme-toggle"
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full border border-[#D6DBF0] bg-white text-[#4D5072] shadow-xs transition-all duration-200 cursor-pointer",
        "hover:border-[#9B76FF] hover:bg-[#F2EEFD] hover:text-[#663CF6]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "dark:border-[#2E345B] dark:bg-[#161A36] dark:text-[#C5CCF0] dark:hover:border-[#8B5CF6] dark:hover:bg-[#231D4B] dark:hover:text-[#D9CEFF] dark:focus-visible:ring-offset-[#090B1A]",
        variant === "pill" || showLabel ? "h-9 gap-2 px-3 text-xs font-bold" : "h-9 w-9",
        className,
      )}
    >
      <Moon
        className="block h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-rotate-12 dark:hidden"
        aria-hidden="true"
      />
      <Sun
        className="hidden h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 group-hover:rotate-12 dark:block"
        aria-hidden="true"
      />
      {showLabel && (
        <>
          <span className="inline dark:hidden">Dark</span>
          <span className="hidden dark:inline">Light</span>
        </>
      )}
    </button>
  );
}
