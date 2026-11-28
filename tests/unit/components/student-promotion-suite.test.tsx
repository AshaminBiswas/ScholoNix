// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StudentPromotionSuite } from "@/modules/students/components/promotions/student-promotion-suite";
import { PlatformPromotionsGlobalTab } from "@/modules/platform/components/platform-promotions-global-tab";
import {
  DEFAULT_PROMOTION_GRADE_BANDS,
  DEFAULT_PROMOTION_SETTINGS_SUITE,
  type PlatformGlobalPromotionsData,
  type StudentPromotionOverviewData,
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
      ruleName: "Primary Promotion Rule",
      fromGrade: "Class V",
      toGrade: "Class VI",
      markAsAlumni: false,
      defaultSectionMode: "KEEP_SAME",
      targetSection: null,
      minResultPct: 40,
      minAttendancePct: 75,
      maxFailedSubjects: 0,
      criteriaSummary: "Min 40% in all subjects",
      requireAssessmentsCompleted: true,
      requireResultPublished: true,
      requireFeeClearance: false,
      gradeCriteria: DEFAULT_PROMOTION_GRADE_BANDS,
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
  settingsSuite: DEFAULT_PROMOTION_SETTINGS_SUITE,
  schoolStaff: [{ id: "staff-1", name: "Rohan Mehta", role: "PRINCIPAL" }],
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
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).includes("automation/run")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              result: {
                dryRun: true,
                evaluatedCount: 4,
                promotedCount: 3,
                retainedCount: 1,
                alumniCount: 0,
                flaggedCount: 1,
                stepsExecuted: 5,
                classBreakdown: [
                  { fromGrade: "Class V", toGrade: "Class VI", count: 3, alumniCount: 0, retainCount: 1 },
                ],
              },
            }),
          };
        }
        if (String(url).includes("logs")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              totalLogs: 1,
              uniqueUsers: 1,
              settingsChanges: 1,
              promotionActions: 0,
              logs: [
                {
                  id: "log-1",
                  createdAt: "2026-03-31T10:45:00.000Z",
                  actorId: "staff-1",
                  actorName: "Rohan Mehta",
                  module: "Settings",
                  action: "Update",
                  description: "Updated promotion scheme pass percentage",
                  ipAddress: "127.0.0.1",
                  status: "Success",
                  entityType: "StudentPromotionSettings",
                  entityId: "2025-2026",
                },
              ],
              moduleSummary: [{ module: "Settings", count: 1 }],
              topUsers: [{ userName: "Rohan Mehta", count: 1 }],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, overview: mockOverviewData }),
        };
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
    expect(screen.queryByRole("heading", { name: /^Student Promotion$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Download Report$/i })).toBeNull();
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

    // Switch through Promotion Rules (redesigned layout), Result Criteria, History, and Settings
    fireEvent.click(screen.getByRole("button", { name: /^Promotion Rules$/i }));
    expect(screen.getByText(/Total Rules/i)).toBeTruthy();
    expect(screen.getByText(/Rule Details/i)).toBeTruthy();
    expect(screen.getAllByText(/Grade Criteria/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Promotion Conditions/i)).toBeTruthy();
    expect(screen.getAllByText(/Primary Promotion Rule/i).length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByRole("button", { name: /Preview Logic/i }));
    expect(screen.getByText(/Rule Logic Simulation/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Close Preview/i }));

    fireEvent.click(screen.getByRole("button", { name: /^Result Criteria$/i }));
    expect(screen.getByText(/Total Criteria/i)).toBeTruthy();
    expect(screen.getByText(/Result Criteria List/i)).toBeTruthy();
    expect(screen.getByText(/Selected Criteria Details/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /^Grading Structure$/i })).toBeTruthy();
    expect(screen.getByText(/Subject-wise Criteria/i)).toBeTruthy();
    expect(screen.getByText(/Promotion Conditions/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^History$/i }));
    expect(screen.getByText(/Promotion History Records \(Year-wise\)/i)).toBeTruthy();
    expect(screen.getByText(/Promotion Outcome \(All Years\)/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Settings$/i }));
    expect(screen.getByText(/Promotion Scheme/i)).toBeTruthy();
    expect(screen.getByText(/Grade Configuration/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Academic Defaults$/i }));
    expect(screen.getByText(/Default Academic Configuration/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Automation$/i }));
    expect(screen.getByText(/Promotion Automation Workflow/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Run Automation Now/i }));
    expect(screen.getByText(/Run Promotion Automation Pipeline/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Simulate Dry-Run/i }));
    await waitFor(() => {
      expect(screen.getByText(/Will Promote/i)).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /Execute Automation Workflow/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Run Promotion Automation Pipeline/i)).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Notifications$/i }));
    expect(screen.getByText(/Template Preview/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Access & Permissions$/i }));
    expect(screen.getByText(/Permission Matrix/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Audit & Logs$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Audit Log Records/i)).toBeTruthy();
    });
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

  it("renders empty Promotion Rules and Result Criteria states without seeded defaults when rules is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          overview: { ...mockOverviewData, rules: [] },
        }),
      }),
    );

    render(
      <StudentPromotionSuite
        mode="school"
        schoolId="school-1"
        grades={["Class V", "Class VI"]}
        academicYears={["2025-2026"]}
        sections={["A", "B"]}
        canPromote
        canManageSettings
        onOpenStudentProfile={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Promotion Readiness/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Promotion Rules$/i }));
    expect(screen.getByText(/No promotion rules configured yet/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^Result Criteria$/i }));
    expect(screen.getByText(/No result criteria configured yet/i)).toBeTruthy();
  });
});
