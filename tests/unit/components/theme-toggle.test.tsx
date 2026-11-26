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
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="pref">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" data-testid="probe-toggle" onClick={toggleTheme}>
        Flip
      </button>
      <button type="button" data-testid="probe-system" onClick={() => setTheme("system")}>
        System
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
    document.head.innerHTML = '<meta name="color-scheme" content="light" />';
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("defaults to light theme when no preference is stored, even if OS prefers dark mode", () => {
    installMatchMediaMock(true);

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("pref")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute("content")).toBe(
      "light",
    );
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("toggles cleanly between light and dark and persists explicit preference", async () => {
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

    // Click 1: Light -> Dark
    await user.click(toggle);
    expect(screen.getByTestId("pref")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // Click 2: Dark -> Light
    await user.click(toggle);
    expect(screen.getByTestId("pref")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("follows OS preference only when explicitly switched to system mode", async () => {
    const media = installMatchMediaMock(false);
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeDebugProbe />
      </ThemeProvider>,
    );

    // Default light stays light even when OS flips dark
    act(() => {
      media.setDark(true);
    });
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");

    // Explicitly switch to system mode
    await user.click(screen.getByTestId("probe-system"));
    expect(screen.getByTestId("pref")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Clicking toggle pins explicit light/dark instead of removing override
    await user.click(screen.getByTestId("theme-toggle"));
    expect(screen.getByTestId("pref")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("syncs theme preference across browser tabs via window storage events and falls back to light on clear", () => {
    installMatchMediaMock(true);

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

    expect(screen.getByTestId("pref")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
