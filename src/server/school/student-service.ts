import "server-only";
import { authorize } from "@/server/authorization/permissions";
import { logAuditEvent } from "@/server/security/audit-logger";
import { logger } from "@/lib/logger";
import { computeStudentAnalytics, filterAndSortStudents } from "@/modules/students/analytics";
import type {
  StudentDashboardAnalytics,
  StudentFilterParams,
  StudentRecord,
  StudentWorkspaceSnapshot,
} from "@/modules/students/types";
import type {
  BulkStudentsActionInput,
  CreateStudentGroupInput,
  CreateStudentInput,
  PromoteStudentsInput,
  TransferStudentInput,
  UpdateStudentInput,
  UpdateStudentSettingsInput,
} from "@/modules/students/schemas";
import { studentRepository } from "./student-repository";

export interface StudentActorContext {
  userId: string;
  userName: string;
  role: string;
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  ipAddress?: string;
  userAgent?: string;
}

function isPlatformRole(role: string): boolean {
  return (
    role === "PLATFORM_SUPER_ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "OPERATIONS" ||
    role === "BILLING_MANAGER" ||
    role === "SUPPORT_AGENT"
  );
}

export const studentService = {
  async getDashboardData(
    actor: StudentActorContext,
    filters?: StudentFilterParams,
  ): Promise<{
    snapshot: StudentWorkspaceSnapshot;
    analytics: StudentDashboardAnalytics;
    filteredStudents: StudentRecord[];
  }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:read",
    );
    const asPlatformAdmin = isPlatformRole(actor.role);
    const snapshot = await studentRepository.getSnapshot(actor.schoolId, { asPlatformAdmin });
    const analytics = computeStudentAnalytics(snapshot.students, filters, snapshot.grades);
    const filteredStudents = filterAndSortStudents(snapshot.students, filters);

    logger.info(
      {
        schoolId: actor.schoolId,
        actorId: actor.userId,
        totalStudents: snapshot.students.length,
      },
      "Student dashboard data loaded",
    );

    return { snapshot, analytics, filteredStudents };
  },

  async getStudentDetail(actor: StudentActorContext, studentId: string): Promise<StudentRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:read",
    );
    return studentRepository.getStudentById(actor.schoolId, studentId, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
  },

  async createStudent(actor: StudentActorContext, input: CreateStudentInput): Promise<StudentRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:write",
    );
    const created = await studentRepository.createStudent(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: created.id,
      details: {
        admissionNumber: created.admissionNumber,
        grade: created.currentGrade,
        section: created.currentSection,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return created;
  },

  async updateStudent(
    actor: StudentActorContext,
    studentId: string,
    input: UpdateStudentInput,
  ): Promise<StudentRecord> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:write",
    );
    const updated = await studentRepository.updateStudent(
      actor.schoolId,
      studentId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "STUDENT_UPDATED",
      entityType: "Student",
      entityId: updated.id,
      details: { fields: Object.keys(input), status: updated.status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return updated;
  },

  async promoteStudents(
    actor: StudentActorContext,
    input: PromoteStudentsInput,
  ): Promise<{ promotedCount: number }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:promote",
    );
    const res = await studentRepository.promoteStudents(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: input.markAsAlumni ? "STUDENTS_GRADUATED" : "STUDENTS_PROMOTED",
      entityType: "StudentEnrollment",
      entityId: input.toAcademicYear,
      details: {
        count: res.promotedCount,
        toGrade: input.toGrade,
        toSection: input.toSection,
        markAsAlumni: input.markAsAlumni,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return res;
  },

  async transferStudent(actor: StudentActorContext, input: TransferStudentInput) {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:transfer",
    );
    const transfer = await studentRepository.transferStudent(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: input.transferType,
      entityType: "StudentTransfer",
      entityId: transfer.id,
      details: { studentId: input.studentId, tcNumber: transfer.tcNumber },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return transfer;
  },

  async bulkUpdateStudents(actor: StudentActorContext, input: BulkStudentsActionInput) {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:write",
    );
    const res = await studentRepository.bulkUpdateStudents(
      actor.schoolId,
      { userId: actor.userId, userName: actor.userName },
      input,
      { asPlatformAdmin: isPlatformRole(actor.role) },
    );
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: `STUDENTS_BULK_${input.action}`,
      entityType: "Student",
      entityId: actor.schoolId,
      details: { count: res.updatedCount },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return res;
  },

  async createGroup(actor: StudentActorContext, input: CreateStudentGroupInput) {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:write",
    );
    return studentRepository.createGroup(actor.schoolId, input, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
  },

  async updateSettings(actor: StudentActorContext, input: UpdateStudentSettingsInput) {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:settings",
    );
    const settings = await studentRepository.updateSettings(actor.schoolId, input, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "STUDENT_SETTINGS_UPDATED",
      entityType: "StudentSetting",
      entityId: actor.schoolId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return settings;
  },

  async importStudents(actor: StudentActorContext, rows: CreateStudentInput[]) {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:write",
    );
    const imported: StudentRecord[] = [];
    for (const row of rows) {
      const stu = await studentRepository.createStudent(
        actor.schoolId,
        { userId: actor.userId, userName: actor.userName },
        row,
        { asPlatformAdmin: isPlatformRole(actor.role) },
      );
      imported.push(stu);
    }
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "STUDENTS_BULK_IMPORTED",
      entityType: "Student",
      entityId: actor.schoolId,
      details: { count: imported.length },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return { importedCount: imported.length, students: imported };
  },

  async exportStudentsCsv(
    actor: StudentActorContext,
    filters?: StudentFilterParams,
  ): Promise<{ filename: string; csv: string }> {
    authorize(
      { id: actor.userId, role: actor.role, schoolId: actor.schoolId },
      "students:export",
    );
    const snapshot = await studentRepository.getSnapshot(actor.schoolId, {
      asPlatformAdmin: isPlatformRole(actor.role),
    });
    const rows = filterAndSortStudents(snapshot.students, filters);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    };
    const header = [
      "Admission No",
      "Student Name",
      "Grade",
      "Section",
      "Roll No",
      "Academic Year",
      "Gender",
      "DOB",
      "Blood Group",
      "Admission Date",
      "Status",
      "Guardian Name",
      "Guardian Relation",
      "Guardian Phone",
      "Guardian Email",
    ];
    const lines = [
      header.map(esc).join(","),
      ...rows.map((s) =>
        [
          s.admissionNumber,
          s.studentName,
          s.currentGrade,
          s.currentSection,
          s.currentRollNumber || "",
          s.currentAcademicYear,
          s.gender || "",
          s.dateOfBirth || "",
          s.bloodGroup || "",
          s.admissionDate.slice(0, 10),
          s.status,
          s.guardianName,
          s.guardianRelation,
          s.guardianPhone,
          s.guardianEmail || "",
        ]
          .map(esc)
          .join(","),
      ),
    ];
    await logAuditEvent({
      schoolId: actor.schoolId,
      actorId: actor.userId,
      action: "STUDENTS_EXPORTED_CSV",
      entityType: "Student",
      entityId: actor.schoolId,
      details: { count: rows.length },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return {
      filename: `${actor.schoolSlug}-students-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: lines.join("\n"),
    };
  },
};
