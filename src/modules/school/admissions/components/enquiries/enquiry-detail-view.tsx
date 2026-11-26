"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionEnquiryRecord,
  AdmissionEnquiryStatusType,
  EnquiryCommunicationChannelValue,
  EnquiryDossierData,
  EnquiryFollowUpStatusValue,
  EnquiryFollowUpTypeValue,
  EnquiryNoteCategoryValue,
} from "@/modules/school/admissions/types";
import {
  COMMUNICATION_CHANNEL_OPTIONS,
  COMMUNICATION_TEMPLATES,
  ENQUIRY_STATUS_UI_META,
  EnquiriesDonutChart,
  FOLLOW_UP_STATUS_META,
  FOLLOW_UP_TIME_SLOTS,
  FOLLOW_UP_TYPE_OPTIONS,
  PortalActionMenu,
  formatDateTimeIst,
  formatShortDate,
  type DonutSlice,
} from "./enquiry-shared";

export type EnquiryDetailSubTab =
  | "details"
  | "followups"
  | "communications"
  | "notes"
  | "activity";

interface EnquiryDetailViewProps {
  schoolSlug: string;
  dossier: EnquiryDossierData | null;
  loading: boolean;
  canWrite: boolean;
  onBack: () => void;
  onEditEnquiry: (enquiry: AdmissionEnquiryRecord) => void;
  onConvertEnquiry: (enquiry: AdmissionEnquiryRecord) => Promise<void>;
  onUpdateEnquiryStatus: (
    enquiryId: string,
    status: AdmissionEnquiryStatusType,
  ) => Promise<void>;
  onCreateFollowUp: (
    enquiryId: string,
    payload: {
      followUpType: EnquiryFollowUpTypeValue;
      scheduledAt: string;
      assignedToUserId?: string | null;
      assignedToName?: string | null;
      notes: string;
    },
  ) => Promise<void>;
  onUpdateFollowUp: (
    enquiryId: string,
    followUpId: string,
    status: EnquiryFollowUpStatusValue,
  ) => Promise<void>;
  onSendCommunication: (
    enquiryId: string,
    formData: FormData,
  ) => Promise<void>;
  onCreateNote: (
    enquiryId: string,
    payload: {
      category: EnquiryNoteCategoryValue;
      title: string;
      content: string;
    },
  ) => Promise<void>;
  onUpdateNote: (
    enquiryId: string,
    payload: {
      noteId: string;
      category?: EnquiryNoteCategoryValue;
      title?: string;
      content?: string;
    },
  ) => Promise<void>;
  onDeleteNote: (enquiryId: string, noteId: string) => Promise<void>;
}

