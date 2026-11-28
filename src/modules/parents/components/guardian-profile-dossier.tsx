"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Languages,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Unlink,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";
import type {
  GuardianCommunicationPrefs,
  GuardianCommunicationRecord,
  GuardianRecord,
  GuardianStudentCandidate,
  LinkedWardSummary,
} from "@/modules/parents/types";
import {
  AddEditGuardianModal,
  LinkWardModal,
  SendGuardianCommModal,
} from "./parent-modals";

type ProfileSubTab = "wards" | "contact" | "portal" | "communications";

const PREF_ITEMS: Array<{ key: keyof GuardianCommunicationPrefs; label: string; desc: string }> = [
  { key: "sms", label: "SMS Notifications", desc: "Urgent alerts and attendance SMS" },
  { key: "email", label: "Email Notices", desc: "Circulars, reports, and fee receipts" },
  { key: "whatsapp", label: "WhatsApp Updates", desc: "Instant school broadcast updates" },
  { key: "inApp", label: "In-App Alerts", desc: "Parent Portal notifications" },
  { key: "feeReminders", label: "Fee Reminders", desc: "Installment & due date reminders" },
  { key: "attendanceAlerts", label: "Attendance Alerts", desc: "Absence & late arrival alerts" },
  { key: "academicUpdates", label: "Academic Updates", desc: "Exam schedules & report cards" },
  { key: "mediaConsent", label: "Media & Event Consent", desc: "Consent for school activity photos" },
];

