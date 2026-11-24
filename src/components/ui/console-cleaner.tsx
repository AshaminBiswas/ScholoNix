"use client";

import { useEffect } from "react";

/**
 * ConsoleCleaner: Ensures browser DevTools console remains clean and uncluttered.
 * Suppresses framework logs, Fast Refresh noise, and development banners in the browser.
 */
export function ConsoleCleaner() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.console.log = () => {};
      window.console.info = () => {};
      window.console.debug = () => {};

      const originalWarn = window.console.warn;
      window.console.warn = (...args: unknown[]) => {
        const first = typeof args[0] === "string" ? args[0] : "";
        if (
          first.includes("Fast Refresh") ||
          first.includes("React DevTools") ||
          first.includes("Image with src") ||
          first.includes("Extra attributes from the server")
        ) {
          return;
        }
        originalWarn.apply(window.console, args);
      };
    }
  }, []);

  return null;
}
