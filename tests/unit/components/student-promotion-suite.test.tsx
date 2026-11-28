// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StudentPromotionSuite } from "@/modules/students/components/promotions/student-promotion-suite";
import { PlatformPromotionsGlobalTab } from "@/modules/platform/components/platform-promotions-global-tab";
import type {
  PlatformGlobalPromotionsData,
  StudentPromotionOverviewData,
} from "@/modules/students/promotion-types";

const mockOverviewData: StudentPromotionOverviewData = {
  schoolId: "school-1",
  schoolName: "Sunrise International School",
  academicYears: ["2025-2026", "2024-2025"],
  grades: ["Class V", "Class VI"],
  sections: ["A", "B"],
  kpis: {
    totalStudents: 120,
    eligibleStudents: 118,
    promotedCount: 112,
    pendingCount: 4,
    notPromotedCount: 2,
    promotionRatePct: 94.9,
  },
  trendByYear: [
    { label: "2023-2024", count: 104 },
    { label: "2024-2025", count: 109 },
    { label: "2025-2026", count: 112 },
  ],
  trendByClass: [
    { grade: "Class V", count: 58, percentage: 96.7 },
    { grade: "Class VI", count: 54, percentage: 93.1 },
  ],
  readiness: {
    resultsPublished: true,
    attendanceVerified: true,
    rulesConfigured: true,
  },
  classMatrix: [
    {
      fromGrade: "Class V",
      sectionSummary: "A, B",
      toGrade: "Class VI",
      totalStudents: 60,
      promotedCount: 58,
      pendingCount: 2,
      notPromotedCount: 0,
      promotionPct: 96.7,
      status: "In Progress",
    },
  ],
  decisions: [
    {
      studentId: "stu-1",
      admissionNumber: "ADM2025-0187",
      studentName: "Aanya Singh",
      currentGrade: "Class V",
      currentSection: "A",
      nextGrade: "Class VI",
      nextSection: "A",
      academicYear: "2025-2026",
      resultGrade: "A+",
      promotionPct: 98.8,
      attendancePct: 96.2,
      status: "PROMOTED",
      remarks: null,
    },
    {
      studentId: "stu-2",
      admissionNumber: "ADM2025-0204",
      studentName: "Nishant Roy",
      currentGrade: "Class V",
      currentSection: "B",
      nextGrade: "Class VI",
      nextSection: "B",
      academicYear: "2025-2026",
      resultGrade: "B+",
      promotionPct: 89.2,
      attendancePct: 91.5,
      status: "PENDING",
      remarks: null,
    },
  ],
  rules: [
    {
      id: "rule-1",
      schoolId: "school-1",
      academicYear: "2025-2026",
      fromGrade: "Class V",
      toGrade: "Class VI",
      markAsAlumni: false,
      defaultSectionMode: "KEEP_SAME",
      targetSection: null,
      minResultPct: 35,
      minAttendancePct: 75,
      maxFailedSubjects: 0,
      isActive: true,
    },
  ],
  batches: [
    {
      id: "batch-1",
      schoolId: "school-1",
      academicYear: "2024-2025",
      toAcademicYear: "2025-2026",
      fromGrade: "Class V",
      toGrade: "Class VI",
      totalEligible: 118,
      promotedCount: 112,
      retainedCount: 2,
      pendingCount: 4,
      alumniCount: 0,
      promotionPct: 94.9,
      status: "COMPLETED",
      triggeredByName: "Principal",
      completedAt: "2025-03-31T10:00:00.000Z",
      remarks: null,
    },
  ],
  recentPromotions: [
    {
      studentId: "stu-1",
      admissionNumber: "ADM2025-0187",
      studentName: "Aanya Singh",
      currentGrade: "Class V",
      currentSection: "A",
      nextGrade: "Class VI",
      nextSection: "A",
      academicYear: "2025-2026",
      resultGrade: "A+",
      promotionPct: 98.8,
      attendancePct: 96.2,
      status: "PROMOTED",
      remarks: null,
    },
  ],
  settings: {
    finalGradeForAlumni: "Class XII",
    autoAssignRollNumbers: true,
    minResultPct: 35,
    minAttendancePct: 75,
    lockPromotionAfterPublish: false,
    notifyParentsOnPromotion: true,
    requirePendingFeeClearance: false,
  },
};

