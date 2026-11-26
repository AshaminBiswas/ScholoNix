"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { buildSchoolRoute } from "@/modules/school/utils/shell-props";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface SchoolErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SchoolWorkspaceError({ error, reset }: SchoolErrorProps) {
  const params = useParams<{ schoolSlug?: string }>();
  const slug = typeof params?.schoolSlug === "string" ? params.schoolSlug : "";

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="relative min-h-screen bg-[#F4F6FC] flex items-center justify-center p-6 font-sans dark:bg-[#090B1A]">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-[22px] border border-[#D6DBF0] bg-white p-7 text-center shadow-sm space-y-4 dark:border-[#272B4D] dark:bg-[#141731] dark:shadow-black/50">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Workspace Temporarily Unavailable</h1>
        <p className="text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
          We encountered a temporary issue loading this school view. Please retry or return to your
          school dashboard.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-[#76799C] dark:text-[#8E97C0]">Reference ID: {error.digest}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer dark:bg-[#7C5CFF] dark:hover:bg-[#663CF6]"
          >
            Try Again
          </button>
          {slug && (
            <Link
              href={buildSchoolRoute(slug)}
              className="rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
            >
              School Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