export function GuardianProfileDossier({
  schoolSlug,
  guardian,
  communications,
  availableStudents,
  permissions,
  onBack,
  onUpdateGuardian,
  onLinkWard,
  onUnlinkWard,
  onPortalAction,
  onSendMessage,
}: {
  schoolSlug: string;
  guardian: GuardianRecord;
  communications: GuardianCommunicationRecord[];
  availableStudents: GuardianStudentCandidate[];
  permissions: {
    canWrite: boolean;
    canLink: boolean;
    canPortal: boolean;
    canCommunicate: boolean;
  };
  onBack: () => void;
  onUpdateGuardian: (guardianId: string, payload: Record<string, unknown>) => Promise<void>;
  onLinkWard: (guardianId: string, payload: Record<string, unknown>) => Promise<void>;
  onUnlinkWard: (guardianId: string, studentId: string) => Promise<void>;
  onPortalAction: (guardianId: string, action: "INVITE" | "ACTIVATE" | "SUSPEND") => Promise<void>;
  onSendMessage: (payload: {
    guardianIds: string[];
    studentId?: string | null;
    channel: "SMS" | "EMAIL" | "WHATSAPP" | "APP" | "CALL";
    subject?: string;
    body: string;
  }) => Promise<void>;
}) {
  const [subTab, setSubTab] = useState<ProfileSubTab>("wards");
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<LinkedWardSummary | null>(null);
  const [commOpen, setCommOpen] = useState(false);

  const activeWards = guardian.wards.filter((w) => w.isActive);
  const initials = guardian.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const portalBadgeClass =
    guardian.portalStatus === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
      : guardian.portalStatus === "INVITED"
        ? "bg-violet-50 text-[#663CF6] border-violet-200 dark:bg-[#251D4A] dark:text-[#CBB8FF] dark:border-[#3D2E78]"
        : guardian.portalStatus === "SUSPENDED"
          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60"
          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#1B1F3F] dark:text-[#9DA6CC] dark:border-[#2E345B]";

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
              aria-label="Back to guardian directory"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#5B35F5] text-lg font-black text-white shadow-md">
              {initials || "PG"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {guardian.fullName}
                </h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${portalBadgeClass}`}>
                  Portal: {guardian.portalStatus.replace("_", " ")}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                    guardian.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {guardian.status}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Phone className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                  {guardian.phone}
                </span>
                {guardian.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                    {guardian.email}
                  </span>
                )}
                {guardian.occupation && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" />
                    {guardian.occupation}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canCommunicate && (
              <button
                type="button"
                onClick={() => setCommOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#1B1D45] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#E2E8FF]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Send Message</span>
              </button>
            )}
            {permissions.canLink && (
              <button
                type="button"
                onClick={() => {
                  setEditingWard(null);
                  setLinkOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer dark:border-[#313761] dark:bg-[#10142C] dark:text-[#C4B5FD]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Link Ward</span>
              </button>
            )}
            {permissions.canWrite && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab bar */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#DFE3F5] pt-4 dark:border-[#232746]">
          {(
            [
              { id: "wards", label: `Linked Wards (${activeWards.length})`, icon: Users },
              { id: "contact", label: "Contact, Address & KYC", icon: MapPin },
              { id: "portal", label: "Portal Access & Consents", icon: ShieldCheck },
              { id: "communications", label: `Communications (${communications.length})`, icon: MessageSquare },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  active
                    ? "bg-[#663CF6] text-white shadow-sm"
                    : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#2E345B] dark:bg-[#10142C] dark:text-[#B4BDD9]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Contents */}
      {subTab === "wards" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Linked Students / Siblings ({activeWards.length})
            </h2>
            {activeWards.length >= 2 && (
              <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                Multi-Child Household
              </span>
            )}
          </div>

          {activeWards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CAD0EB] p-8 text-center text-xs text-[#76799C] dark:border-[#313761] dark:text-[#9DA6CC]">
              No active student wards linked to this guardian yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeWards.map((ward) => (
                <div
                  key={ward.linkId}
                  className="rounded-2xl border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${encodeURIComponent(schoolSlug)}/students/profile/${encodeURIComponent(ward.studentId)}`}
                          className="inline-flex items-center gap-1 text-sm font-black text-[#08093B] hover:text-[#663CF6] dark:text-[#F3F5FF] dark:hover:text-[#C4B5FD]"
                        >
                          <span>{ward.studentName}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        {ward.isPrimary && (
                          <span className="rounded-full bg-[#663CF6] px-2 py-0.5 text-[10px] font-bold text-white">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                        {ward.admissionNumber} · {ward.currentGrade} - {ward.currentSection} ({ward.relation})
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {permissions.canLink && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWard(ward);
                              setLinkOpen(true);
                            }}
                            className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:text-[#663CF6] dark:border-[#313761] dark:bg-[#141731] dark:text-[#B4BDD9]"
                            title="Edit relationship permissions"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUnlinkWard(guardian.id, ward.studentId)}
                            className="rounded-lg border border-[#D6DBF0] bg-white p-1.5 text-rose-600 hover:bg-rose-50 dark:border-[#313761] dark:bg-[#141731] dark:text-rose-400"
                            title="Unlink ward"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    {ward.restrictedContact ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        <ShieldAlert className="h-3 w-3" /> Restricted Custody / No Pickup
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-0.5 ${
                          ward.canPickup
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-[#1B1F3F] dark:text-[#9DA6CC]"
                        }`}
                      >
                        {ward.canPickup ? "Pickup Authorized" : "No Pickup"}
                      </span>
                    )}
                    {ward.isEmergencyContact && (
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                        Emergency Contact
                      </span>
                    )}
                    {ward.isFeePayer && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        Fee Payer
                      </span>
                    )}
                  </div>

                  {ward.custodyNote && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                      Custody Note: {ward.custodyNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Identity & Occupation
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Primary Phone</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{guardian.phone}</dd>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Alternate Phone</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {guardian.alternatePhone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Email</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {guardian.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Preferred Language</dt>
                <dd className="inline-flex items-center gap-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  <Languages className="h-3.5 w-3.5 text-[#663CF6]" />
                  {guardian.preferredLanguage}
                </dd>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Occupation / Employer</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {[guardian.occupation, guardian.employer].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Education</dt>
                <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  {guardian.education || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Address & KYC Verification
            </h2>
            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Residential Address</dt>
                <dd className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                  {[
                    guardian.address?.addressLine1,
                    guardian.address?.city,
                    guardian.address?.state,
                    guardian.address?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[#76799C] dark:text-[#9DA6CC]">ID Proof</dt>
                  <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {guardian.idProofType || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#76799C] dark:text-[#9DA6CC]">Masked Reference</dt>
                  <dd className="font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {guardian.idProofMasked || "—"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">Internal Notes</dt>
                <dd className="text-[#4D5072] dark:text-[#B4BDD9]">{guardian.notes || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {subTab === "portal" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DFE3F5] bg-[#FAF8FE] p-4 dark:border-[#272B4D] dark:bg-[#10142C]">
            <div>
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Parent Portal Account Status: {guardian.portalStatus.replace("_", " ")}
              </p>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                {guardian.userId
                  ? `Linked User ID: ${guardian.userId}`
                  : "No portal account provisioned yet."}
              </p>
            </div>
            {permissions.canPortal && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onPortalAction(guardian.id, "INVITE")}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#663CF6] hover:bg-[#FAF8FE] cursor-pointer dark:border-[#313761] dark:bg-[#141731] dark:text-[#C4B5FD]"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Send Portal Invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPortalAction(guardian.id, "ACTIVATE")}
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Activate Access</span>
                </button>
                {guardian.portalStatus !== "SUSPENDED" && (
                  <button
                    type="button"
                    onClick={() => onPortalAction(guardian.id, "SUSPEND")}
                    className="inline-flex items-center gap-1.5 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300"
                  >
                    <span>Suspend</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF] mb-3">
              Communication & Consent Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PREF_ITEMS.map((item) => {
                const enabled = Boolean(guardian.communicationPrefs[item.key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!permissions.canWrite}
                    onClick={() =>
                      onUpdateGuardian(guardian.id, {
                        communicationPrefs: { [item.key]: !enabled },
                      })
                    }
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      enabled
                        ? "border-[#663CF6]/40 bg-[#FAF8FE] dark:border-[#8B5CF6]/50 dark:bg-[#1C1A3D]"
                        : "border-[#DFE3F5] bg-white opacity-80 dark:border-[#272B4D] dark:bg-[#10142C]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                        {item.label}
                      </span>
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          enabled ? "text-[#663CF6] dark:text-[#C4B5FD]" : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {subTab === "communications" && (
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Guardian Communication Log
            </h2>
            {permissions.canCommunicate && (
              <button
                type="button"
                onClick={() => setCommOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>New Message</span>
              </button>
            )}
          </div>
          {communications.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
              No messages logged for this guardian yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {communications.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-[#DFE3F5] bg-[#FAF8FE]/60 p-3 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      [{c.channel}] {c.subject || "School Communication"}
                    </span>
                    <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      {new Date(c.createdAt).toLocaleString()} · {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[#4D5072] dark:text-[#B4BDD9]">{c.body}</p>
                  <p className="mt-1 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                    Sent by {c.senderName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <AddEditGuardianModal
          open={editOpen}
          mode="edit"
          guardian={guardian}
          students={availableStudents}
          onClose={() => setEditOpen(false)}
          onSave={(payload) => onUpdateGuardian(guardian.id, payload)}
        />
      )}

      {linkOpen && (
        <LinkWardModal
          open={linkOpen}
          guardian={guardian}
          students={availableStudents}
          editingWard={editingWard}
          onClose={() => {
            setLinkOpen(false);
            setEditingWard(null);
          }}
          onSave={(payload) => onLinkWard(guardian.id, payload)}
        />
      )}

      {commOpen && (
        <SendGuardianCommModal
          open={commOpen}
          guardians={[guardian]}
          onClose={() => setCommOpen(false)}
          onSend={onSendMessage}
        />
      )}
    </div>
  );
}
