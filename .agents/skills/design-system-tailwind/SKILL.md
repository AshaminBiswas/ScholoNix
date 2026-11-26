---
name: design-system-tailwind
description: Create and maintain a consistent Tailwind and component design system.
---

# Design System and Tailwind Skill

## Workflow
1. Inspect existing tokens, theme configuration, Shadcn/Radix usage, and CSS conventions.
2. Define semantic tokens for background, surface, text, border, focus, primary, destructive, success, warning, and muted states.
3. Establish typography, spacing, radii, shadows, breakpoints, and motion rules.
4. Build accessible primitives before feature-specific compositions.
5. Use variants for meaningful component states; avoid one-off styling drift.
6. Verify light and dark themes on every surface (never leave un-paired light-only colors).

## Rules
- Prefer semantic design tokens over arbitrary hex values and repeated magic numbers.
- Do not use color alone to communicate status.
- Maintain visible focus indicators and sufficient contrast in both Light and Dark modes.
- Avoid unnecessary animation and respect reduced-motion preferences.
- Ensure tables, dialogs, menus, and forms remain usable on small screens.

## Mandatory Light & Dark Mode Standard

Whenever building or modifying any UI in ScholoNix (pages, headers, sidebars, forms, tables, modals, charts, SVGs, loading skeletons, and fallback views), **both Light and Dark modes are mandatory** (see `.agents/skills/light-dark-theme/SKILL.md`):

- **Use Semantic Tokens First**: Prefer `src/app/globals.css` CSS variables (`var(--bg-main)`, `var(--bg-card)`, `var(--bg-secondary)`, `var(--text-heading)`, `var(--text-body)`, `var(--text-muted)`, `var(--border-default)`, `var(--border-input)`) or explicitly paired Tailwind `dark:` variants (`bg-white dark:bg-[#141731]`, `text-[#08093B] dark:text-[#F3F5FF]`, `border-[#D6DBF0] dark:border-[#272B4D]`).
- **Include Theme Toggle on Navigation Surfaces**: Any new standalone shell, marketing header, or auth layout must mount `<ThemeToggle />` from `@/components/theme/theme-toggle`.
- **Contrast & Native UI**: Keep WCAG 2.2 AA contrast (`>= 4.5:1` normal text, `>= 3:1` borders/icons) in both themes; keep `color-scheme` and `.dark` synchronized on `<html>` via `ThemeProvider` + `src/app/layout.tsx` anti-FOUC script.
- **No WebKit Scrollbar Flicker**: Never animate `scrollbar-color`. Keep scrollbar tokens distinct in light and dark modes.
