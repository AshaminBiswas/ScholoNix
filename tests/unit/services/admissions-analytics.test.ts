import { describe, expect, it } from "vitest";
import {
  buildAdmissionsCsv,
  computeAdmissionsOverviewAnalytics,
  escapeCsvCell,
} from "@/server/school/admissions-analytics";
import {
  DEFAULT_ADMISSION_GRADES,
  DEFAULT_DOCUMENT_CHECKLIST,
  type AdmissionApplicationRecord,
  type AdmissionEnquiryRecord,
  type AdmissionSettingRecord,
} from "@/modules/school/admissions/types";

describe("Admissions Analytics & CSV Export Integrity", () => {
  const schoolId = "11111111-1111-1111-1111-111111111111";
  const otherSchoolId = "22222222-2222-2222-2222-222222222222";
  const baseSettings: AdmissionSettingRecord = {
    schoolId,
    currentAcademicYear: "2026 – 2027",
    applicationDeadline: "2026-05-31T18:29:59.000Z",
    applicationPrefix: "APP",
    enabledGrades: [...DEFAULT_ADMISSION_GRADES],
    updatedAt: "2026-04-01T00:00:00.000Z",
  };

  const baseFilters = {
    academicYear: "2026 – 2027",
    grade: "all",
    status: "all" as const,
    verificationStatus: "all" as const,
    datePreset: "all" as const,
    from: "",
    to: "",
    granularity: "month" as const,
    search: "",
    page: 1,
    pageSize: 10,
  };

  it("returns exact zeros and empty datasets when a school has no admission data", () => {
    const overview = computeAdmissionsOverviewAnalytics({
      schoolId,
      filters: baseFilters,
      allApplications: [],
      allEnquiries: [],
      customReminders: [],
      activities: [],
      settings: { ...baseSettings, applicationDeadline: null },
      permissions: { canWrite: true, canVerify: true, canExport: true, canManageSettings: true },
    });

    expect(overview.kpis.totalApplications.value).toBe(0);
    expect(overview.kpis.shortlisted.value).toBe(0);
    expect(overview.kpis.admitted.value).toBe(0);
    expect(overview.kpis.conversionRate.rate).toBe(0);
    expect(overview.funnel.enquiries).toBe(0);
    expect(overview.funnel.applications).toBe(0);
    expect(overview.trend).toEqual([]);
    expect(overview.byGrade).toEqual([]);
    expect(overview.applications).toEqual([]);
    expect(overview.reminders).toEqual([]);
    expect(overview.statusBreakdown.reduce((acc, s) => acc + s.count, 0)).toBe(0);
  });

  it("enforces tenant isolation, accurate status sums, and funnel/conversion calculations", () => {
    const mkApp = (
      id: string,
      sid: string,
      status: AdmissionApplicationRecord["status"],
      gradeApplied: string,
    ): AdmissionApplicationRecord => ({
      id,
      schoolId: sid,
      applicationCode: `APP2026-${id}`,
      admissionNumber: status === "ADMITTED" ? `ADM2026-${id}` : null,
      enquiryId: null,
      studentName: `Student ${id}`,
      gender: "Female",
      dateOfBirth: "2019-03-15",
      gradeApplied,
      academicYear: "2026 – 2027",
      guardianName: `Guardian ${id}`,
      guardianRelation: "Parent",
      guardianPhone: "+919000000000",
      guardianEmail: null,
      previousSchool: null,
      status,
      verificationStatus: status === "DOCUMENTS_PENDING" ? "PENDING" : "VERIFIED",
      verificationNotes: null,
      documentsChecklist: DEFAULT_DOCUMENT_CHECKLIST,
      appliedAt: "2026-04-12T10:00:00.000Z",
      shortlistedAt: null,
      admittedAt: null,
      rejectedAt: null,
      verifiedAt: null,
      createdAt: "2026-04-12T10:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
    });

    const enquiries: AdmissionEnquiryRecord[] = [
      {
        id: "e1",
        schoolId,
        enquiryCode: "ENQ2026-0001",
        studentName: "Lead A",
        guardianName: "Parent A",
        guardianPhone: "+919000000011",
        guardianEmail: null,
        gradeApplied: "Class I",
        academicYear: "2026 – 2027",
        source: "Website",
        status: "CONVERTED",
        notes: null,
        convertedApplicationId: "a1",
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
      {
        id: "e-other",
        schoolId: otherSchoolId,
        enquiryCode: "ENQ2026-9999",
        studentName: "Other School Lead",
        guardianName: "Other Guardian",
        guardianPhone: "+919000000099",
        guardianEmail: null,
        gradeApplied: "Class I",
        academicYear: "2026 – 2027",
        source: "Walk-In",
        status: "NEW",
        notes: null,
        convertedApplicationId: null,
        createdAt: "2026-04-10T10:00:00.000Z",
        updatedAt: "2026-04-10T10:00:00.000Z",
      },
    ];

    const overview = computeAdmissionsOverviewAnalytics({
      schoolId,
      filters: baseFilters,
      allApplications: [
        mkApp("1", schoolId, "ADMITTED", "Class I"),
        mkApp("2", schoolId, "SHORTLISTED", "Class I"),
        mkApp("3", schoolId, "DOCUMENTS_PENDING", "Nursery"),
        mkApp("4", schoolId, "REJECTED", "Nursery"),
        mkApp("other", otherSchoolId, "ADMITTED", "Class I"),
      ],
      allEnquiries: enquiries,
      customReminders: [],
      activities: [],
      settings: baseSettings,
      permissions: { canWrite: true, canVerify: true, canExport: true, canManageSettings: true },
    });

    // Cross-tenant rows excluded completely
    expect(overview.kpis.totalApplications.value).toBe(4);
    expect(overview.kpis.shortlisted.value).toBe(1);
    expect(overview.kpis.admitted.value).toBe(1);
    expect(overview.kpis.conversionRate.rate).toBe(25);
    expect(overview.funnel.enquiries).toBe(1);
    expect(overview.funnel.shortlistedPipeline).toBe(2); // SHORTLISTED + ADMITTED
    expect(overview.statusBreakdown.reduce((acc, s) => acc + s.count, 0)).toBe(4);
    expect(overview.reminders.some((r) => r.title.includes("pending document verification"))).toBe(
      true,
    );
  });

  it("neutralizes spreadsheet formula injection in CSV exports", () => {
    expect(escapeCsvCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(escapeCsvCell("+1234")).toBe("'+1234");
    expect(escapeCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');

    const csv = buildAdmissionsCsv([
      {
        id: "1",
        schoolId,
        applicationCode: "APP2026-0001",
        admissionNumber: null,
        enquiryId: null,
        studentName: "=HYPERLINK(\"http://evil.example\")",
        gender: "Male",
        dateOfBirth: null,
        gradeApplied: "Class I",
        academicYear: "2026 – 2027",
        guardianName: "Synthetic Parent",
        guardianRelation: "Parent",
        guardianPhone: "+919000000001",
        guardianEmail: "parent@scholonix.example",
        previousSchool: null,
        status: "UNDER_REVIEW",
        verificationStatus: "PENDING",
        verificationNotes: null,
        documentsChecklist: DEFAULT_DOCUMENT_CHECKLIST,
        appliedAt: "2026-04-12T10:00:00.000Z",
        shortlistedAt: null,
        admittedAt: null,
        rejectedAt: null,
        verifiedAt: null,
        createdAt: "2026-04-12T10:00:00.000Z",
        updatedAt: "2026-04-12T10:00:00.000Z",
      },
    ]);
    expect(csv).toContain("\"'=HYPERLINK(\"\"http://evil.example\"\")\"");
  });
});
