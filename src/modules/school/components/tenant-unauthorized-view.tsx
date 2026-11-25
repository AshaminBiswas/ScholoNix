"use client";

import React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface TenantUnauthorizedViewProps {
  ownSchoolSlug: string;
  ownSchoolName: string;
}

export function TenantUnauthorizedView({
  ownSchoolSlug,
  ownSchoolName,
}: TenantUnauthorizedViewProps) {
  const ownWorkspaceHref = `/${ownSchoolSlug}` as Route;

  return (
    <div className="min-h-screen bg-[#F4F6FC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-[24px] border border-[#D6DBF0] bg-white p-7 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-[#08093B]">
          Access Restricted
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4D5072]">
          You are only authorized to access your own school workspace (
          <strong className="text-[#08093B]">{ownSchoolName}</strong>).
        </p>
        <Link
          href={ownWorkspaceHref}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition hover:opacity-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go to {ownSchoolName}</span>
        </Link>
      </div>
    </div>
  );
}
