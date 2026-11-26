// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY } from "@/components/theme/theme-config";

interface MatchMediaController {
  setDark: (isDark: boolean) => void;
}

function installMatchMediaMock(initialDark: boolean): MatchMediaController {
  let matches = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn((cb: (event: MediaQueryListEvent) => void) => listeners.add(cb)),
      removeListener: vi.fn((cb: (event: MediaQueryListEvent) => void) => listeners.delete(cb)),
      addEventListener: vi.fn((type: string, cb: EventListenerOrEventListenerObject) => {
        if (type === "change" && typeof cb === "function") {
          listeners.add(cb as (event: MediaQueryListEvent) => void);
        }
      }),
      removeEventListener: vi.fn((type: string, cb: EventListenerOrEventListenerObject) => {
        if (type === "change" && typeof cb === "function") {
          listeners.delete(cb as (event: MediaQueryListEvent) => void);
        }
      }),
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    setDark: (nextDark: boolean) => {
      matches = nextDark;
      const event = {
        matches: nextDark,
        media: "(prefers-color-scheme: dark)",
      } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

function ThemeDebugProbe() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="pref">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" data-testid="probe-toggle" onClick={toggleTheme}>
        Flip
      </button>
    </div>
  );
}

describe("ThemeProvider & ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
    document.head.innerHTML = '<meta name="color-scheme" content="light dark" />';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("defaults to system theme when no preference is stored and follows OS preference", () => {
    installMatchMediaMock(true);

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("pref")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("light dark");
    expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute("content")).toBe(
      "light dark",
    );
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("switches to explicit override when diverging from OS and clears override when returning to OS match", async () => {
    installMatchMediaMock(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    const toggle = screen.getByTestId("theme-toggle");

    // Light OS -> click toggles to dark (diverges from OS -> persists override)
    await user.click(toggle);
    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // Click again -> returns to light matching OS -> clears override to follow system
    await user.click(toggle);
    expect(screen.getByTestId("pref")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("preserves an explicit user override even if OS preference later changes to match it", async () => {
    const media = installMatchMediaMock(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");

    // OS switches to dark (matching the explicit pin) and then back to light
    act(() => {
      media.setDark(true);
    });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => {
      media.setDark(false);
    });
    // Because pin was preserved, UI stays dark despite OS switching back to light
    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("syncs theme preference across browser tabs via window storage events", () => {
    installMatchMediaMock(false);

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      fireEvent(
        window,
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "dark",
        }),
      );
    });

    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      fireEvent(
        window,
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: null,
        }),
      );
    });

    expect(screen.getByTestId("pref")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
