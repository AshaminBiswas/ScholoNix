import { beforeEach, describe, expect, it } from "vitest";
import { studentService } from "@/server/school/student-service";
import { parentService } from "@/server/school/parent-service";
import { resetInMemoryParentStoreForTests } from "@/server/school/parent-repository";
import { resetInMemoryStudentStoreForTests } from "@/server/school/student-repository";
import { sanitizeCsvCell } from "@/modules/parents/analytics";

describe("Parents & Guardians service, households, RBAC & tenant isolation", () => {
  const schoolA = "11111111-1111-4111-8111-ccccccccccc1";
  const schoolB = "22222222-2222-4222-8222-ddddddddddd2";

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

  const studentUserA = {
    userId: "user-student-a",
    userName: "Student A",
    role: "STUDENT",
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

  beforeEach(() => {
    resetInMemoryStudentStoreForTests();
    resetInMemoryParentStoreForTests();
  });

  it("auto-links siblings sharing guardian phone and enforces sole-primary unlink protection", async () => {
    const s1 = await studentService.createStudent(principalA, {
      studentName: "Demo Student One",
      academicYear: "2026-2027",
      grade: "Class IV",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Male",
      guardianName: "Rakesh Sample",
      guardianRelation: "Father",
      guardianPhone: "+91 9000011111",
      guardianEmail: "rakesh.sample@example.test",
    });

    const s2 = await studentService.createStudent(principalA, {
      studentName: "Demo Student Two",
      academicYear: "2026-2027",
      grade: "Class II",
      section: "B",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Female",
      guardianName: "Rakesh Sample",
      guardianRelation: "Father",
      guardianPhone: "+91 9000011111",
      guardianEmail: "rakesh.sample@example.test",
    });

    const dash = await parentService.getDashboardData(principalA);
    expect(dash.snapshot.guardians.length).toBe(1);
    const guardian = dash.snapshot.guardians[0]!;
    expect(guardian.wards.length).toBe(2);
    expect(dash.analytics.kpis.multiChildFamilies).toBe(1);

    // Prevent unlinking the sole primary guardian
    await expect(
      parentService.unlinkWard(principalA, guardian.id, s1.id),
    ).rejects.toThrow(/sole primary guardian/i);

    // Add secondary guardian and mark them primary for s1; then unlinking first succeeds
    const mother = await parentService.createGuardian(principalA, {
      fullName: "Meera Sample",
      phone: "+91 9000022222",
      preferredLanguage: "English",
      allowSharedPhone: false,
      wards: [
        {
          studentId: s1.id,
          relation: "Mother",
          isPrimary: true,
          isEmergencyContact: true,
          canPickup: true,
          isFeePayer: false,
          receivesAcademicAlerts: true,
          receivesFeeAlerts: true,
          restrictedContact: false,
        },
      ],
    });
    expect(mother.wards[0]?.isPrimary).toBe(true);

    const updatedFather = await parentService.unlinkWard(principalA, guardian.id, s1.id);
    expect(updatedFather.wards.filter((w) => w.isActive).map((w) => w.studentId)).toEqual([
      s2.id,
    ]);
  });

  it("enforces duplicate phone protection, supports merge, portal invite & communication logs", async () => {
    const stu = await studentService.createStudent(principalA, {
      studentName: "Demo Ward Merge",
      academicYear: "2026-2027",
      grade: "Class VI",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Male",
      guardianName: "Arun Test",
      guardianRelation: "Father",
      guardianPhone: "9811112222",
    });

    await expect(
      parentService.createGuardian(principalA, {
        fullName: "Duplicate Phone Contact",
        phone: "9811112222",
        preferredLanguage: "English",
        allowSharedPhone: false,
      }),
    ).rejects.toThrow(/already uses phone/i);

    const secondary = await parentService.createGuardian(principalA, {
      fullName: "Arun Duplicate Profile",
      phone: "9811112222",
      preferredLanguage: "English",
      allowSharedPhone: true,
      wards: [
        {
          studentId: stu.id,
          relation: "Guardian",
          isPrimary: false,
          isEmergencyContact: true,
          canPickup: true,
          isFeePayer: false,
          receivesAcademicAlerts: true,
          receivesFeeAlerts: true,
          restrictedContact: false,
        },
      ],
    });

    const beforeDash = await parentService.getDashboardData(principalA);
    const primary = beforeDash.snapshot.guardians.find((g) => g.id !== secondary.id)!;

    const merged = await parentService.mergeGuardians(principalA, {
      targetGuardianId: primary.id,
      sourceGuardianIds: [secondary.id],
    });
    expect(merged.mergedCount).toBe(1);

    const invite = await parentService.updatePortalAccess(principalA, [primary.id], "INVITE");
    expect(invite.updatedCount).toBe(1);

    const comm = await parentService.sendCommunication(principalA, {
      guardianIds: [primary.id],
      studentId: stu.id,
      channel: "SMS",
      subject: "Fee Receipt",
      body: "Monthly receipt generated.",
    });
    expect(comm.sentCount).toBe(1);

    const dossier = await parentService.getGuardianDossier(principalA, primary.id);
    expect(dossier.guardian.portalStatus).toBe("INVITED");
    expect(dossier.communications.length).toBe(1);
  });

  it("enforces strict tenant isolation and RBAC permissions", async () => {
    await studentService.createStudent(principalA, {
      studentName: "School A Student",
      academicYear: "2026-2027",
      grade: "Class I",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Female",
      guardianName: "School A Guardian",
      guardianRelation: "Mother",
      guardianPhone: "9822223333",
    });

    const dashA = await parentService.getDashboardData(principalA);
    const guardianAId = dashA.snapshot.guardians[0]!.id;

    // School B cannot view or mutate School A guardians
    const dashB = await parentService.getDashboardData(principalB);
    expect(dashB.snapshot.guardians.length).toBe(0);
    await expect(parentService.getGuardianDossier(principalB, guardianAId)).rejects.toThrow(
      /not found/i,
    );

    // Teacher can read/communicate but cannot write or manage portal
    const teacherView = await parentService.getDashboardData(teacherA);
    expect(teacherView.snapshot.guardians.length).toBe(1);
    await expect(
      parentService.createGuardian(teacherA, {
        fullName: "Blocked Create",
        phone: "9999900000",
        preferredLanguage: "English",
        allowSharedPhone: false,
      }),
    ).rejects.toThrow(/parents:write/i);
    await expect(
      parentService.updatePortalAccess(teacherA, [guardianAId], "INVITE"),
    ).rejects.toThrow(/parents:portal/i);

    // Student role cannot read guardians
    await expect(parentService.getDashboardData(studentUserA)).rejects.toThrow(/parents:read/i);

    // Parent role only sees own userId-linked guardian record
    const otherParentUser = {
      userId: "user-parent-other",
      userName: "Other Parent",
      role: "PARENT",
      schoolId: schoolA,
      schoolSlug: "school-a",
      schoolName: "School A",
    };
    const parentDash = await parentService.getDashboardData(otherParentUser);
    expect(parentDash.snapshot.guardians.length).toBe(0);
    await expect(parentService.getGuardianDossier(otherParentUser, guardianAId)).rejects.toThrow(
      /own guardian profile/i,
    );
  });

  it("escapes CSV formula injection vectors", () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe(`"'=CMD|' /C calc'!A0"`);
    expect(sanitizeCsvCell("+1234")).toBe(`"'+1234"`);
    expect(sanitizeCsvCell('Normal "Text"')).toBe(`"Normal ""Text"""`);
  });
});
