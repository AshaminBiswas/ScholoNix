// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdmittedWorkspace } from "@/modules/school/admissions/components/admitted/admitted-workspace";
import {
  createDefaultExtendedSettings,
  type AdmissionApplicationRecord,
  type AdmissionFeeLedgerRecord,
  type AdmissionFeePaymentRecord,
  type AdmissionSettingRecord,
} from "@/modules/school/admissions/types";

describe("AdmittedWorkspace UI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleSettings: AdmissionSettingRecord = {
    schoolId: "sch-1",
    currentAcademicYear: "2026-27",
    applicationDeadline: null,
    applicationPrefix: "APP",
    enabledGrades: ["Nursery", "Class I", "Class IV"],
    extendedConfig: {
      ...createDefaultExtendedSettings(),
      totalSeatsPerClass: 60,
    },
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const sampleStudents: AdmissionApplicationRecord[] = [
    {
      id: "app-1",
      schoolId: "sch-1",
      applicationCode: "APP2026-0001",
      admissionNumber: "ADM2026-0001",
      enquiryId: null,
      studentName: "Aarav Synthetic",
      gender: "Male",
      dateOfBirth: "2019-06-15",
      gradeApplied: "Class I",
      academicYear: "2026-27",
      guardianName: "Rajesh Synthetic",
      guardianRelation: "Father",
      guardianPhone: "+919876543210",
      guardianEmail: "rajesh.synthetic@example.com",
      previousSchool: null,
      status: "ADMITTED",
      verificationStatus: "VERIFIED",
      verificationNotes: null,
      documentsChecklist: [
        { key: "birth_certificate", label: "Birth Certificate", submitted: true, verified: true },
        { key: "student_photo", label: "Passport Size Photo", submitted: true, verified: true },
      ],
      admissionType: "FRESH",
      enrollmentStatus: "ACTIVE",
      appliedAt: "2026-01-10T00:00:00.000Z",
      shortlistedAt: null,
      admittedAt: "2026-01-20T00:00:00.000Z",
      rejectedAt: null,
      verifiedAt: "2026-01-19T00:00:00.000Z",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const sampleLedgers: AdmissionFeeLedgerRecord[] = [
    {
      id: "led-1",
      schoolId: "sch-1",
      applicationId: "app-1",
      academicYear: "2026-27",
      totalFeePaise: 5_000_000,
      concessionPaise: 0,
      concessionReason: null,
      currency: "INR",
      paidPaise: 5_000_000,
      outstandingPaise: 0,
      paymentStatus: "PAID",
      lastPaymentDate: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const samplePayments: AdmissionFeePaymentRecord[] = [
    {
      id: "pay-1",
      schoolId: "sch-1",
      applicationId: "app-1",
      studentName: "Aarav Synthetic",
      admissionNumber: "ADM2026-0001",
      receiptNumber: "RCP2026-0001",
      idempotencyKey: "k-1",
      feeHead: "Admission Fee",
      amountPaise: 5_000_000,
      paymentDate: "2026-01-20T00:00:00.000Z",
      paymentMode: "UPI",
      referenceNo: "UPI9999",
      remarks: null,
      recordedByUserId: null,
      recordedByName: "Principal",
      createdAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  it("navigates across Overview, Admitted List, Documents, Fee Status, Reports tabs, portal menus, ID card preview, and receipt modal", async () => {
    const actor = userEvent.setup();

    render(
      <AdmittedWorkspace
        schoolName="Sunrise Synthetic School"
        schoolSlug="sunrise-synthetic"
        students={sampleStudents}
        allSubmittedApplicationsCount={4}
        ledgers={sampleLedgers}
        payments={samplePayments}
        settings={sampleSettings}
        activities={[]}
        availableAcademicYears={["2026-27"]}
        availableGrades={["Nursery", "Class I", "Class IV"]}
        canWrite
        canVerify
        canExport
        onRefreshOverview={vi.fn().mockResolvedValue(undefined)}
        onViewStudent={vi.fn()}
        onEditStudent={vi.fn()}
        onShowToast={vi.fn()}
      />,
    );

    // Overview Tab
    expect(screen.getByText("Seat Utilization")).toBeTruthy();
    expect(screen.getByText("ADM2026-0001")).toBeTruthy();

    // Portal 3-dot Menu
    await actor.click(screen.getByRole("button", { name: "Actions for Aarav Synthetic" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    await actor.click(screen.getByRole("menuitem", { name: "Generate ID Card" }));
    expect(screen.getByRole("dialog", { name: "Student ID Cards Preview" })).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Close" }));

    // Admitted List Tab
    await actor.click(screen.getByRole("button", { name: "Admitted List" }));
    expect(screen.getByText(/Admitted Students List \(1\)/i)).toBeTruthy();

    // Documents Tab
    await actor.click(screen.getByRole("button", { name: "Documents" }));
    expect(screen.getByText("Document Submission Status")).toBeTruthy();
    expect(screen.getByText("Upload / Update Document")).toBeTruthy();

    // Fee Status Tab + Receipt Modal
    await actor.click(screen.getByRole("button", { name: "Fee Status" }));
    expect(screen.getByText("Record Fee Payment")).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "RCP2026-0001" }));
    expect(screen.getByRole("dialog", { name: "Fee Receipt" })).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Close" }));

    // Reports Tab
    await actor.click(screen.getByRole("button", { name: "Reports" }));
    expect(
      screen.getByRole("heading", { name: /Admitted Students Reports & Exports/i }),
    ).toBeTruthy();
    expect(
      screen.getByText("Grade-wise Seat, Document & Fee Readiness Matrix"),
    ).toBeTruthy();
  });
});
