"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-config";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FCFDFE] p-6 text-center font-sans text-[#1B1D45] dark:bg-[#090B1A] dark:text-[#DCE1F9]">
        <h1 className="text-xl font-semibold text-[#08093B] dark:text-[#F3F5FF]">Something went wrong</h1>
        <p className="max-w-md text-sm text-[#4D5072] dark:text-[#9DA6CC]">
          An unexpected application error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#663CF6] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F27E8] cursor-pointer"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
