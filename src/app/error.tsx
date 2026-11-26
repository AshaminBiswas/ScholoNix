"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Unhandled application error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-main)] p-6 text-center text-[var(--text-body)]">
      <h1 className="text-xl font-semibold text-[var(--text-heading)]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        An unexpected error occurred while loading this page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer"
      >
        Try again
      </button>
    </main>
  );
}
