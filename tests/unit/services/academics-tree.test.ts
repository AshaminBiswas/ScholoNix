import { beforeEach, describe, expect, it } from "vitest";
import { studentService } from "@/server/school/student-service";
import { academicsService } from "@/server/school/academics-service";
import { resetInMemoryStudentStoreForTests } from "@/server/school/student-repository";
import { resetInMemoryParentStoreForTests } from "@/server/school/parent-repository";
import { resetInMemoryAcademicsStoreForTests } from "@/server/school/academics-repository";

describe("Academics Tree Explorer service, RBAC & tenant isolation", () => {
  const schoolA = "11111111-1111-4111-8111-eeeeeeeeeee1";
  const schoolB = "22222222-2222-4222-8222-fffffffffff2";

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
    resetInMemoryAcademicsStoreForTests();
  });

  it("builds full Class -> Subjects & Sections -> Students -> Parents hierarchy", async () => {
    await academicsService.mutate(principalA, {
      action: "CREATE_SESSION",
      name: "2026-2027",
      isCurrent: true,
      status: "ACTIVE",
    });

    const afterClass = await academicsService.mutate(principalA, {
      action: "CREATE_CLASS",
      academicYear: "2026-2027",
      name: "Class V",
      department: "Middle",
      displayOrder: 1,
      defaultSections: ["A", "B"],
    });

    const clsV = afterClass.classes.find((c) => c.name === "Class V")!;
    const mathSub = afterClass.subjects.find((s) => s.code === "MATH")!;

    await academicsService.mutate(principalA, {
      action: "ASSIGN_CLASS_SUBJECT",
      classId: clsV.id,
      className: clsV.name,
      subjectId: mathSub.id,
      academicYear: "2026-2027",
      teacherName: "Anjali Sharma",
      weeklyPeriods: 6,
      maxMarks: 100,
      passMarks: 35,
      isCompulsory: true,
    });

    await studentService.createStudent(principalA, {
      studentName: "Demo Pupil A",
      academicYear: "2026-2027",
      grade: "Class V",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Female",
      guardianName: "Kiran Demo",
      guardianRelation: "Mother",
      guardianPhone: "+91 9800001122",
      guardianEmail: "kiran.demo@example.test",
    });

    const snap = await academicsService.getWorkspace(principalA, "2026-2027");
    const node = snap.classes.find((c) => c.name === "Class V")!;
    expect(node.subjects.map((s) => s.subjectCode)).toContain("MATH");

    // Creating a subject with pre-selected classIds immediately maps it to that class
    const afterDirectSubject = await academicsService.mutate(principalA, {
      action: "CREATE_SUBJECT",
      code: "PHY",
      name: "Physics",
      category: "CORE",
      defaultMaxMarks: 100,
      defaultPassMarks: 35,
      academicYear: "2026-2027",
      classIds: [clsV.id],
      classNames: [clsV.name],
    });
    const clsVUpdated = afterDirectSubject.classes.find((c) => c.id === clsV.id)!;
    expect(clsVUpdated.subjects.map((s) => s.subjectCode)).toContain("PHY");

    const secA = node.sections.find((s) => s.name === "A")!;
    expect(secA.students.length).toBe(1);
    expect(secA.students[0]?.studentName).toBe("Demo Pupil A");
    expect(secA.students[0]?.guardians[0]?.fullName).toBe("Kiran Demo");
    expect(snap.kpis.totalLinkedGuardians).toBe(1);
  });

  it("enforces duplicate section protection, RBAC, and tenant isolation", async () => {
    const snapA = await academicsService.mutate(principalA, {
      action: "CREATE_CLASS",
      academicYear: "2026-2027",
      name: "IB Diploma Grade 11",
      department: "Senior Secondary",
      displayOrder: 1,
      defaultSections: ["A"],
    });
    const customCls = snapA.classes.find((c) => c.name === "IB Diploma Grade 11")!;

    await expect(
      academicsService.mutate(principalA, {
        action: "CREATE_SECTION",
        classId: customCls.id,
        className: customCls.name,
        academicYear: "2026-2027",
        name: "A",
        capacity: 40,
      }),
    ).rejects.toThrow(/already exists/i);

    // Tenant isolation: School B does not see School A's custom class
    const snapB = await academicsService.getWorkspace(principalB, "2026-2027");
    expect(snapB.classes.some((c) => c.name === "IB Diploma Grade 11")).toBe(false);

    // Teacher can read academics, cannot mutate
    const teacherRead = await academicsService.getWorkspace(teacherA, "2026-2027");
    expect(teacherRead.classes.length).toBeGreaterThan(0);
    await expect(
      academicsService.mutate(teacherA, {
        action: "CREATE_SUBJECT",
        code: "BIO",
        name: "Biology",
        category: "CORE",
        defaultMaxMarks: 100,
        defaultPassMarks: 33,
      }),
    ).rejects.toThrow(/academics:write/i);

    // Student cannot read academics management workspace
    await expect(academicsService.getWorkspace(studentUserA)).rejects.toThrow(/academics:read/i);
  });
});
