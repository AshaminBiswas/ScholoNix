"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { buildSchoolRoute } from "@/modules/school/utils/shell-props";

interface TenantServiceUnavailableViewProps {
  schoolSlug?: string;
  message?: string;
}

/**
 * Clean fallback UI rendered directly by Server Components when session or tenant lookup
 * encounters a temporary database interruption, avoiding uncaught RSC crashes.
 */
export function TenantServiceUnavailableView({
  schoolSlug,
  message = "We encountered a temporary connection issue loading your school workspace. Please retry in a moment.",
}: TenantServiceUnavailableViewProps) {
  const router = useRouter();
  const dashboardHref = schoolSlug ? buildSchoolRoute(schoolSlug) : null;

  return (
    <main className="min-h-screen bg-[#F4F6FC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-[22px] border border-[#D6DBF0] bg-white p-7 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-extrabold text-[#08093B]">Workspace Temporarily Unavailable</h1>
        <p className="text-xs text-[#4D5072] leading-relaxed">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </button>
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              className="rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6]"
            >
              School Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-[12px] border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
