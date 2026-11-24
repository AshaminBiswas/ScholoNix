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
6. Verify light/dark themes if both are supported.

## Rules
- Prefer semantic design tokens over arbitrary hex values and repeated magic numbers.
- Do not use color alone to communicate status.
- Maintain visible focus indicators and sufficient contrast.
- Avoid unnecessary animation and respect reduced-motion preferences.
- Ensure tables, dialogs, menus, and forms remain usable on small screens.
