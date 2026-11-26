"use client";

import React, { useCallback, useState } from "react";
import type {
  AdmissionApplicationRecord,
  AdmissionEnquiryFollowUpRecord,
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
  AdmissionEnquiryStatusType,
  EnquiryDossierData,
  EnquiryFollowUpStatusValue,
  EnquiryFollowUpTypeValue,
  EnquiryNoteCategoryValue,
  SchoolStaffOption,
} from "@/modules/school/admissions/types";
import { EnquiriesOverviewTab } from "./enquiries-overview-tab";
import { EnquiriesListTab } from "./enquiries-list-tab";
import { EnquiriesFollowUpsTab } from "./enquiries-followups-tab";
import { EnquiriesSourcesTab } from "./enquiries-sources-tab";
import { EnquiriesReportsTab } from "./enquiries-reports-tab";
import { EnquiryFormPage } from "./enquiry-form-page";
import { EnquiryDetailView } from "./enquiry-detail-view";

export type EnquiriesSubView =
  | "overview"
  | "list"
  | "followups"
  | "sources"
  | "reports"
  | "create"
  | "edit"
  | "detail";

interface EnquiriesWorkspaceProps {
  schoolName: string;
  schoolSlug: string;
  enquiries: AdmissionEnquiryRecord[];
  sources: AdmissionEnquirySourceRecord[];
  followUps: AdmissionEnquiryFollowUpRecord[];
  applications: AdmissionApplicationRecord[];
  availableAcademicYears: string[];
  availableGrades: string[];
  currentAcademicYear: string;
  staffOptions: SchoolStaffOption[];
  canWrite: boolean;
  canExport: boolean;
  onRefreshOverview: () => Promise<void>;
  onCreateEnquiry: (payload: Record<string, unknown>) => Promise<AdmissionEnquiryRecord>;
  onUpdateOrConvertEnquiry: (
    enquiryId: string,
    payload: Record<string, unknown>,
  ) => Promise<void>;
}

