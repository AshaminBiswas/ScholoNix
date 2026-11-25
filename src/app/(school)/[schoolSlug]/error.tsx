"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { buildSchoolRoute } from "@/modules/school/utils/shell-props";

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
    <main className="min-h-screen bg-[#F4F6FC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-[22px] border border-[#D6DBF0] bg-white p-7 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-extrabold text-[#08093B]">Workspace Temporarily Unavailable</h1>
        <p className="text-xs text-[#4D5072] leading-relaxed">
          We encountered a temporary issue loading this school view. Please retry or return to your
          school dashboard.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-[#76799C]">Reference ID: {error.digest}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] cursor-pointer"
          >
            Try Again
          </button>
          {slug && (
            <Link
              href={buildSchoolRoute(slug)}
              className="rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6]"
            >
              School Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