export function EnquiryDetailView({
  schoolSlug,
  dossier,
  loading,
  canWrite,
  onBack,
  onEditEnquiry,
  onConvertEnquiry,
  onUpdateEnquiryStatus,
  onCreateFollowUp,
  onUpdateFollowUp,
  onSendCommunication,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: EnquiryDetailViewProps) {
  const [subTab, setSubTab] = useState<EnquiryDetailSubTab>("details");
  const [copied, setCopied] = useState(false);

  // Follow-ups form state
  const [fuType, setFuType] = useState<EnquiryFollowUpTypeValue>("Meeting");
  const [fuDate, setFuDate] = useState("");
  const [fuTime, setFuTime] = useState("10:30");
  const [fuStaffId, setFuStaffId] = useState("");
  const [fuNotes, setFuNotes] = useState("");
  const [fuSearch, setFuSearch] = useState("");
  const [fuBusy, setFuBusy] = useState(false);

  // Communications form state
  const [commChannel, setCommChannel] = useState<EnquiryCommunicationChannelValue>("Email");
  const [commTo, setCommTo] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [commCc, setCommCc] = useState("");
  const [commBcc, setCommBcc] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commMessage, setCommMessage] = useState("");
  const [commFiles, setCommFiles] = useState<File[]>([]);
  const [commSearch, setCommSearch] = useState("");
  const [commBusy, setCommBusy] = useState(false);
  const [commFeedback, setCommFeedback] = useState<string | null>(null);

  // Notes form & edit state
  const [noteCategory, setNoteCategory] =
    useState<EnquiryNoteCategoryValue>("Admission Related");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  // Activity filter state
  const [actFilter, setActFilter] = useState("all");
  const [actSearch, setActSearch] = useState("");

  const enquiry = dossier?.enquiry ?? null;

  const fuStats = useMemo(() => {
    const list = dossier?.followUps ?? [];
    return {
      total: list.length,
      upcoming: list.filter((f) => f.status === "UPCOMING").length,
      dueToday: list.filter((f) => f.status === "DUE_TODAY").length,
      completed: list.filter((f) => f.status === "COMPLETED").length,
      overdue: list.filter((f) => f.status === "OVERDUE").length,
    };
  }, [dossier?.followUps]);

  const commStats = useMemo(() => {
    const list = dossier?.communications ?? [];
    return {
      total: list.length,
      emails: list.filter((c) => c.channel === "Email").length,
      sms: list.filter((c) => c.channel === "SMS").length,
      whatsapp: list.filter((c) => c.channel === "WhatsApp").length,
      calls: list.filter((c) => c.channel === "Phone Call").length,
    };
  }, [dossier?.communications]);

  const noteSlices = useMemo<DonutSlice[]>(() => {
    const list = dossier?.notes ?? [];
    const t = list.length;
    if (t === 0) return [];
    const defs: Array<{ cat: EnquiryNoteCategoryValue; color: string }> = [
      { cat: "Admission Related", color: "#7C3AED" },
      { cat: "Parent Requirement", color: "#0EA5E9" },
      { cat: "Follow-up", color: "#22C55E" },
      { cat: "Other", color: "#F59E0B" },
    ];
    return defs.map((d) => {
      const count = list.filter((n) => n.category === d.cat).length;
      return {
        label: d.cat,
        count,
        percentage: (count / t) * 100,
        color: d.color,
      };
    });
  }, [dossier?.notes]);

  const actStats = useMemo(() => {
    const list = dossier?.activities ?? [];
    const updates = list.filter((a) => a.action.includes("UPDATED")).length;
    const followUpActs = list.filter((a) => a.action.includes("FOLLOW_UP")).length;
    const commActs = list.filter((a) => a.action.includes("COMMUNICATION")).length;
    const other = Math.max(0, list.length - updates - followUpActs - commActs);
    return { total: list.length, updates, followUpActs, commActs, other };
  }, [dossier?.activities]);

  if (loading || !enquiry || !dossier) {
    return (
      <div className="rounded-[20px] border border-[#D6DBF0] bg-white p-10 text-center dark:border-[#272B4D] dark:bg-[#141731]">
        <p className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
          Loading enquiry dossier...
        </p>
      </div>
    );
  }

  const statusMeta = ENQUIRY_STATUS_UI_META[enquiry.status];
  const resolvedRecipient =
    commTo.trim() ||
    (commChannel === "Email" ? enquiry.guardianEmail || "" : enquiry.guardianPhone);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(enquiry.enquiryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures in restricted environments
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Enquiry Details
          </h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            View complete details, follow-ups, communications, and activity for this enquiry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#1B1D45] hover:bg-[#F5F7FD] dark:border-[#313761] dark:bg-[#171B36] dark:text-[#DCE1F9]"
          >
            &larr; Back to Enquiry List
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => onEditEnquiry(enquiry)}
              className="rounded-xl border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#6D28D9] hover:bg-[#F0EBFE] dark:border-[#313761] dark:bg-[#171B36] dark:text-violet-300"
            >
              Edit Enquiry
            </button>
          )}
          <PortalActionMenu
            ariaLabel={`Quick actions for ${enquiry.enquiryCode}`}
            items={[
              ...(canWrite
                ? [
                    {
                      label: "Convert to Application",
                      disabled:
                        enquiry.isDraft ||
                        enquiry.status === "CONVERTED" ||
                        Boolean(enquiry.convertedApplicationId),
                      onClick: () => void onConvertEnquiry(enquiry),
                    },
                    {
                      label: "Mark Follow-up Due",
                      disabled: enquiry.status === "CONVERTED",
                      onClick: () => void onUpdateEnquiryStatus(enquiry.id, "FOLLOW_UP"),
                    },
                    {
                      label: "Mark Closed",
                      disabled: enquiry.status === "CLOSED",
                      danger: true,
                      onClick: () => void onUpdateEnquiryStatus(enquiry.id, "CLOSED"),
                    },
                  ]
                : [{ label: "Edit Enquiry", disabled: true, onClick: () => {} }]),
            ]}
          />
        </div>
      </div>

      {/* Header Summary Card */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-[#DFE3F5] dark:border-[#232746]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
              {enquiry.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                Enquiry ID
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {enquiry.enquiryCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#6D28D9] hover:bg-[#F0EBFE] dark:text-violet-300 dark:hover:bg-[#252A4E]"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              Enquiry Date
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {formatShortDate(enquiry.enquiryDate || enquiry.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              Academic Year
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {enquiry.academicYear}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
              Grade Interested
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {enquiry.gradeApplied}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC] mb-1">
              Status
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC] mb-1">
              Source
            </p>
            <span className="inline-flex items-center rounded-full border border-[#D6DBF0] bg-[#F5F7FD] px-2.5 py-0.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1E2246] dark:text-[#DCE1F9]">
              {enquiry.source}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC] mb-1">
              Enquiry Type
            </p>
            <span className="inline-flex items-center rounded-full border border-[#D6DBF0] bg-[#F5F7FD] px-2.5 py-0.5 text-xs font-semibold text-[#1B1D45] dark:border-[#313761] dark:bg-[#1E2246] dark:text-[#DCE1F9]">
              {enquiry.enquiryType || "General"}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC] mb-1">
              Assigned To
            </p>
            <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
              {enquiry.assignedToName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-xl border border-[#DFD8FA] bg-[#F7F3FF] px-3 py-2 dark:border-[#2F295C] dark:bg-[#1B173D]">
            <p className="text-[10px] font-semibold text-[#5B4B9A] dark:text-violet-300">
              Next Follow-up
            </p>
            <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {enquiry.nextFollowUpAt ? formatDateTimeIst(enquiry.nextFollowUpAt) : "Not scheduled"}
            </p>
          </div>
        </div>
      </section>

      {/* Internal 5 Sub-Tabs */}
      <div className="flex flex-wrap gap-2 rounded-[16px] border border-[#D6DBF0] bg-white p-1.5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        {[
          { id: "details" as const, label: "Details" },
          { id: "followups" as const, label: `Follow-ups (${dossier.followUps.length})` },
          {
            id: "communications" as const,
            label: `Communications (${dossier.communications.length})`,
          },
          { id: "notes" as const, label: `Notes (${dossier.notes.length})` },
          { id: "activity" as const, label: "Activity Log" },
        ].map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-xs"
                  : "text-[#4D5072] hover:bg-[#F5F7FD] dark:text-[#9DA6CC] dark:hover:bg-[#1E2246]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DETAILS */}
      {subTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
                Student Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Student Name</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.studentName}
                  </p>
                </div>
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Date of Birth</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.studentDob ? formatShortDate(enquiry.studentDob) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Gender</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.studentGender || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Grade Interested</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.gradeApplied}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-3">
                Parent / Enquirer &amp; Address Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Guardian Name</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.guardianName} ({enquiry.guardianRelation || "Parent"})
                  </p>
                </div>
                <div>
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Contact</p>
                  <p className="font-bold text-[#08093B] dark:text-[#F3F5FF] mt-0.5">
                    {enquiry.guardianPhone}
                    {enquiry.guardianEmail ? ` · ${enquiry.guardianEmail}` : ""}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[#76799C] dark:text-[#9DA6CC]">Address</p>
                  <p className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9] mt-0.5">
                    {[
                      enquiry.addressLine1,
                      enquiry.addressLine2,
                      enquiry.city,
                      enquiry.state,
                      enquiry.pinCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Enquiry Details &amp; Requirements
              </h4>
              <p className="text-xs text-[#1B1D45] dark:text-[#DCE1F9] whitespace-pre-wrap">
                {enquiry.notes || "No remarks added yet."}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {enquiry.hasSiblingsInSchool && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    Siblings in School
                  </span>
                )}
                {enquiry.interestedInTransport && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    Interested in Transport
                  </span>
                )}
                {enquiry.interestedInHostel && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    Interested in Hostel
                  </span>
                )}
                {enquiry.requiresSpecialSupport && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Requires Special Support
                  </span>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
                Quick Actions
              </h4>
              <button
                type="button"
                onClick={() => setSubTab("followups")}
                className="w-full rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold text-[#08093B] hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D] dark:text-[#F3F5FF]"
              >
                Schedule Follow-up &rarr;
              </button>
              <button
                type="button"
                onClick={() => setSubTab("communications")}
                className="w-full rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3.5 py-2.5 text-left text-xs font-bold text-[#08093B] hover:border-[#9B76FF] dark:border-[#272B4D] dark:bg-[#191D3D] dark:text-[#F3F5FF]"
              >
                Send Communication &rarr;
              </button>
              {canWrite && (
                <button
                  type="button"
                  disabled={
                    enquiry.isDraft ||
                    enquiry.status === "CONVERTED" ||
                    Boolean(enquiry.convertedApplicationId)
                  }
                  onClick={() => void onConvertEnquiry(enquiry)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {enquiry.convertedApplicationId
                    ? "Converted to Application"
                    : "Convert to Application"}
                </button>
              )}
            </section>

            <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Recent Activity
                </h4>
                <button
                  type="button"
                  onClick={() => setSubTab("activity")}
                  className="text-xs font-semibold text-[#6D28D9] hover:underline dark:text-violet-300"
                >
                  View All
                </button>
              </div>
              {dossier.activities.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="border-l-2 border-[#7C3AED] pl-3 text-xs space-y-0.5"
                >
                  <p className="font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                    {act.summary}
                  </p>
                  <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                    {act.actorName} · {formatDateTimeIst(act.createdAt)}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: FOLLOW-UPS */}
      {subTab === "followups" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Follow-ups", val: fuStats.total },
              { label: "Upcoming", val: fuStats.upcoming },
              { label: "Due Today", val: fuStats.dueToday },
              { label: "Completed", val: fuStats.completed },
              { label: "Overdue", val: fuStats.overdue },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]"
              >
                <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                  {k.val}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  {k.label}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Follow-up History
              </h4>
              <input
                type="search"
                value={fuSearch}
                onChange={(e) => setFuSearch(e.target.value)}
                placeholder="Search follow-ups by type, note or staff..."
                className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2">#</th>
                    <th className="py-2 px-3">Follow-up Type</th>
                    <th className="py-2 px-3">Follow-up Date &amp; Time</th>
                    <th className="py-2 px-3">Assigned To</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Notes / Discussion</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {dossier.followUps
                    .filter((f) =>
                      fuSearch.trim()
                        ? `${f.followUpType} ${f.notes} ${f.assignedToName || ""}`
                            .toLowerCase()
                            .includes(fuSearch.trim().toLowerCase())
                        : true,
                    )
                    .map((fu, idx) => {
                      const m = FOLLOW_UP_STATUS_META[fu.status];
                      return (
                        <tr key={fu.id}>
                          <td className="py-3 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3 font-semibold">{fu.followUpType}</td>
                          <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                            {formatDateTimeIst(fu.scheduledAt)}
                          </td>
                          <td className="py-3 px-3">{fu.assignedToName || "Unassigned"}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${m.badgeClass}`}
                            >
                              {m.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs truncate">{fu.notes}</td>
                          <td className="py-3 text-right">
                            <PortalActionMenu
                              ariaLabel={`Actions for follow-up ${idx + 1}`}
                              items={
                                canWrite
                                  ? [
                                      {
                                        label: "Mark Completed",
                                        disabled: fu.status === "COMPLETED",
                                        onClick: () =>
                                          void onUpdateFollowUp(
                                            enquiry.id,
                                            fu.id,
                                            "COMPLETED",
                                          ),
                                      },
                                      {
                                        label: "Cancel Follow-up",
                                        disabled: fu.status === "CANCELLED",
                                        danger: true,
                                        onClick: () =>
                                          void onUpdateFollowUp(
                                            enquiry.id,
                                            fu.id,
                                            "CANCELLED",
                                          ),
                                      },
                                    ]
                                  : [{ label: "Read-only", disabled: true, onClick: () => {} }]
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Schedule New Follow-up
              </h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!fuDate || !fuNotes.trim()) return;
                  const staff = dossier.staffOptions.find((s) => s.id === fuStaffId);
                  setFuBusy(true);
                  try {
                    await onCreateFollowUp(enquiry.id, {
                      followUpType: fuType,
                      scheduledAt: new Date(`${fuDate}T${fuTime}:00+05:30`).toISOString(),
                      assignedToUserId: staff?.id || null,
                      assignedToName: staff?.name || null,
                      notes: fuNotes.trim(),
                    });
                    setFuDate("");
                    setFuNotes("");
                  } finally {
                    setFuBusy(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Follow-up Type *</label>
                    <select
                      value={fuType}
                      onChange={(e) => setFuType(e.target.value as EnquiryFollowUpTypeValue)}
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    >
                      {FOLLOW_UP_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Assign To</label>
                    <select
                      value={fuStaffId}
                      onChange={(e) => setFuStaffId(e.target.value)}
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    >
                      <option value="">Assign to me</option>
                      {dossier.staffOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Follow-up Date *</label>
                    <input
                      type="date"
                      value={fuDate}
                      onChange={(e) => setFuDate(e.target.value)}
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Follow-up Time *</label>
                    <select
                      value={fuTime}
                      onChange={(e) => setFuTime(e.target.value)}
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    >
                      {FOLLOW_UP_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Notes / Discussion *</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={fuNotes}
                    onChange={(e) => setFuNotes(e.target.value)}
                    placeholder="Enter follow-up notes, discussion points, or next steps..."
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={!canWrite || fuBusy || !fuDate || !fuNotes.trim()}
                    className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {fuBusy ? "Scheduling..." : "Schedule Follow-up"}
                  </button>
                </div>
              </form>
            </section>

            <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Follow-up Insights
              </h4>
              <EnquiriesDonutChart
                centerValue={fuStats.total}
                centerLabel="Follow-ups"
                slices={
                  fuStats.total === 0
                    ? []
                    : [
                        {
                          label: "Upcoming",
                          count: fuStats.upcoming,
                          percentage: (fuStats.upcoming / fuStats.total) * 100,
                          color: FOLLOW_UP_STATUS_META.UPCOMING.color,
                        },
                        {
                          label: "Completed",
                          count: fuStats.completed,
                          percentage: (fuStats.completed / fuStats.total) * 100,
                          color: FOLLOW_UP_STATUS_META.COMPLETED.color,
                        },
                        {
                          label: "Due Today",
                          count: fuStats.dueToday,
                          percentage: (fuStats.dueToday / fuStats.total) * 100,
                          color: FOLLOW_UP_STATUS_META.DUE_TODAY.color,
                        },
                        {
                          label: "Overdue",
                          count: fuStats.overdue,
                          percentage: (fuStats.overdue / fuStats.total) * 100,
                          color: FOLLOW_UP_STATUS_META.OVERDUE.color,
                        },
                      ]
                }
              />
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNICATIONS */}
      {subTab === "communications" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Communications", val: commStats.total },
              { label: "Emails", val: commStats.emails },
              { label: "SMS", val: commStats.sms },
              { label: "WhatsApp", val: commStats.whatsapp },
              { label: "Phone Calls", val: commStats.calls },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]"
              >
                <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                  {k.val}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  {k.label}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Communication History
              </h4>
              <input
                type="search"
                value={commSearch}
                onChange={(e) => setCommSearch(e.target.value)}
                placeholder="Search communications by subject, message or staff..."
                className="w-72 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2">#</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Subject / Summary</th>
                    <th className="py-2 px-3">Date &amp; Time</th>
                    <th className="py-2 px-3">Sent By</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 text-right">Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {dossier.communications
                    .filter((c) =>
                      commSearch.trim()
                        ? `${c.subject} ${c.message} ${c.sentByName}`
                            .toLowerCase()
                            .includes(commSearch.trim().toLowerCase())
                        : true,
                    )
                    .map((c, idx) => (
                      <tr key={c.id}>
                        <td className="py-3 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold">{c.channel}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            {c.subject}
                          </p>
                          <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC] line-clamp-1">
                            {c.message}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-[#4D5072] dark:text-[#9DA6CC]">
                          {formatDateTimeIst(c.sentAt)}
                        </td>
                        <td className="py-3 px-3">{c.sentByName}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {c.attachments.length === 0 ? (
                            <span className="text-[#76799C]">—</span>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {c.attachments.map((att) => (
                                <a
                                  key={att.key}
                                  href={`/api/school/admissions/enquiries/${encodeURIComponent(
                                    enquiry.id,
                                  )}/communications?storageKey=${encodeURIComponent(
                                    att.storageKey,
                                  )}&schoolSlug=${encodeURIComponent(schoolSlug)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-[#6D28D9] hover:underline dark:text-violet-300"
                                >
                                  {att.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Send Communication
              </h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCommFeedback(null);
                  if (!resolvedRecipient || !commSubject.trim() || !commMessage.trim()) return;
                  const fd = new FormData();
                  fd.append("channel", commChannel);
                  fd.append("recipient", resolvedRecipient);
                  if (commCc.trim()) fd.append("cc", commCc.trim());
                  if (commBcc.trim()) fd.append("bcc", commBcc.trim());
                  fd.append("subject", commSubject.trim());
                  fd.append("message", commMessage.trim());
                  commFiles.forEach((f) => fd.append("files", f));
                  setCommBusy(true);
                  try {
                    await onSendCommunication(enquiry.id, fd);
                    setCommSubject("");
                    setCommMessage("");
                    setCommFiles([]);
                    setCommFeedback("Communication logged and dispatched.");
                  } finally {
                    setCommBusy(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Communication Type *
                  </label>
                  <select
                    value={commChannel}
                    onChange={(e) =>
                      setCommChannel(e.target.value as EnquiryCommunicationChannelValue)
                    }
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  >
                    {COMMUNICATION_CHANNEL_OPTIONS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold">To *</label>
                    <button
                      type="button"
                      onClick={() => setShowCcBcc((v) => !v)}
                      className="text-[11px] font-bold text-[#6D28D9] dark:text-violet-300"
                    >
                      {showCcBcc ? "Hide CC / BCC" : "CC / BCC"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resolvedRecipient}
                    onChange={(e) => setCommTo(e.target.value)}
                    placeholder={
                      commChannel === "Email" ? "parent@example.com" : "+91-98XXXXXXXX"
                    }
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  />
                </div>

                {showCcBcc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      value={commCc}
                      onChange={(e) => setCommCc(e.target.value)}
                      placeholder="CC email (optional)"
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    />
                    <input
                      type="email"
                      value={commBcc}
                      onChange={(e) => setCommBcc(e.target.value)}
                      placeholder="BCC email (optional)"
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold mb-1">Subject *</label>
                  <input
                    type="text"
                    value={commSubject}
                    onChange={(e) => setCommSubject(e.target.value)}
                    placeholder={`Admission Information — ${enquiry.gradeApplied}`}
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Message *</label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={commMessage}
                    onChange={(e) => setCommMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  />
                  <div className="text-right text-[10px] text-[#76799C]">
                    {commMessage.length} / 2000
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Attach Files <span className="font-normal text-[#76799C]">(PDF, JPG, PNG — Max 5 MB)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setCommFiles(e.target.files ? Array.from(e.target.files) : [])
                    }
                    className="w-full rounded-xl border border-dashed border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#191D3D]"
                  />
                </div>

                {commFeedback && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {commFeedback}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={
                      !canWrite ||
                      commBusy ||
                      !resolvedRecipient ||
                      !commSubject.trim() ||
                      !commMessage.trim()
                    }
                    className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {commBusy ? "Sending..." : "Send Communication"}
                  </button>
                </div>
              </form>
            </section>

            <div className="lg:col-span-5 space-y-4">
              <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2.5 dark:border-[#272B4D] dark:bg-[#141731]">
                <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
                  Communication Templates
                </h4>
                {COMMUNICATION_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/70 px-3 py-2.5 dark:border-[#272B4D] dark:bg-[#191D3D]"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {tpl.title}
                      </p>
                      <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                        {tpl.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCommSubject(`${tpl.subject} — ${enquiry.gradeApplied}`);
                        setCommMessage(tpl.body);
                      }}
                      className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#6D28D9] hover:bg-[#F0EBFE] dark:border-[#313761] dark:bg-[#141731] dark:text-violet-300"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </section>

              <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-2 text-xs dark:border-[#272B4D] dark:bg-[#141731]">
                <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] mb-2">
                  Recent Communication Summary
                </h4>
                {(["Email", "Phone Call", "WhatsApp", "SMS"] as const).map((ch) => {
                  const latest = dossier.communications.find((c) => c.channel === ch);
                  return (
                    <div key={ch} className="flex items-center justify-between py-1">
                      <span className="font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                        Last {ch}
                      </span>
                      <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        {latest ? formatDateTimeIst(latest.sentAt) : "—"}
                      </span>
                    </div>
                  );
                })}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTES */}
      {subTab === "notes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]">
              <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                {dossier.notes.length}
              </p>
              <p className="text-[11px] font-semibold text-[#76799C]">Total Notes</p>
            </div>
            <div className="rounded-[16px] border border-sky-200/80 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-[#112238]">
              <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                {dossier.notes.length}
              </p>
              <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                Added by Staff
              </p>
            </div>
            <div className="rounded-[16px] border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-[#2B210E]">
              <p className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Internal
              </p>
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Staff Only
              </p>
            </div>
            <div className="rounded-[16px] border border-[#DFD8FA] bg-[#F7F3FF] p-3.5 dark:border-[#2F295C] dark:bg-[#1B173D]">
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Latest Note
              </p>
              <p className="text-[11px] font-semibold text-[#5B4B9A] dark:text-violet-300">
                {dossier.notes[0] ? formatDateTimeIst(dossier.notes[0].createdAt) : "None yet"}
              </p>
            </div>
          </div>

          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Notes List
              </h4>
              <input
                type="search"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes by keyword..."
                className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>

            <div className="space-y-2.5">
              {dossier.notes
                .filter((n) =>
                  noteSearch.trim()
                    ? `${n.title} ${n.content}`.toLowerCase().includes(noteSearch.trim().toLowerCase())
                    : true,
                )
                .map((n, idx) => {
                  const isEditing = editingNoteId === n.id;
                  return (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[#E5E9F8] bg-[#FAF8FE]/60 p-4 text-xs dark:border-[#272B4D] dark:bg-[#191D3D]"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editNoteTitle}
                            onChange={(e) => setEditNoteTitle(e.target.value)}
                            className="w-full rounded-lg border border-[#7C3AED] bg-white px-3 py-1.5 text-xs dark:bg-[#141731]"
                          />
                          <textarea
                            rows={3}
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            className="w-full rounded-lg border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#141731]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="rounded-lg border px-3 py-1 font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateNote(enquiry.id, {
                                  noteId: n.id,
                                  title: editNoteTitle.trim() || n.title,
                                  content: editNoteContent.trim() || n.content,
                                });
                                setEditingNoteId(null);
                              }}
                              className="rounded-lg bg-[#6D28D9] px-3 py-1 font-bold text-white"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                {idx + 1}. {n.title}
                              </span>
                              <span className="rounded-full bg-[#F0EBFE] px-2 py-0.5 text-[10px] font-semibold text-[#6D28D9] dark:bg-violet-950/60 dark:text-violet-300">
                                {n.category}
                              </span>
                            </div>
                            <p className="text-[#4D5072] dark:text-[#BAC2E2]">{n.content}</p>
                            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                              Added by {n.createdByName} · {formatDateTimeIst(n.createdAt)}
                            </p>
                          </div>
                          {canWrite && (
                            <PortalActionMenu
                              ariaLabel={`Actions for note ${n.title}`}
                              items={[
                                {
                                  label: "Edit Note",
                                  onClick: () => {
                                    setEditingNoteId(n.id);
                                    setEditNoteTitle(n.title);
                                    setEditNoteContent(n.content);
                                  },
                                },
                                {
                                  label: "Delete Note",
                                  danger: true,
                                  onClick: () => void onDeleteNote(enquiry.id, n.id),
                                },
                              ]}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-7 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Add Note
              </h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!noteTitle.trim() || !noteContent.trim()) return;
                  setNoteBusy(true);
                  try {
                    await onCreateNote(enquiry.id, {
                      category: noteCategory,
                      title: noteTitle.trim(),
                      content: noteContent.trim(),
                    });
                    setNoteTitle("");
                    setNoteContent("");
                  } finally {
                    setNoteBusy(false);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Note Title *</label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Enter note title"
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Category</label>
                    <select
                      value={noteCategory}
                      onChange={(e) =>
                        setNoteCategory(e.target.value as EnquiryNoteCategoryValue)
                      }
                      className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                    >
                      <option value="Admission Related">Admission Related</option>
                      <option value="Parent Requirement">Parent Requirement</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Note Details *</label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Type your note here..."
                    className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
                  />
                  <div className="text-right text-[10px] text-[#76799C]">
                    {noteContent.length} / 2000
                  </div>
                </div>
                <p className="rounded-xl bg-[#F5F7FD] px-3 py-2 text-[11px] text-[#4D5072] dark:bg-[#191D3D] dark:text-[#9DA6CC]">
                  This note will be visible to authorized staff only (e.g., admissions, principal, and admin).
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={!canWrite || noteBusy || !noteTitle.trim() || !noteContent.trim()}
                    className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {noteBusy ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </form>
            </section>

            <section className="lg:col-span-5 rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
              <h4 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Note Insights
              </h4>
              <EnquiriesDonutChart
                centerValue={dossier.notes.length}
                centerLabel="Notes"
                slices={noteSlices}
              />
            </section>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY LOG */}
      {subTab === "activity" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Activities", val: actStats.total },
              { label: "Updates", val: actStats.updates },
              { label: "Follow-up Actions", val: actStats.followUpActs },
              { label: "Communications", val: actStats.commActs },
              { label: "Other Actions", val: actStats.other },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 dark:border-[#272B4D] dark:bg-[#141731]"
              >
                <p className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] tabular-nums">
                  {k.val}
                </p>
                <p className="text-[11px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                  {k.label}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <select
                value={actFilter}
                onChange={(e) => setActFilter(e.target.value)}
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
              >
                <option value="all">All Activities</option>
                <option value="FOLLOW_UP">Follow-ups</option>
                <option value="COMMUNICATION">Communications</option>
                <option value="NOTE">Notes</option>
                <option value="UPDATED">Updates</option>
              </select>
              <input
                type="search"
                value={actSearch}
                onChange={(e) => setActSearch(e.target.value)}
                placeholder="Search activity by keyword..."
                className="w-64 rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs dark:border-[#313761] dark:bg-[#1A1F3D]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3F5] text-[11px] uppercase text-[#4D5072] dark:border-[#232746] dark:text-[#9DA6CC]">
                    <th className="py-2">Date &amp; Time</th>
                    <th className="py-2 px-3">Activity</th>
                    <th className="py-2 px-3">Details</th>
                    <th className="py-2 text-right">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                  {dossier.activities
                    .filter((a) => {
                      if (actFilter !== "all" && !a.action.includes(actFilter)) return false;
                      if (!actSearch.trim()) return true;
                      return `${a.action} ${a.summary} ${a.actorName}`
                        .toLowerCase()
                        .includes(actSearch.trim().toLowerCase());
                    })
                    .map((a) => (
                      <tr key={a.id}>
                        <td className="py-2.5 text-[#4D5072] dark:text-[#9DA6CC]">
                          {formatDateTimeIst(a.createdAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded-full bg-[#F0EBFE] px-2.5 py-0.5 text-[11px] font-bold text-[#6D28D9] dark:bg-violet-950/60 dark:text-violet-300">
                            {a.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#1B1D45] dark:text-[#DCE1F9]">
                          {a.summary}
                        </td>
                        <td className="py-2.5 text-right font-semibold">{a.actorName}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