export function EnquiriesWorkspace({
  schoolName,
  schoolSlug,
  enquiries,
  sources,
  followUps,
  applications,
  availableAcademicYears,
  availableGrades,
  currentAcademicYear,
  staffOptions,
  canWrite,
  canExport,
  onRefreshOverview,
  onCreateEnquiry,
  onUpdateOrConvertEnquiry,
}: EnquiriesWorkspaceProps) {
  const [view, setView] = useState<EnquiriesSubView>("overview");
  const [editingEnquiry, setEditingEnquiry] = useState<AdmissionEnquiryRecord | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<EnquiryDossierData | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const loadDossier = useCallback(
    async (enquiryId: string) => {
      setLoadingDossier(true);
      setView("detail");
      try {
        const res = await fetch(
          `/api/school/admissions/enquiries/${encodeURIComponent(
            enquiryId,
          )}?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        );
        const body = (await res.json()) as { dossier?: EnquiryDossierData };
        if (res.ok && body.dossier) {
          setSelectedDossier(body.dossier);
        }
      } finally {
        setLoadingDossier(false);
      }
    },
    [schoolSlug],
  );

  const handleViewEnquiry = useCallback(
    (enquiry: AdmissionEnquiryRecord) => {
      void loadDossier(enquiry.id);
    },
    [loadDossier],
  );

  const handleViewEnquiryById = useCallback(
    (enquiryId: string) => {
      void loadDossier(enquiryId);
    },
    [loadDossier],
  );

  const handleEditEnquiry = useCallback((enquiry: AdmissionEnquiryRecord) => {
    setEditingEnquiry(enquiry);
    setView("edit");
  }, []);

  const handleExportCsv = useCallback(() => {
    window.location.href = `/api/school/admissions/enquiries/export?schoolSlug=${encodeURIComponent(
      schoolSlug,
    )}&academicYear=${encodeURIComponent(currentAcademicYear)}`;
  }, [schoolSlug, currentAcademicYear]);

  const handleConvertEnquiry = useCallback(
    async (enquiry: AdmissionEnquiryRecord) => {
      await onUpdateOrConvertEnquiry(enquiry.id, { action: "convert" });
      await onRefreshOverview();
      if (view === "detail" && selectedDossier?.enquiry.id === enquiry.id) {
        await loadDossier(enquiry.id);
      }
    },
    [onUpdateOrConvertEnquiry, onRefreshOverview, view, selectedDossier, loadDossier],
  );

  const handleUpdateEnquiryStatus = useCallback(
    async (enquiryId: string, status: AdmissionEnquiryStatusType) => {
      await onUpdateOrConvertEnquiry(enquiryId, { action: "update", status });
      await onRefreshOverview();
      if (view === "detail" && selectedDossier?.enquiry.id === enquiryId) {
        await loadDossier(enquiryId);
      }
    },
    [onUpdateOrConvertEnquiry, onRefreshOverview, view, selectedDossier, loadDossier],
  );

  const handleScheduleFollowUp = useCallback(
    async (
      enquiryId: string,
      payload: {
        followUpType: EnquiryFollowUpTypeValue;
        scheduledAt: string;
        assignedToUserId?: string | null;
        assignedToName?: string | null;
        notes: string;
      },
    ) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/follow-ups?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(err.error?.message || "Failed to schedule follow-up.");
      }
      await onRefreshOverview();
      if (view === "detail" && selectedDossier?.enquiry.id === enquiryId) {
        await loadDossier(enquiryId);
      }
    },
    [schoolSlug, onRefreshOverview, view, selectedDossier, loadDossier],
  );

  const handleUpdateFollowUpStatus = useCallback(
    async (
      enquiryId: string,
      followUpId: string,
      status: EnquiryFollowUpStatusValue,
    ) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/follow-ups?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followUpId, status }),
        },
      );
      if (!res.ok) return;
      await onRefreshOverview();
      if (view === "detail" && selectedDossier?.enquiry.id === enquiryId) {
        await loadDossier(enquiryId);
      }
    },
    [schoolSlug, onRefreshOverview, view, selectedDossier, loadDossier],
  );

  const handleSendCommunication = useCallback(
    async (enquiryId: string, formData: FormData) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/communications?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(err.error?.message || "Failed to send communication.");
      }
      await onRefreshOverview();
      await loadDossier(enquiryId);
    },
    [schoolSlug, onRefreshOverview, loadDossier],
  );

  const handleCreateNote = useCallback(
    async (
      enquiryId: string,
      payload: {
        category: EnquiryNoteCategoryValue;
        title: string;
        content: string;
      },
    ) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/notes?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) return;
      await loadDossier(enquiryId);
    },
    [schoolSlug, loadDossier],
  );

  const handleUpdateNote = useCallback(
    async (
      enquiryId: string,
      payload: {
        noteId: string;
        category?: EnquiryNoteCategoryValue;
        title?: string;
        content?: string;
      },
    ) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/notes?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) return;
      await loadDossier(enquiryId);
    },
    [schoolSlug, loadDossier],
  );

  const handleDeleteNote = useCallback(
    async (enquiryId: string, noteId: string) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/${encodeURIComponent(
          enquiryId,
        )}/notes?noteId=${encodeURIComponent(noteId)}&schoolSlug=${encodeURIComponent(schoolSlug)}`,
        { method: "DELETE" },
      );
      if (!res.ok) return;
      await loadDossier(enquiryId);
    },
    [schoolSlug, loadDossier],
  );

  const handleCreateSource = useCallback(
    async (payload: {
      name: string;
      description: string;
      isActive: boolean;
      colorToken: "violet" | "sky" | "cyan" | "emerald" | "amber" | "indigo" | "rose";
    }) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/sources?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(err.error?.message || "Failed to create source.");
      }
      await onRefreshOverview();
    },
    [schoolSlug, onRefreshOverview],
  );

  const handleUpdateSource = useCallback(
    async (payload: {
      id: string;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    }) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/sources?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) await onRefreshOverview();
    },
    [schoolSlug, onRefreshOverview],
  );

  const handleDeleteSource = useCallback(
    async (sourceId: string) => {
      const res = await fetch(
        `/api/school/admissions/enquiries/sources?sourceId=${encodeURIComponent(
          sourceId,
        )}&schoolSlug=${encodeURIComponent(schoolSlug)}`,
        { method: "DELETE" },
      );
      if (res.ok) await onRefreshOverview();
    },
    [schoolSlug, onRefreshOverview],
  );

  if (view === "create" || view === "edit") {
    return (
      <EnquiryFormPage
        mode={view}
        initialEnquiry={view === "edit" ? editingEnquiry : null}
        sources={sources}
        availableGrades={availableGrades}
        availableAcademicYears={availableAcademicYears}
        currentAcademicYear={currentAcademicYear}
        staffOptions={staffOptions}
        onCancel={() => {
          setEditingEnquiry(null);
          setView("list");
        }}
        onSubmit={async ({ mode, enquiryId, data }) => {
          if (mode === "edit" && enquiryId) {
            await onUpdateOrConvertEnquiry(enquiryId, { action: "update", ...data });
          } else {
            await onCreateEnquiry(data);
          }
          await onRefreshOverview();
          setEditingEnquiry(null);
          setView("list");
        }}
      />
    );
  }

  if (view === "detail") {
    return (
      <EnquiryDetailView
        schoolSlug={schoolSlug}
        dossier={selectedDossier}
        loading={loadingDossier}
        canWrite={canWrite}
        onBack={() => setView("list")}
        onEditEnquiry={handleEditEnquiry}
        onConvertEnquiry={handleConvertEnquiry}
        onUpdateEnquiryStatus={handleUpdateEnquiryStatus}
        onCreateFollowUp={handleScheduleFollowUp}
        onUpdateFollowUp={handleUpdateFollowUpStatus}
        onSendCommunication={handleSendCommunication}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />
    );
  }

  const subTabs: Array<{ id: "overview" | "list" | "followups" | "sources" | "reports"; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "list", label: "Enquiry List" },
    { id: "followups", label: "Follow-ups" },
    { id: "sources", label: "Sources" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Enquiries Header & Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Enquiries</h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            Manage admission enquiries, track follow-ups, and convert enquiries to applications.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => {
              setEditingEnquiry(null);
              setView("create");
            }}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            + New Enquiry
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-[16px] border border-[#D6DBF0] bg-white p-1.5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        {subTabs.map((tab) => {
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
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

      {view === "overview" && (
        <EnquiriesOverviewTab
          schoolName={schoolName}
          enquiries={enquiries}
          sources={sources}
          availableGrades={availableGrades}
          currentAcademicYear={currentAcademicYear}
          canWrite={canWrite}
          canExport={canExport}
          onViewEnquiry={handleViewEnquiry}
          onEditEnquiry={handleEditEnquiry}
          onOpenNewEnquiryForm={() => setView("create")}
          onQuickCreateEnquiry={async (payload) => {
            await onCreateEnquiry(payload);
            await onRefreshOverview();
          }}
          onUpdateEnquiryStatus={handleUpdateEnquiryStatus}
          onConvertEnquiry={handleConvertEnquiry}
          onExportCsv={handleExportCsv}
          onSwitchSubTab={(t) => setView(t)}
        />
      )}

      {view === "list" && (
        <EnquiriesListTab
          enquiries={enquiries}
          sources={sources}
          availableAcademicYears={availableAcademicYears}
          availableGrades={availableGrades}
          canWrite={canWrite}
          canExport={canExport}
          onViewEnquiry={handleViewEnquiry}
          onEditEnquiry={handleEditEnquiry}
          onUpdateStatus={handleUpdateEnquiryStatus}
          onConvertEnquiry={handleConvertEnquiry}
          onExportCsv={handleExportCsv}
        />
      )}

      {view === "followups" && (
        <EnquiriesFollowUpsTab
          enquiries={enquiries}
          followUps={followUps}
          availableAcademicYears={availableAcademicYears}
          staffOptions={staffOptions}
          canWrite={canWrite}
          onViewEnquiryById={handleViewEnquiryById}
          onScheduleFollowUp={handleScheduleFollowUp}
          onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
        />
      )}

      {view === "sources" && (
        <EnquiriesSourcesTab
          enquiries={enquiries}
          sources={sources}
          canWrite={canWrite}
          onCreateSource={handleCreateSource}
          onUpdateSource={handleUpdateSource}
          onDeleteSource={handleDeleteSource}
          onFilterBySource={() => setView("list")}
        />
      )}

      {view === "reports" && (
        <EnquiriesReportsTab
          enquiries={enquiries}
          sources={sources}
          applications={applications}
          canExport={canExport}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
}
