import { beforeEach, describe, expect, it, vi } from "vitest";
import { tenantCache } from "@/server/integrations/redis";
import {
  computeStudentAnalytics,
  filterAndSortStudents,
  normalizeGenderLabel,
  parseStudentFiltersFromUrl,
} from "@/modules/students/analytics";
import { studentService } from "@/server/school/student-service";
import {
  buildPlatformRouteUrl,
  parsePlatformSubSegments,
} from "@/modules/platform/routing";
import type { StudentRecord } from "@/modules/students/types";

function makeStudent(overrides: Partial<StudentRecord>): StudentRecord {
  const id = overrides.id ?? "stu-1";
  return {
    id,
    schoolId: overrides.schoolId ?? "11111111-1111-4111-8111-111111111111",
    applicationId: null,
    admissionNumber: overrides.admissionNumber ?? "ADM2025-0001",
    studentIdNumber: null,
    studentName: overrides.studentName ?? "Aarav Sharma",
    gender: overrides.gender ?? "Male",
    dateOfBirth: "2016-04-12",
    bloodGroup: "O+",
    nationality: "Indian",
    photoKey: null,
    email: null,
    phone: null,
    address: null,
    guardianName: "Rajesh Sharma",
    guardianRelation: "Father",
    guardianPhone: "9876543210",
    guardianEmail: "rajesh@example.test",
    guardianDetails: null,
    previousSchool: null,
    academicDetails: null,
    medicalNotes: null,
    admissionType: "NEW_ADMISSION",
    admissionDate: overrides.admissionDate ?? new Date().toISOString(),
    status: overrides.status ?? "ACTIVE",
    currentAcademicYear: overrides.currentAcademicYear ?? "2025 – 2026",
    currentGrade: overrides.currentGrade ?? "Class I",
    currentSection: overrides.currentSection ?? "A",
    currentRollNumber: "1",
    graduationYear: null,
    inactiveReason: null,
    groupIds: [],
    enrollments: [],
    transfers: overrides.transfers ?? [],
    feeSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Student analytics, RBAC, lifecycle, and tenant isolation", () => {
  const schoolA = "11111111-1111-4111-8111-111111111111";
  const schoolB = "22222222-2222-4222-8222-222222222222";

  const adminActorA = {
    userId: "admin-a",
    userName: "Principal A",
    role: "PRINCIPAL",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const teacherActorA = {
    userId: "teacher-a",
    userName: "Teacher A",
    role: "TEACHER",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const adminActorB = {
    userId: "admin-b",
    userName: "Principal B",
    role: "PRINCIPAL",
    schoolId: schoolB,
    schoolSlug: "school-b",
    schoolName: "School B",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    const store = new Map<string, unknown>();
    vi.spyOn(tenantCache, "get").mockImplementation(async (sid, key) => {
      return (store.get(`${sid}:${key}`) as never) ?? null;
    });
    vi.spyOn(tenantCache, "set").mockImplementation(async (sid, key, val) => {
      store.set(`${sid}:${key}`, val);
    });
    vi.spyOn(tenantCache, "del").mockImplementation(async (sid, key) => {
      store.delete(`${sid}:${key}`);
    });
  });

  it("computes accurate KPIs, gender normalization, sorting, and chart slices", () => {
    const students: StudentRecord[] = [
      makeStudent({ id: "1", admissionNumber: "ADM2025-001", studentName: "Aarav", gender: "M", currentGrade: "Class I", status: "ACTIVE" }),
      makeStudent({ id: "2", admissionNumber: "ADM2025-002", studentName: "Diya", gender: "Female", currentGrade: "Class I", status: "ACTIVE" }),
      makeStudent({ id: "3", admissionNumber: "ADM2025-003", studentName: "Kabir", gender: "Boy", currentGrade: "Class II", status: "INACTIVE" }),
      makeStudent({ id: "4", admissionNumber: "ADM2025-004", studentName: "Meera", gender: "Other", currentGrade: "Class XII", status: "ALUMNI" }),
      makeStudent({ id: "5", admissionNumber: "ADM2025-005", studentName: "Rohan", gender: "Male", currentGrade: "Class III", status: "TRANSFERRED" }),
    ];

    expect(normalizeGenderLabel("M")).toBe("Male");
    expect(normalizeGenderLabel("Girl")).toBe("Female");
    expect(normalizeGenderLabel("Non-binary")).toBe("Other");

    const analytics = computeStudentAnalytics(students, {}, ["Class I", "Class II", "Class III", "Class XII"]);
    expect(analytics.kpis.totalStudents).toBe(5);
    expect(analytics.kpis.activeStudents).toBe(2);
    expect(analytics.kpis.inactiveStudents).toBe(1);
    expect(analytics.kpis.transferredCount).toBe(1);
    expect(analytics.kpis.alumniCount).toBe(1);

    const genderCounts = Object.fromEntries(analytics.genderSlices.map((s) => [s.label, s.count]));
    expect(genderCounts.Boys).toBe(3);
    expect(genderCounts.Girls).toBe(1);
    expect(genderCounts.Other).toBe(1);

    const filtered = filterAndSortStudents(students, {
      status: "ACTIVE",
      sortBy: "studentName",
      sortDir: "asc",
    });
    expect(filtered.length).toBe(2);
    expect(filtered.map((s) => s.studentName)).toEqual(["Aarav", "Diya"]);

    const parsed = parseStudentFiltersFromUrl(
      new URL("https://example.test/api/school/students?grade=Class%20I&gender=Female&page=2"),
    );
    expect(parsed.grade).toBe("Class I");
    expect(parsed.gender).toBe("Female");
    expect(parsed.page).toBe(2);
  });

  it("enforces RBAC and strict cross-tenant isolation across create, promote, and transfer", async () => {
    await expect(
      studentService.createStudent(teacherActorA, {
        studentName: "Unauthorized Student",
        academicYear: "2025 – 2026",
        grade: "Class I",
        section: "A",
        status: "ACTIVE",
        admissionType: "FRESH",
        guardianName: "Guardian A",
        guardianRelation: "Father",
        guardianPhone: "9876543210",
      }),
    ).rejects.toThrow(/requires 'students:write' permission/i);

    const createdA = await studentService.createStudent(adminActorA, {
      studentName: "Riya Verma",
      academicYear: "2025 – 2026",
      grade: "Class IV",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Female",
      guardianName: "Suresh Verma",
      guardianRelation: "Father",
      guardianPhone: "9811112222",
    });
    expect(createdA.schoolId).toBe(schoolA);
    expect(createdA.currentGrade).toBe("Class IV");

    const dashboardB = await studentService.getDashboardData(adminActorB);
    expect(dashboardB.snapshot.students.some((s) => s.id === createdA.id)).toBe(false);

    const promoted = await studentService.promoteStudents(adminActorA, {
      studentIds: [createdA.id],
      toAcademicYear: "2026 – 2027",
      toGrade: "Class V",
      toSection: "B",
      markAsAlumni: false,
    });
    expect(promoted.promotedCount).toBe(1);

    const detailA = await studentService.getStudentDetail(adminActorA, createdA.id);
    expect(detailA.currentGrade).toBe("Class V");
    expect(detailA.currentSection).toBe("B");

    const transfer = await studentService.transferStudent(adminActorA, {
      studentId: createdA.id,
      transferType: "TRANSFER_OUT",
      transferDate: "2026-04-01",
      tcNumber: "TC-2026-88",
      counterpartySchool: "Modern Academy",
      reason: "Relocation",
      clearanceStatus: "CLEARED",
    });
    expect(transfer.tcNumber).toBe("TC-2026-88");

    const afterTransfer = await studentService.getStudentDetail(adminActorA, createdA.id);
    expect(afterTransfer.status).toBe("TRANSFERRED");
  });

  it("parses and builds /clients/students platform route cleanly", () => {
    const parsed = parsePlatformSubSegments(["clients", "students"]);
    expect(parsed.tab).toBe("students");
    expect(buildPlatformRouteUrl("/company-admin-pannel", {
      tab: "students",
      schoolId: null,
      schoolSubTab: "all",
      studentId: null,
    })).toBe("/company-admin-pannel/clients/students");
  });
});