const mockPlatformGlobal: PlatformGlobalPromotionsData = {
  totalSchools: 1,
  kpis: {
    totalStudents: 120,
    promotedCount: 112,
    pendingCount: 4,
    notPromotedCount: 2,
    overallPromotionRatePct: 94.9,
    schoolsCompletedCount: 1,
  },
  trendByYear: [{ label: "2025-2026", count: 112 }],
  schoolSummaries: [
    {
      schoolId: "school-1",
      schoolName: "Sunrise International School",
      schoolUniqueId: "SCH-1001",
      totalStudents: 120,
      promotedCount: 112,
      pendingCount: 4,
      notPromotedCount: 2,
      promotionRatePct: 94.9,
      rulesConfigured: true,
      lastBatchAt: "2025-03-31T10:00:00.000Z",
    },
  ],
  recentBatches: [
    {
      ...mockOverviewData.batches[0]!,
      schoolName: "Sunrise International School",
    },
  ],
};

describe("StudentPromotionSuite & PlatformPromotionsGlobalTab UI", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders all 6 tabs cleanly with Light/Dark theme parity and opens student profile from Promotion List", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, overview: mockOverviewData }),
      }),
    );

    const onOpenProfile = vi.fn();
    const { container } = render(
      <StudentPromotionSuite
        mode="school"
        schoolId="school-1"
        grades={["Class V", "Class VI"]}
        academicYears={["2025-2026"]}
        sections={["A", "B"]}
        canPromote
        canManageSettings
        onOpenStudentProfile={onOpenProfile}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Promotion Readiness/i)).toBeTruthy();
    });

    expect(container.innerHTML).toContain("dark:bg-[#141731]");
    expect(screen.getByText(/Promotion Trend/i)).toBeTruthy();
    expect(screen.getByText(/Promotion by Status/i)).toBeTruthy();
    expect(screen.getByText(/Promotion Progress by Class/i)).toBeTruthy();

    // Switch to Promotion List
    fireEvent.click(screen.getByRole("button", { name: /^Promotion List$/i }));
    await waitFor(() => {
      expect(screen.getByText("ADM2025-0187")).toBeTruthy();
    });
    fireEvent.click(screen.getByText("Aanya Singh"));
    expect(onOpenProfile).toHaveBeenCalledWith("stu-1");

    // Switch through Promotion Rules, Result Criteria, History, and Settings
    fireEvent.click(screen.getByRole("button", { name: /^Promotion Rules$/i }));
    expect(screen.getByText(/Class Progression Mapping Rules/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Result Criteria$/i }));
    expect(screen.getByText(/Class-wise Pass & Attendance Thresholds/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^History$/i }));
    expect(screen.getByText(/Promotion History Records \(Year-wise\)/i)).toBeTruthy();
    expect(screen.getByText(/Promotion Outcome \(All Years\)/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Settings$/i }));
    expect(screen.getByText(/Promotion Governance & Workflow Settings/i)).toBeTruthy();
  });

  it("renders Company Admin PlatformPromotionsGlobalTab and routes to school promotion suite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, overview: mockPlatformGlobal }),
      }),
    );

    const onOpenSchoolPromotions = vi.fn();
    render(
      <PlatformPromotionsGlobalTab onOpenSchoolPromotions={onOpenSchoolPromotions} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Global Student Promotions Console/i)).toBeTruthy();
    });

    expect(screen.getAllByText(/Sunrise International School/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Manage Promotions/i }));
    expect(onOpenSchoolPromotions).toHaveBeenCalledWith("school-1");
  });
});
