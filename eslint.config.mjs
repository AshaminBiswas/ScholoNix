import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "prisma/migrations/**",
      "next-env.d.ts",
      "scripts/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/providers/**/*.{ts,tsx}",
      "src/stores/**/*.{ts,tsx}",
      "src/modules/*/components/**/*.{ts,tsx}",
      "src/modules/*/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server", "@/server/*", "@/lib/configuration/env"],
              message:
                "Client and presentation layers must not import server-only modules from @/server or server env configuration.",
            },
            {
              group: [
                "@/modules/*/repositories/*",
                "@/modules/*/services/*",
              ],
              message:
                "Presentation layers must not import module repositories or services directly; use Server Components, Server Actions, or API routes.",
            },
            {
              group: ["@prisma/client"],
              message:
                "Do not import Prisma client directly in UI or client-side modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/middleware.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@/server/database", "@/server/database/*"],
              message:
                "Next.js middleware runs on the Edge runtime by default and must not import database clients.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
