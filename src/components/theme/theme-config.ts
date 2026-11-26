export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "scholonix-theme";

/**
 * Synchronous inline script placed in <head> before first paint to prevent
 * flash of unthemed content (FOUC). Keeps classList, data-theme, colorScheme,
 * and <meta name="color-scheme"> synchronized with stored override or OS setting.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=window.localStorage.getItem(k);var p=(s==="light"||s==="dark")?s:"system";var q=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var r=p==="system"?(q?"dark":"light"):p;var e=document.documentElement;e.classList.toggle("dark",r==="dark");e.classList.toggle("light",r==="light");e.dataset.theme=r;e.style.colorScheme=p==="system"?"light dark":p;var m=document.querySelector('meta[name="color-scheme"]');if(m){m.setAttribute("content",p==="system"?"light dark":p);}}catch(t){}})();`;
