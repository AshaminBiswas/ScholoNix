import { describe, expect, it, vi } from "vitest";
import { studentService } from "@/server/school/student-service";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { studentPromotionRepository } from "@/server/school/student-promotion-repository";
import {
  buildPlatformRouteUrl,
  parsePlatformSubSegments,
} from "@/modules/platform/routing";

describe("Student Promotion Suite service, performance, caching, RBAC & routing", () => {
  const schoolA = "11111111-1111-4111-8111-aaaaaaaaaaa1";
  const schoolB = "22222222-2222-4222-8222-bbbbbbbbbbb2";

  const principalA = {
    userId: "user-principal-a",
    userName: "Principal A",
    role: "PRINCIPAL",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const teacherA = {
    userId: "user-teacher-a",
    userName: "Teacher A",
    role: "TEACHER",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const principalB = {
    userId: "user-principal-b",
    userName: "Principal B",
    role: "PRINCIPAL",
    schoolId: schoolB,
    schoolSlug: "school-b",
    schoolName: "School B",
  };

  const platformAdminA = {
    userId: "platform-admin-1",
    userName: "Platform Super Admin",
    role: "PLATFORM_SUPER_ADMIN",
    schoolId: schoolA,
  };

  it("enforces RBAC so teachers cannot promote or modify promotion rules", async () => {
    const stu = await studentService.createStudent(principalA, {
      studentName: "Kabir Rao",
      academicYear: "2025-2026",
      grade: "Class V",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Male",
      guardianName: "Vikram Rao",
      guardianRelation: "Father",
      guardianPhone: "9810001001",
    });

    await expect(
      studentPromotionService.executeBatch(teacherA, {
        studentIds: [stu.id],
        academicYear: "2025-2026",
        toAcademicYear: "2026-2027",
        toGrade: "Class VI",
        toSection: "A",
        decision: "PROMOTE",
        dryRun: false,
      }),
    ).rejects.toThrow();

    await expect(
      studentPromotionService.saveRulesAndSettings(teacherA, {
        academicYear: "2025-2026",
        settings: { minResultPct: 40 },
      }),
    ).rejects.toThrow();
  });

  it("executes 500-student promotion batch via O(1) path, preserves tenant isolation, and handles dryRun + alumni", async () => {
    const createdIds: string[] = [];
    for (let i = 0; i < 500; i += 1) {
      const stu = await studentService.createStudent(principalA, {
        studentName: `Student Batch ${i + 1}`,
        academicYear: "2025-2026",
        grade: "Class V",
        section: i % 2 === 0 ? "A" : "B",
        status: "ACTIVE",
        admissionType: "FRESH",
        gender: i % 2 === 0 ? "Male" : "Female",
        guardianName: `Parent ${i + 1}`,
        guardianRelation: "Father",
        guardianPhone: `980000${String(i).padStart(4, "0")}`,
      });
      createdIds.push(stu.id);
    }

    // Dry-run first: zero state mutation
    const dryRunRes = await studentPromotionService.executeBatch(principalA, {
      studentIds: createdIds.slice(0, 100),
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      toGrade: "Class VI",
      toSection: "A",
      decision: "PROMOTE",
      dryRun: true,
    });
    expect(dryRunRes.dryRun).toBe(true);
    expect(dryRunRes.promotedCount).toBe(100);

    const stillBefore = await studentService.getStudentDetail(principalA, createdIds[0]!);
    expect(stillBefore.currentGrade).toBe("Class V");

    // Actual 490 promoted + 5 retained + 5 alumni batch
    const t0 = performance.now();
    const promoteRes = await studentPromotionService.executeBatch(principalA, {
      studentIds: createdIds.slice(0, 490),
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      toGrade: "Class VI",
      toSection: "A",
      decision: "PROMOTE",
      dryRun: false,
      remarks: "Annual progression batch",
    });
    const retainRes = await studentPromotionService.executeBatch(principalA, {
      studentIds: createdIds.slice(490, 495),
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      toGrade: "Class V",
      toSection: "A",
      decision: "RETAIN",
      dryRun: false,
    });
    const alumniRes = await studentPromotionService.executeBatch(principalA, {
      studentIds: createdIds.slice(495, 500),
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      toGrade: "Alumni",
      toSection: "A",
      decision: "ALUMNI",
      dryRun: false,
    });
    const elapsedMs = performance.now() - t0;

    expect(promoteRes.promotedCount).toBe(490);
    expect(retainRes.retainedCount).toBe(5);
    expect(alumniRes.alumniCount).toBe(5);
    expect(elapsedMs).toBeLessThan(2000);

    // Tenant isolation check: schoolB cannot see schoolA students or batches, and starts with 0 default rules
    const overviewB = await studentPromotionService.getOverview(principalB);
    expect(overviewB.decisions.some((d) => createdIds.includes(d.studentId))).toBe(false);
    expect(overviewB.rules).toHaveLength(0);

    // Platform Admin can inspect schoolA batches and rules cleanly
    const overviewA = await studentPromotionService.getOverview(platformAdminA);
    expect(overviewA.batches.length).toBeGreaterThanOrEqual(3);
    expect(overviewA.kpis.promotedCount).toBeGreaterThanOrEqual(490);
  });

  it("caches overview reads and invalidates version cleanly after rules update", async () => {
    const spy = vi.spyOn(studentPromotionRepository, "getOverview");
    await studentPromotionService.getOverview(principalA, { academicYear: "2025-2026" });
    await studentPromotionService.saveRulesAndSettings(principalA, {
      academicYear: "2025-2026",
      rules: [
        {
          ruleName: "Class V Custom Rule",
          fromGrade: "Class V",
          toGrade: "Class VI",
          markAsAlumni: false,
          defaultSectionMode: "KEEP_SAME",
          targetSection: null,
          minResultPct: 40,
          minAttendancePct: 75,
          maxFailedSubjects: 1,
          criteriaSummary: "Min 40% in all subjects",
          requireAssessmentsCompleted: true,
          requireResultPublished: true,
          requireFeeClearance: true,
          gradeCriteria: [
            { grade: "A", minPct: 80, maxPct: 100, resultLabel: "Distinction", promote: true },
            { grade: "F", minPct: 0, maxPct: 39, resultLabel: "Fail", promote: false },
          ],
          isActive: true,
        },
      ],
      settings: {
        finalGradeForAlumni: "Class XII",
        autoAssignRollNumbers: true,
        minResultPct: 40,
        minAttendancePct: 75,
        lockPromotionAfterPublish: false,
        notifyParentsOnPromotion: true,
        requirePendingFeeClearance: false,
      },
      settingsSuite: {
        general: {
          moduleEnabled: true,
          allowClassPromotion: true,
          allowBulkPromotion: true,
          allowRePromotion: false,
          requireMandatoryConditions: true,
          defaultPromotionType: "GRADE_BASED",
          overallPassPct: 45,
          minSubjectPassPct: 33,
          considerAllSubjects: true,
          enforceAttendance: true,
          minAttendancePct: 75,
          enforceFeeClearance: true,
          enforceAssessmentCompletion: true,
          includeCoScholastic: true,
          checkDisciplinaryClearance: false,
          autoPromotionEnabled: true,
          notifyClassTeacher: true,
          notifyParents: true,
          notifyStudentInApp: false,
          sendSummaryReport: true,
        },
      },
    });
    const updated = await studentPromotionService.getOverview(principalA, {
      academicYear: "2025-2026",
    });
    expect(spy).toHaveBeenCalledTimes(2);
    const savedRule = updated.rules.find((r) => r.fromGrade === "Class V");
    expect(savedRule?.minResultPct).toBe(40);
    expect(savedRule?.ruleName).toBe("Class V Custom Rule");
    expect(savedRule?.requireFeeClearance).toBe(true);
    expect(savedRule?.gradeCriteria).toHaveLength(2);
    expect(updated.settings.minResultPct).toBe(40);
    expect(updated.settingsSuite.general.allowRePromotion).toBe(false);
    expect(updated.settingsSuite.general.enforceFeeClearance).toBe(true);

    // Audit log check + schoolB tenant isolation
    const auditLogsA = await studentPromotionService.getAuditLogs(principalA, { page: 1, pageSize: 10 });
    expect(auditLogsA.totalLogs).toBeGreaterThanOrEqual(1);
    const auditLogsB = await studentPromotionService.getAuditLogs(principalB, { page: 1, pageSize: 10 });
    expect(auditLogsB.totalLogs).toBe(0);
    spy.mockRestore();
  });

  it("evaluates dry-run and executes the 5-step promotion automation pipeline with RBAC enforcement", async () => {
    const stuAuto = await studentService.createStudent(principalA, {
      studentName: "Meera Nair",
      academicYear: "2025-2026",
      grade: "Class V",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Female",
      guardianName: "Suresh Nair",
      guardianRelation: "Father",
      guardianPhone: "9812345678",
    });

    await expect(
      studentPromotionService.runAutomation(teacherA, {
        academicYear: "2025-2026",
        toAcademicYear: "2026-2027",
        dryRun: true,
      }),
    ).rejects.toThrow();

    const sim = await studentPromotionService.runAutomation(principalA, {
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      dryRun: true,
    });
    expect(sim.dryRun).toBe(true);
    expect(sim.evaluatedCount).toBeGreaterThanOrEqual(1);
    expect(sim.stepsExecuted).toBe(5);

    const exec = await studentPromotionService.runAutomation(principalA, {
      academicYear: "2025-2026",
      toAcademicYear: "2026-2027",
      dryRun: false,
    });
    expect(exec.dryRun).toBe(false);
    expect(exec.promotedCount).toBeGreaterThanOrEqual(1);

    const updatedStu = await studentService.getStudentDetail(principalA, stuAuto.id);
    expect(updatedStu.currentGrade).toBe("Class VI");

    const autoLogs = await studentPromotionService.getAuditLogs(principalA, {
      module: "Automation",
      page: 1,
      pageSize: 10,
    });
    expect(autoLogs.logs.some((l) => l.module === "Automation" && l.action === "Run")).toBe(true);
  });

  it("parses and builds /clients/promotions and /clients/schools/:id/promotions URLs", () => {
    const globalRoute = parsePlatformSubSegments(["clients", "promotions"]);
    expect(globalRoute.tab).toBe("promotions");
    expect(
      buildPlatformRouteUrl("/admin", {
        tab: "promotions",
        schoolId: null,
        schoolSubTab: "all",
        studentId: null,
      }),
    ).toBe("/admin/clients/promotions");

    const schoolPromoRoute = parsePlatformSubSegments([
      "clients",
      "schools",
      schoolA,
      "promotions",
    ]);
    expect(schoolPromoRoute.tab).toBe("schools");
    expect(schoolPromoRoute.schoolId).toBe(schoolA);
    expect(schoolPromoRoute.schoolSubTab).toBe("promotions");
    expect(buildPlatformRouteUrl("/admin", schoolPromoRoute)).toBe(
      `/admin/clients/schools/${schoolA}/promotions`,
    );
  });
});
