"use client";

import React, { useState } from "react";
import {
  Building2,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Globe,
  BadgeCheck,
} from "lucide-react";
import {
  SchoolWorkspaceShell,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "./school-workspace-shell";

export interface SchoolProfileDetails {
  id: string;
  name: string;
  slug: string;
  uniqueId: string | null;
  code: string;
  category: string;
  affiliationBoard: string;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  country: string;
  status: string;
  plan: string | null;
}

interface SchoolProfileViewProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  profile: SchoolProfileDetails;
}

export function SchoolProfileView({ school, user, profile }: SchoolProfileViewProps) {
  const [copiedKey, setCopiedKey] = useState<"uniqueId" | "loginUrl" | null>(null);

  const uniqueLoginPath = `/${profile.slug}/login`;

  const handleCopy = (key: "uniqueId" | "loginUrl", value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <SchoolWorkspaceShell school={school} user={user} activeNav="profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08093B] tracking-tight dark:text-[#F3F5FF]">
              School Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#9DA6CC]">
              Official institution identity, Unique School ID for support lookup, and authorized login URL.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{profile.status}</span>
          </span>
        </div>

        {/* Highlight Cards: Unique School ID & Unique Portal URL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-[20px] border border-[#DDD6FE] bg-gradient-to-br from-[#FAF8FE] via-white to-[#F3EEFF] p-5 shadow-xs dark:border-[#372E66] dark:from-[#1B1740] dark:via-[#141731] dark:to-[#171A38]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#663CF6] text-white shadow-sm">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#663CF6] dark:text-[#A78BFA]">
                    Unique School ID
                  </p>
                  <h2
                    data-testid="school-profile-unique-id"
                    className="text-lg sm:text-xl font-black tracking-wide text-[#08093B] font-mono dark:text-[#F3F5FF]"
                  >
                    {profile.uniqueId || "Pending Backfill"}
                  </h2>
                </div>
              </div>

              {profile.uniqueId && (
                <button
                  type="button"
                  onClick={() => handleCopy("uniqueId", profile.uniqueId!)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] shadow-2xs transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
                >
                  {copiedKey === "uniqueId" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedKey === "uniqueId" ? "Copied" : "Copy ID"}</span>
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
              Use this Unique School ID when contacting ScholoNix support. Company administrators can look up your school record directly using this ID.
            </p>
          </section>

          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#663CF6] dark:text-[#A78BFA]">
                    Unique Authorized Login URL
                  </p>
                  <p
                    data-testid="school-profile-login-url"
                    className="truncate text-sm font-bold text-[#08093B] font-mono dark:text-[#F3F5FF]"
                  >
                    {uniqueLoginPath}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  handleCopy("loginUrl", `${origin}${uniqueLoginPath}`);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#D6DBF0] bg-[#FAF8FE] px-3 py-1.5 text-xs font-bold text-[#08093B] transition hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
              >
                {copiedKey === "loginUrl" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === "loginUrl" ? "Copied" : "Copy URL"}</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
              Your portal URL uses an encoded opaque token so your school name is hidden from URLs. Only authorized members of{" "}
              <strong className="text-[#08093B] dark:text-[#F3F5FF]">{profile.name}</strong> can sign in on this link.
            </p>
          </section>
        </div>

        {/* Institutional Details Card */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center gap-2.5 border-b border-[#DFE3F5] pb-4 mb-5 dark:border-[#232746]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Institution Details
              </h2>
              <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
                Registered school metadata and primary contact details
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">School Name</dt>
              <dd className="mt-1 font-bold text-[#08093B] text-sm dark:text-[#F3F5FF]">{profile.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Institutional Code</dt>
              <dd className="mt-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">{profile.code || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Affiliation Board</dt>
              <dd className="mt-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">{profile.affiliationBoard}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Category</dt>
              <dd className="mt-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">{profile.category}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Plan</dt>
              <dd className="mt-1 font-bold capitalize text-[#08093B] dark:text-[#F3F5FF]">
                {profile.plan || "Starter"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Opaque Route Token</dt>
              <dd className="mt-1 font-mono font-bold text-[#663CF6] dark:text-[#A78BFA]">{profile.slug}</dd>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-[#663CF6] mt-0.5 shrink-0 dark:text-[#A78BFA]" />
              <div>
                <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Contact Phone</dt>
                <dd className="mt-0.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {profile.contactPhone || "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-[#663CF6] mt-0.5 shrink-0 dark:text-[#A78BFA]" />
              <div className="min-w-0">
                <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Contact Email</dt>
                <dd className="mt-0.5 font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {profile.contactEmail || "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-[#663CF6] mt-0.5 shrink-0 dark:text-[#A78BFA]" />
              <div className="min-w-0">
                <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Website</dt>
                <dd className="mt-0.5 font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                  {profile.website || "—"}
                </dd>
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
              <MapPin className="h-4 w-4 text-[#663CF6] mt-0.5 shrink-0 dark:text-[#A78BFA]" />
              <div>
                <dt className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">Campus Address</dt>
                <dd className="mt-0.5 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {[
                    profile.addressLine,
                    profile.city,
                    profile.state,
                    profile.pinCode,
                    profile.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
    </SchoolWorkspaceShell>
  );
}
