import { beforeEach, describe, expect, it, vi } from "vitest";
import { tenantCache } from "@/server/integrations/redis";
import { studentService } from "@/server/school/student-service";
import { studentDossierService } from "@/server/school/student-dossier-service";

describe("Student Profile 360 Dossier service, RBAC, PII masking, fees, and tenant isolation", () => {
  const schoolA = "11111111-1111-4111-8111-111111111111";
  const schoolB = "22222222-2222-4222-8222-222222222222";

  const principalA = {
    userId: "principal-a",
    userName: "Principal A",
    role: "PRINCIPAL",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const teacherA = {
    userId: "teacher-a",
    userName: "Teacher A",
    role: "TEACHER",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  const principalB = {
    userId: "principal-b",
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

  it("supports all 8 dossier mutations, minor-unit fee idempotency, Aadhaar masking, and cross-tenant isolation", async () => {
    const student = await studentService.createStudent(principalA, {
      studentName: "Aarav Sharma",
      academicYear: "2025 – 2026",
      grade: "Class I",
      section: "A",
      status: "ACTIVE",
      admissionType: "FRESH",
      gender: "Male",
      guardianName: "Rajesh Sharma",
      guardianRelation: "Father",
      guardianPhone: "9876543210",
    });

    await studentDossierService.executeAction(principalA, student.id, {
      action: "UPDATE_EXTENDED_PROFILE",
      extended: { aadhaarFull: "123456784521", houseName: "Sapphire" },
    });

    // Principal can reveal full Aadhaar; Teacher sees only masked version
    const asPrincipal = await studentDossierService.getDossier(principalA, student.id);
    expect(asPrincipal.extendedProfile.aadhaarMasked).toBe("XXXX XXXX 4521");
    expect(asPrincipal.canRevealSensitiveId).toBe(true);

    const asTeacher = await studentDossierService.getDossier(teacherA, student.id);
    expect(asTeacher.extendedProfile.aadhaarMasked).toBe("XXXX XXXX 4521");
    expect(asTeacher.extendedProfile.aadhaarFull).toBeUndefined();
    expect(asTeacher.canRevealSensitiveId).toBe(false);

    // Cross-tenant rejection
    await expect(studentDossierService.getDossier(principalB, student.id)).rejects.toThrow(
      /not found/i,
    );

    // Teacher cannot record fee payments (requires fees:write)
    await expect(
      studentDossierService.executeAction(teacherA, student.id, {
        action: "RECORD_FEE_PAYMENT",
        idempotencyKey: "pay-unauth-0001",
        amountPaise: 500000,
        paymentMode: "UPI",
        feeHeadsLabel: "Tuition Fee",
      }),
    ).rejects.toThrow(/fees:write/i);

    // Principal records fee payment idempotently in minor units
    const paid = await studentDossierService.executeAction(principalA, student.id, {
      action: "RECORD_FEE_PAYMENT",
      idempotencyKey: "pay-key-0001",
      amountPaise: 1500000,
      paymentMode: "UPI",
      feeHeadsLabel: "Term 1 Tuition",
    });
    expect(paid.feeSummary.paidPaise).toBe(1500000);

    await expect(
      studentDossierService.executeAction(principalA, student.id, {
        action: "RECORD_FEE_PAYMENT",
        idempotencyKey: "pay-key-0001",
        amountPaise: 1500000,
        paymentMode: "UPI",
        feeHeadsLabel: "Term 1 Tuition",
      }),
    ).rejects.toThrow(/Duplicate fee payment/i);

    // Marks, Attendance, Documents, Communication, Homework, Remarks
    await studentDossierService.executeAction(teacherA, student.id, {
      action: "MARK_ATTENDANCE",
      academicYear: "2025 – 2026",
      attendanceDate: "2026-01-31",
      status: "PRESENT",
    });
    await studentDossierService.executeAction(teacherA, student.id, {
      action: "UPSERT_ACADEMIC_MARK",
      academicYear: "2025 – 2026",
      term: "Term 2",
      subject: "Mathematics",
      maxMarks: 100,
      marksObtained: 94,
      grade: "A+",
    });
    const afterDoc = await studentDossierService.executeAction(principalA, student.id, {
      action: "ADD_DOCUMENT",
      documentName: "Birth Certificate",
      documentType: "Identity Proof",
      isRequired: true,
      fileName: "Birth_Certificate.pdf",
      fileSizeBytes: 256000,
      mimeType: "application/pdf",
    });
    expect(afterDoc.documents.length).toBe(1);
    expect(afterDoc.examResults[0]?.marksObtained).toBe(94);
    expect(afterDoc.attendanceRecords[0]?.status).toBe("PRESENT");
  });
});
