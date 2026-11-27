"use client";

import React, { useMemo, useState } from "react";
import type {
  AdmissionActivityRecord,
  AdmissionApplicationRecord,
  AdmissionDocumentType,
  AdmissionFeeLedgerRecord,
  AdmissionFeePaymentRecord,
  AdmissionSettingRecord,
  AdmissionTypeValue,
  AdmittedEnrollmentStatusValue,
  AdmittedFeeHeadValue,
  AdmittedPaymentModeValue,
} from "@/modules/school/admissions/types";
import { AdmittedOverviewTab } from "./admitted-overview-tab";
import { AdmittedListTab } from "./admitted-list-tab";
import { AdmittedDocumentsTab } from "./admitted-documents-tab";
import { AdmittedFeesTab } from "./admitted-fees-tab";
import { AdmittedReportsTab } from "./admitted-reports-tab";
import {
  DirectAdmitModal,
  FeeReceiptModal,
  IdCardsModal,
  ImportAdmittedModal,
  SetFeeLedgerModal,
} from "./admitted-modals";

export type AdmittedSubTab = "overview" | "list" | "documents" | "fees" | "reports";

interface AdmittedWorkspaceProps {
  schoolName: string;
  schoolSlug: string;
  students: AdmissionApplicationRecord[];
  allSubmittedApplicationsCount: number;
  ledgers: AdmissionFeeLedgerRecord[];
  payments: AdmissionFeePaymentRecord[];
  settings: AdmissionSettingRecord;
  activities: AdmissionActivityRecord[];
  availableAcademicYears: string[];
  availableGrades: string[];
  canWrite: boolean;
  canVerify: boolean;
  canExport: boolean;
  onRefreshOverview: () => Promise<void>;
  onViewStudent: (stu: AdmissionApplicationRecord) => void;
  onEditStudent: (stu: AdmissionApplicationRecord) => void;
  onShowToast: (type: "success" | "error", text: string) => void;
}

