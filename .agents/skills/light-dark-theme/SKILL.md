---
name: light-dark-theme
description: Implement and enforce dual Light and Dark mode styling across every ScholoNix page, component, shell, chart, modal, skeleton, and error state. Mandatory for all UI work in this repository.
---

# Light & Dark Theme Standard (ScholoNix)

**Every feature, page, component, modal, table, chart, illustration, loading skeleton, and fallback view built in ScholoNix MUST support both Light Mode and Dark Mode with full visual polish and WCAG 2.2 AA contrast.**

## Architecture

1. **Theme State (`src/components/theme/theme-provider.tsx`)**
   - Supports `"light"` (default), `"dark"`, and optional `"system"`, defaulting explicitly to **Light Mode** (`DEFAULT_THEME = "light"`) when no preference is saved in `localStorage` (`scholonix-theme`), even if the user's OS prefers dark mode.
   - Synchronizes:
     - `document.documentElement.classList` (`.dark` / `.light` class for Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`)
     - `<meta name="color-scheme">` (`"light"` by default or `"dark"` when toggled; `"light dark"` only if explicitly switched to `"system"`)
     - `window` `storage` event for cross-tab consistency and `matchMedia("(prefers-color-scheme: dark)")` `change` listener when explicitly set to `"system"`.
   - Two-state header toggle (`<ThemeToggle />` in `src/components/theme/theme-toggle.tsx`): flips cleanly between `"light"` and `"dark"` and persists the chosen mode in `localStorage`.

2. **FOUC Prevention (`src/app/layout.tsx`)**
   - Defaults `<html>` to `className="... light"`, `data-theme="light"`, and `<meta name="color-scheme" content="light" />`, with `THEME_INIT_SCRIPT` running synchronously in `<head>` before first paint so users who previously selected Dark mode see zero flash.

3. **CSS Design Tokens & Tailwind v4 (`src/app/globals.css`)**
   - Uses `@custom-variant dark (&:where(.dark, .dark *));` so `dark:` utility variants respond immediately to `.dark` on `<html>`.
   - Defines Light tokens on `:root` (`color-scheme: light`) and Dark tokens on `:root.dark` (`color-scheme: dark`) for:
     - Backgrounds: `--bg-main` (`#FCFDFE` / `#090A1A`), `--bg-secondary` (`#F5F7FD` / `#10122A`), `--bg-card` (`#FFFFFF` / `#141731`), `--bg-lavender` (`#F0EBFE` / `#1D183D`), `--bg-blue` (`#E6F4FE` / `#112238`)
     - Text: `--text-heading` (`#08093B` / `#F3F5FF`), `--text-body` (`#1B1D45` / `#DCE1F9`), `--text-muted` (`#4D5072` / `#9EA4C8`), `--text-placeholder` (`#76799C` / `#7C83AA`)
     - Borders: `--border-default` (`#D6DBF0` / `#272B4D`), `--border-input` (`#CAD0EB` / `#313761`), `--border-divider` (`#DFE3F5` / `#232746`), `--border-hover` (`#9B76FF` / `#8B5CF6`)

## Mandatory Checklist Before Shipping Any UI

- [ ] No un-paired light-only backgrounds (`bg-white`, `bg-[#FCFDFE]`, `bg-[#F5F7FD]`, `bg-[#FAF8FE]`) — always pair with `dark:...` or use semantic `var(--bg-*)` / shared UI primitives (`Card`, `Input`, `Select`, `Button`, `Table`, `Badge`).
- [ ] No un-paired light-only text (`text-[#08093B]`, `text-[#1B1D45]`, `text-[#4D5072]`) — always ensure dark mode foregrounds meet `>= 4.5:1` contrast (`>= 3:1` for large text, icons, and input/card boundaries).
- [ ] Dialogs (`<dialog>`), native selects (`color-scheme`), custom charts/SVGs (`AtmosphericBackground`, status pills), and scrollbars look crisp in both Light and Dark themes (never transition `scrollbar-color`).
- [ ] Top-level navigation headers/shells include `<ThemeToggle />`.
- [ ] Interactive theme toggle & persistence behavior is covered by automated tests.