export function AdmittedWorkspace({
  schoolName,
  schoolSlug,
  students,
  allSubmittedApplicationsCount,
  ledgers,
  payments,
  settings,
  activities,
  availableAcademicYears,
  availableGrades,
  canWrite,
  canVerify,
  canExport,
  onRefreshOverview,
  onViewStudent,
  onEditStudent,
  onShowToast,
}: AdmittedWorkspaceProps) {
  const [subTab, setSubTab] = useState<AdmittedSubTab>("overview");
  const [yearFilter, setYearFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | AdmissionTypeValue>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdmittedEnrollmentStatusValue>("all");

  const [directAdmitOpen, setDirectAdmitOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [idCardStudents, setIdCardStudents] = useState<AdmissionApplicationRecord[] | null>(null);
  const [setLedgerStudent, setSetLedgerStudent] = useState<AdmissionApplicationRecord | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<AdmissionFeePaymentRecord | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (yearFilter !== "all" && s.academicYear !== yearFilter) return false;
      if (gradeFilter !== "all" && s.gradeApplied !== gradeFilter) return false;
      if (typeFilter !== "all" && (s.admissionType || "FRESH") !== typeFilter) return false;
      if (statusFilter !== "all" && (s.enrollmentStatus || "ACTIVE") !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [students, yearFilter, gradeFilter, typeFilter, statusFilter]);

  const filteredIds = useMemo(
    () => new Set(filteredStudents.map((s) => s.id)),
    [filteredStudents],
  );
  const filteredLedgers = useMemo(
    () => ledgers.filter((l) => filteredIds.has(l.applicationId)),
    [ledgers, filteredIds],
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => filteredIds.has(p.applicationId)),
    [payments, filteredIds],
  );

  const handleExportCsv = (dataset: "roster" | "documents" | "fees") => {
    const academicYearParam =
      yearFilter !== "all" ? yearFilter : settings.currentAcademicYear;
    window.location.href = `/api/school/admissions/admitted/export?dataset=${dataset}&schoolSlug=${encodeURIComponent(
      schoolSlug,
    )}&academicYear=${encodeURIComponent(academicYearParam)}`;
  };

  const handleDirectAdmit = async (payload: Record<string, unknown>) => {
    const res = await fetch(
      `/api/school/admissions/admitted?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      student?: AdmissionApplicationRecord;
    };
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to admit student.");
    }
    onShowToast(
      "success",
      `Admitted ${json.student?.studentName || "student"} (${json.student?.admissionNumber || "Confirmed"}).`,
    );
    await onRefreshOverview();
  };

  const handleImportStudents = async (rows: Array<Record<string, unknown>>) => {
    const res = await fetch(
      `/api/school/admissions/admitted/import?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: rows }),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      count?: number;
    };
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to import admitted students.");
    }
    onShowToast("success", `Imported ${json.count || rows.length} admitted students.`);
    await onRefreshOverview();
  };

  const handleUpdateEnrollment = async (
    applicationId: string,
    payload: { enrollmentStatus?: AdmittedEnrollmentStatusValue; admissionType?: AdmissionTypeValue },
  ) => {
    const res = await fetch(
      `/api/school/admissions/admitted/${encodeURIComponent(
        applicationId,
      )}?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      onShowToast("error", "Unable to update student enrollment status.");
      return;
    }
    onShowToast("success", "Student enrollment status updated.");
    await onRefreshOverview();
  };

  const handleUploadDocument = async (
    applicationId: string,
    docType: AdmissionDocumentType,
    file: File,
  ) => {
    const fd = new FormData();
    fd.append("applicationId", applicationId);
    fd.append("docType", docType);
    fd.append("file", file);
    const uploadRes = await fetch(
      `/api/school/admissions/documents?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      { method: "POST", body: fd },
    );
    const uploadJson = (await uploadRes.json().catch(() => ({}))) as {
      error?: { message?: string };
      document?: Record<string, unknown>;
    };
    if (!uploadRes.ok || !uploadJson.document) {
      throw new Error(uploadJson.error?.message || "Failed to upload document.");
    }

    const stu = students.find((s) => s.id === applicationId);
    const prevDocs = Array.isArray(stu?.uploadedDocuments) ? stu.uploadedDocuments : [];
    const nextDocs = [...prevDocs.filter((d) => d.docType !== docType), uploadJson.document];
    const patchRes = await fetch(
      `/api/school/admissions/applications/${encodeURIComponent(
        applicationId,
      )}?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadedDocuments: nextDocs }),
      },
    );
    if (!patchRes.ok) {
      throw new Error("Failed to link uploaded document to student record.");
    }
    onShowToast("success", "Document uploaded and attached to student profile.");
    await onRefreshOverview();
  };

  const handleMarkStudentDocsVerified = async (stu: AdmissionApplicationRecord) => {
    const updatedChecklist = (stu.documentsChecklist || []).map((item) => ({
      ...item,
      submitted: true,
      verified: true,
    }));
    const res = await fetch(
      `/api/school/admissions/applications/${encodeURIComponent(
        stu.id,
      )}?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "VERIFIED",
          documentsChecklist: updatedChecklist,
        }),
      },
    );
    if (!res.ok) {
      onShowToast("error", "Unable to mark documents verified.");
      return;
    }
    onShowToast("success", `Verified documents for ${stu.studentName}.`);
    await onRefreshOverview();
  };

  const handleSaveFeeLedger = async (payload: {
    applicationId: string;
    totalFeeRupees: number;
    concessionRupees: number;
    concessionReason: string;
  }) => {
    const res = await fetch(
      `/api/school/admissions/admitted/fees/ledger?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to update fee assessment.");
    }
    onShowToast("success", "Student fee assessment saved.");
    await onRefreshOverview();
  };

  const handleRecordPayment = async (payload: {
    applicationId: string;
    idempotencyKey: string;
    feeHead: AdmittedFeeHeadValue;
    amountRupees: number;
    paymentDate: string;
    paymentMode: AdmittedPaymentModeValue;
    referenceNo: string;
  }) => {
    const res = await fetch(
      `/api/school/admissions/admitted/fees/payments?schoolSlug=${encodeURIComponent(schoolSlug)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      payment?: AdmissionFeePaymentRecord;
    };
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to record fee payment.");
    }
    onShowToast(
      "success",
      `Payment receipt ${json.payment?.receiptNumber || "recorded"} generated.`,
    );
    await onRefreshOverview();
  };

  const handleSendNotice = async (targetStudents: AdmissionApplicationRecord[]) => {
    if (targetStudents.length === 0) return;
    onShowToast(
      "success",
      `Prepared notification for ${targetStudents.length} admitted ${
        targetStudents.length === 1 ? "student" : "students"
      }.`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Admitted Students
          </h2>
          <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
            View and manage all confirmed admissions for the selected academic year.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => setDirectAdmitOpen(true)}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                + Admit Student
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="rounded-xl border border-[#D6DBF0] bg-white px-3.5 py-2 text-xs font-bold text-[#1B1D45] hover:border-[#7C3AED] dark:border-[#313761] dark:bg-[#171B36] dark:text-[#DCE1F9]"
              >
                Import Admitted List
              </button>
            </>
          )}
          {canExport && (
            <button
              type="button"
              onClick={() => handleExportCsv("roster")}
              className="rounded-xl border border-[#D6DBF0] bg-white px-3.5 py-2 text-xs font-bold text-[#1B1D45] hover:border-[#7C3AED] dark:border-[#313761] dark:bg-[#171B36] dark:text-[#DCE1F9]"
            >
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* 5 Sub-tabs Bar */}
      <div className="flex flex-wrap gap-2 rounded-[16px] border border-[#D6DBF0] bg-white p-1.5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        {[
          { id: "overview" as const, label: "Overview" },
          { id: "list" as const, label: "Admitted List" },
          { id: "documents" as const, label: "Documents" },
          { id: "fees" as const, label: "Fee Status" },
          { id: "reports" as const, label: "Reports" },
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

      {/* Global Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-[16px] border border-[#D6DBF0] bg-white p-3.5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        <select
          aria-label="Filter admitted students by academic year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
        >
          <option value="all">Academic Year: All</option>
          {availableAcademicYears.map((ay) => (
            <option key={ay} value={ay}>
              {ay}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter admitted students by grade"
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
        >
          <option value="all">Grade: All Grades</option>
          {availableGrades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter admitted students by admission type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | AdmissionTypeValue)}
          className="rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
        >
          <option value="all">Admission Type: All</option>
          <option value="FRESH">New Admission</option>
          <option value="TRANSFER">Transfer</option>
          <option value="RE_ADMISSION">Re-Admission</option>
          <option value="OTHER">Others</option>
        </select>
        <select
          aria-label="Filter admitted students by enrollment status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | AdmittedEnrollmentStatusValue)
          }
          className="rounded-xl border border-[#CAD0EB] bg-[#F5F7FD] px-3 py-1.5 text-xs font-semibold dark:border-[#313761] dark:bg-[#1A1F3D]"
        >
          <option value="all">Status: All</option>
          <option value="ACTIVE">Active</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>
      </div>

      {subTab === "overview" && (
        <AdmittedOverviewTab
          students={filteredStudents}
          allSubmittedApplicationsCount={allSubmittedApplicationsCount}
          ledgers={filteredLedgers}
          settings={settings}
          onViewStudent={onViewStudent}
          onEditStudent={onEditStudent}
          onDownloadPdf={(stu) =>
            window.open(
              `/api/school/admissions/applications/${encodeURIComponent(
                stu.id,
              )}/pdf?schoolSlug=${encodeURIComponent(schoolSlug)}`,
              "_blank",
            )
          }
          onOpenIdCard={(list) => setIdCardStudents(list)}
          onSwitchSubTab={(t) => setSubTab(t)}
        />
      )}

      {subTab === "list" && (
        <AdmittedListTab
          students={filteredStudents}
          ledgers={filteredLedgers}
          settings={settings}
          canWrite={canWrite}
          canExport={canExport}
          onViewStudent={onViewStudent}
          onEditStudent={onEditStudent}
          onUpdateEnrollment={handleUpdateEnrollment}
          onOpenIdCard={(list) => setIdCardStudents(list)}
          onOpenCommunication={(list) => void handleSendNotice(list)}
          onOpenDirectAdmit={() => setDirectAdmitOpen(true)}
          onOpenImport={() => setImportOpen(true)}
          onExportCsv={() => handleExportCsv("roster")}
        />
      )}

      {subTab === "documents" && (
        <AdmittedDocumentsTab
          schoolSlug={schoolSlug}
          students={filteredStudents}
          settings={settings}
          activities={activities}
          canWrite={canWrite}
          canVerify={canVerify}
          canExport={canExport}
          onViewStudent={onViewStudent}
          onUploadDocument={handleUploadDocument}
          onMarkStudentDocsVerified={handleMarkStudentDocsVerified}
          onExportDocumentsCsv={() => handleExportCsv("documents")}
        />
      )}

      {subTab === "fees" && (
        <AdmittedFeesTab
          students={filteredStudents}
          ledgers={filteredLedgers}
          payments={filteredPayments}
          canWrite={canWrite}
          canExport={canExport}
          onRecordPayment={handleRecordPayment}
          onOpenSetLedgerModal={(stu) => setSetLedgerStudent(stu)}
          onOpenReceiptModal={(payment) => setReceiptPayment(payment)}
          onSendReminder={(stu) => void handleSendNotice([stu])}
          onExportFeesCsv={() => handleExportCsv("fees")}
        />
      )}

      {subTab === "reports" && (
        <AdmittedReportsTab
          students={filteredStudents}
          ledgers={filteredLedgers}
          settings={settings}
          canExport={canExport}
          onExportCsv={handleExportCsv}
        />
      )}

      <DirectAdmitModal
        open={directAdmitOpen}
        availableGrades={availableGrades}
        academicYear={settings.currentAcademicYear}
        onClose={() => setDirectAdmitOpen(false)}
        onSubmit={handleDirectAdmit}
      />

      <ImportAdmittedModal
        open={importOpen}
        academicYear={settings.currentAcademicYear}
        onClose={() => setImportOpen(false)}
        onImport={handleImportStudents}
      />

      <IdCardsModal
        schoolName={schoolName}
        students={idCardStudents}
        onClose={() => setIdCardStudents(null)}
      />

      <SetFeeLedgerModal
        student={setLedgerStudent}
        existingLedger={
          setLedgerStudent
            ? filteredLedgers.find((l) => l.applicationId === setLedgerStudent.id)
            : undefined
        }
        students={filteredStudents}
        onClose={() => setSetLedgerStudent(null)}
        onSave={handleSaveFeeLedger}
      />

      <FeeReceiptModal
        schoolName={schoolName}
        payment={receiptPayment}
        onClose={() => setReceiptPayment(null)}
      />
    </div>
  );
}
