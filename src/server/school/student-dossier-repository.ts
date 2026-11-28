/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { authRepository } from "@/server/auth/auth-repository";
import { studentRepository } from "@/server/school/student-repository";
import { tenantCache } from "@/server/integrations/redis";
import { platformCache } from "@/server/platform/platform-cache";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type {
  StudentAttendanceItem,
  StudentCoCurricularItem,
  StudentCommunicationItem,
  StudentDocumentItem,
  StudentDossier360Data,
  StudentExamResultItem,
  StudentExtendedProfile,
  StudentFeePaymentRecord,
  StudentHomeworkItemRecord,
  StudentNoteRemarkItem,
} from "@/modules/students/dossier-types";
import type { StudentDossierActionInput } from "@/modules/students/dossier-schemas";

const TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };
const DOSSIER_CACHE_PREFIX = "students:dossier:v1:";

interface MemoryDossierBag {
  extended: Record<string, StudentExtendedProfile>;
  attendance: Record<string, StudentAttendanceItem[]>;
  exams: Record<string, StudentExamResultItem[]>;
  documents: Record<string, StudentDocumentItem[]>;
  communications: Record<string, StudentCommunicationItem[]>;
  homework: Record<string, StudentHomeworkItemRecord[]>;
  cocurricular: Record<string, StudentCoCurricularItem[]>;
  notes: Record<string, StudentNoteRemarkItem[]>;
  payments: Record<string, StudentFeePaymentRecord[]>;
  seenIdempotencyKeys: Record<string, boolean>;
}

const globalForDossier = globalThis as unknown as {
  __scholonixDossierMemory?: Record<string, MemoryDossierBag>;
  __scholonixDossierCaps?: { hasTables: boolean; checkedAt: number };
};

function getMemoryBag(schoolId: string): MemoryDossierBag {
  if (!globalForDossier.__scholonixDossierMemory) {
    globalForDossier.__scholonixDossierMemory = {};
  }
  if (!globalForDossier.__scholonixDossierMemory[schoolId]) {
    globalForDossier.__scholonixDossierMemory[schoolId] = {
      extended: {},
      attendance: {},
      exams: {},
      documents: {},
      communications: {},
      homework: {},
      cocurricular: {},
      notes: {},
      payments: {},
      seenIdempotencyKeys: {},
    };
  }
  return globalForDossier.__scholonixDossierMemory[schoolId]!;
}

function maskAadhaarNumber(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return `XXXX XXXX ${digits.slice(-4)}`;
}

async function hasProfile360Tables(tx: Prisma.TransactionClient): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return false;
  if (!(await authRepository.canUsePrismaForPlatform())) return false;
  const cached = globalForDossier.__scholonixDossierCaps;
  if (cached && Date.now() - cached.checkedAt < 60_000) {
    return cached.hasTables;
  }
  try {
    const rows = (await tx.$queryRaw`
      SELECT to_regclass('public.student_attendance_records') IS NOT NULL AS ok
    `) as Array<{ ok?: boolean }>;
    const ok = Boolean(rows[0]?.ok);
    globalForDossier.__scholonixDossierCaps = { hasTables: ok, checkedAt: Date.now() };
    return ok;
  } catch {
    return false;
  }
}

export class StudentDossierRepository extends BaseTenantRepository {
  private async runTx<T>(
    schoolId: string,
    asPlatformAdmin: boolean,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return db.$transaction(async (tx) => {
      if (asPlatformAdmin) {
        await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
      } else {
        await tx.$queryRaw`SELECT set_config('app.current_school_id', ${schoolId}, true)`;
      }
      return fn(tx);
    }, TX_OPTIONS);
  }

  private async invalidateDossier(schoolId: string, studentId: string): Promise<void> {
    await Promise.all([
      tenantCache.del(schoolId, `${DOSSIER_CACHE_PREFIX}${studentId}`),
      tenantCache.del(schoolId, "students:snapshot:v1"),
      platformCache.invalidateSchool(schoolId),
    ]);
  }

  private buildFeeSummary(
    baseFee: { totalFeePaise: number; paidPaise: number; outstandingPaise: number } | null | undefined,
    ext: StudentExtendedProfile,
    payments: StudentFeePaymentRecord[],
  ): StudentDossier360Data["feeSummary"] {
    const heads =
      ext.feeHeads && ext.feeHeads.length > 0
        ? ext.feeHeads
        : [
            { head: "Tuition Fee", frequency: "Monthly", amountPaise: 2500000 },
            { head: "Development Fee", frequency: "Annually", amountPaise: 1000000 },
            { head: "Activity & Exam Fee", frequency: "Annually", amountPaise: 900000 },
            { head: "ICT & Library Fee", frequency: "Annually", amountPaise: 600000 },
          ];
    const defaultTotal = heads.reduce((acc, h) => acc + h.amountPaise, 0);
    const totalFeePaise = baseFee?.totalFeePaise ?? defaultTotal;
    const paidFromPayments = payments.reduce((acc, p) => acc + p.amountPaise, 0);
    const paidPaise = Math.max(baseFee?.paidPaise ?? 0, paidFromPayments);
    const outstandingPaise = Math.max(0, totalFeePaise - paidPaise);
    const status: "PAID" | "PARTIALLY_PAID" | "PENDING" =
      outstandingPaise === 0 ? "PAID" : paidPaise > 0 ? "PARTIALLY_PAID" : "PENDING";

    const installments =
      ext.feeInstallments && ext.feeInstallments.length > 0
        ? ext.feeInstallments
        : [
            {
              installment: "Term 1",
              dueDate: "10 Apr 2025",
              amountPaise: Math.round(totalFeePaise * 0.3),
              status: (paidPaise >= Math.round(totalFeePaise * 0.3) ? "PAID" : "PENDING") as "PAID" | "PENDING",
            },
            {
              installment: "Term 2",
              dueDate: "10 Aug 2025",
              amountPaise: Math.round(totalFeePaise * 0.25),
              status: (paidPaise >= Math.round(totalFeePaise * 0.55) ? "PAID" : "PENDING") as "PAID" | "PENDING",
            },
            {
              installment: "Term 3",
              dueDate: "10 Dec 2025",
              amountPaise: Math.round(totalFeePaise * 0.25),
              status: (paidPaise >= Math.round(totalFeePaise * 0.8) ? "PAID" : "PENDING") as "PAID" | "PENDING",
            },
            {
              installment: "Term 4",
              dueDate: "10 Feb 2026",
              amountPaise: Math.max(
                0,
                totalFeePaise -
                  Math.round(totalFeePaise * 0.3) -
                  Math.round(totalFeePaise * 0.25) * 2,
              ),
              status: (outstandingPaise === 0 ? "PAID" : "PENDING") as "PAID" | "PENDING",
            },
          ];

    return {
      totalFeePaise,
      paidPaise,
      outstandingPaise,
      status,
      feePlanName: ext.feePlanName || "Standard Annual Plan",
      nextDueDate: outstandingPaise > 0 ? ext.feeNextDueDate || "10 Feb 2026" : null,
      feeHeads: heads,
      installments,
      payments,
    };
  }

  async getDossier(
    schoolId: string,
    studentId: string,
    opts?: { asPlatformAdmin?: boolean; canRevealSensitiveId?: boolean },
  ): Promise<StudentDossier360Data> {
    const asPlatformAdmin = Boolean(opts?.asPlatformAdmin);
    const canRevealSensitiveId = Boolean(opts?.canRevealSensitiveId);
    const cacheKey = `${DOSSIER_CACHE_PREFIX}${studentId}`;

    if (process.env.NODE_ENV !== "test") {
      const cached = await tenantCache.get<StudentDossier360Data>(schoolId, cacheKey);
      if (cached && cached.student.schoolId === schoolId) {
        return {
          ...cached,
          canRevealSensitiveId,
          extendedProfile: {
            ...cached.extendedProfile,
            aadhaarFull: canRevealSensitiveId ? cached.extendedProfile.aadhaarFull : undefined,
          },
        };
      }
    }

    const snapshot = await studentRepository.getSnapshot(schoolId, { asPlatformAdmin });
    const student = snapshot.students.find((s) => s.id === studentId);
    if (!student) {
      throw new NotFoundError("Student");
    }

    const groups = snapshot.groups.filter((g) => student.groupIds.includes(g.id));
    const activities = snapshot.activities.filter((a) => a.studentId === student.id);

    if (await hasProfile360Tables(db as unknown as Prisma.TransactionClient)) {
      const dbResult = await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
        const [
          stuRow,
          attRows,
          examRows,
          docRows,
          commRows,
          hwRows,
          cocurricularRows,
          noteRows,
        ] = await Promise.all([
          (tx as any).student.findFirst({
            where: { id: studentId, schoolId },
            select: { profileExtended: true },
          }),
          (tx as any).studentAttendanceRecord.findMany({
            where: { schoolId, studentId },
            orderBy: { attendanceDate: "desc" },
            take: 366,
          }),
          (tx as any).studentExamResult.findMany({
            where: { schoolId, studentId },
            orderBy: [{ academicYear: "desc" }, { term: "asc" }, { subject: "asc" }],
          }),
          (tx as any).studentDocument.findMany({
            where: { schoolId, studentId },
            orderBy: { createdAt: "desc" },
          }),
          (tx as any).studentCommunication.findMany({
            where: { schoolId, studentId },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
          (tx as any).studentHomeworkItem.findMany({
            where: { schoolId, studentId },
            orderBy: { dueDate: "desc" },
          }),
          (tx as any).studentCoCurricularActivity.findMany({
            where: { schoolId, studentId },
            orderBy: { eventDate: "desc" },
          }),
          (tx as any).studentNoteRemark.findMany({
            where: { schoolId, studentId },
            orderBy: { createdAt: "desc" },
          }),
        ]);

        const feePayments = student.applicationId
          ? ((await (tx as any).admissionFeePayment.findMany({
              where: { schoolId, applicationId: student.applicationId },
              orderBy: { paymentDate: "desc" },
            })) as Array<any>)
          : [];

        return {
          ext: ((stuRow?.profileExtended || {}) as StudentExtendedProfile) ?? {},
          attRows,
          examRows,
          docRows,
          commRows,
          hwRows,
          cocurricularRows,
          noteRows,
          feePayments,
        };
      });

      const payments: StudentFeePaymentRecord[] = dbResult.feePayments.map((p: any) => ({
        id: String(p.id),
        receiptNumber: String(p.receiptNumber),
        paymentDate: new Date(p.paymentDate).toISOString().slice(0, 10),
        feeHeadsLabel: p.remarks || "Tuition & Academic Fee",
        amountPaise: Number(p.amountPaise),
        paymentMode: String(p.paymentMode),
        status: "PAID",
      }));

      const dossier: StudentDossier360Data = {
        student,
        extendedProfile: {
          ...dbResult.ext,
          aadhaarMasked:
            dbResult.ext.aadhaarMasked || maskAadhaarNumber(dbResult.ext.aadhaarFull),
          aadhaarFull: canRevealSensitiveId ? dbResult.ext.aadhaarFull : undefined,
        },
        groups,
        activities,
        attendanceRecords: dbResult.attRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          academicYear: String(r.academicYear),
          attendanceDate: new Date(r.attendanceDate).toISOString().slice(0, 10),
          status: r.status,
          remarks: r.remarks ?? null,
          markedByName: String(r.markedByName),
        })),
        examResults: dbResult.examRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          academicYear: String(r.academicYear),
          term: String(r.term),
          subject: String(r.subject),
          maxMarks: Number(r.maxMarks),
          marksObtained: Number(r.marksObtained),
          grade: String(r.grade),
          classRank: r.classRank ?? null,
          schoolRank: r.schoolRank ?? null,
          remarks: r.remarks ?? null,
        })),
        documents: dbResult.docRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          documentName: String(r.documentName),
          documentType: String(r.documentType),
          isRequired: Boolean(r.isRequired),
          fileName: String(r.fileName),
          fileKey: String(r.fileKey),
          fileSizeBytes: Number(r.fileSizeBytes),
          mimeType: String(r.mimeType),
          status: r.status,
          uploadedByName: String(r.uploadedByName),
          verifiedByName: r.verifiedByName ?? null,
          verifiedAt: r.verifiedAt ? new Date(r.verifiedAt).toISOString() : null,
          remarks: r.remarks ?? null,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        communications: dbResult.commRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          channel: r.channel,
          direction: r.direction,
          senderName: String(r.senderName),
          recipientName: String(r.recipientName),
          subject: r.subject ?? null,
          body: String(r.body),
          status: r.status,
          attachmentKey: r.attachmentKey ?? null,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        homeworkItems: dbResult.hwRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          subject: String(r.subject),
          title: String(r.title),
          assignedOn: new Date(r.assignedOn).toISOString().slice(0, 10),
          dueDate: new Date(r.dueDate).toISOString().slice(0, 10),
          status: r.status,
          remarks: r.remarks ?? null,
        })),
        coCurricularActivities: dbResult.cocurricularRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          title: String(r.title),
          category: String(r.category),
          eventDate: new Date(r.eventDate).toISOString().slice(0, 10),
          status: String(r.status),
          achievement: r.achievement ?? null,
          remarks: r.remarks ?? null,
          certificateKey: r.certificateKey ?? null,
        })),
        notesRemarks: dbResult.noteRows.map((r: any) => ({
          id: String(r.id),
          schoolId: String(r.schoolId),
          studentId: String(r.studentId),
          tabScope: r.tabScope,
          kind: r.kind,
          title: r.title ?? null,
          body: String(r.body),
          isCompleted: Boolean(r.isCompleted),
          dueDate: r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : null,
          authorName: String(r.authorName),
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        feeSummary: this.buildFeeSummary(student.feeSummary, dbResult.ext, payments),
        canRevealSensitiveId,
      };

      await tenantCache.set(schoolId, cacheKey, dossier, 60);
      return dossier;
    }

    // Ephemeral / pre-migration memory store
    const bag = getMemoryBag(schoolId);
    const ext = bag.extended[studentId] || {};
    const payments = bag.payments[studentId] || [];

    return {
      student,
      extendedProfile: {
        ...ext,
        aadhaarMasked: ext.aadhaarMasked || maskAadhaarNumber(ext.aadhaarFull),
        aadhaarFull: canRevealSensitiveId ? ext.aadhaarFull : undefined,
      },
      groups,
      activities,
      attendanceRecords: bag.attendance[studentId] || [],
      examResults: bag.exams[studentId] || [],
      documents: bag.documents[studentId] || [],
      communications: bag.communications[studentId] || [],
      homeworkItems: bag.homework[studentId] || [],
      coCurricularActivities: bag.cocurricular[studentId] || [],
      notesRemarks: bag.notes[studentId] || [],
      feeSummary: this.buildFeeSummary(student.feeSummary, ext, payments),
      canRevealSensitiveId,
    };
  }

  async applyAction(
    schoolId: string,
    studentId: string,
    actor: { userId: string; userName: string; asPlatformAdmin?: boolean },
    input: StudentDossierActionInput,
  ): Promise<{ updated: boolean }> {
    const asPlatformAdmin = Boolean(actor.asPlatformAdmin);
    const snapshot = await studentRepository.getSnapshot(schoolId, { asPlatformAdmin });
    const student = snapshot.students.find((s) => s.id === studentId);
    if (!student) {
      throw new NotFoundError("Student");
    }

    const useDb = await hasProfile360Tables(db as unknown as Prisma.TransactionClient);

    if (useDb) {
      await this.runTx(schoolId, asPlatformAdmin, async (tx) => {
        switch (input.action) {
          case "UPDATE_EXTENDED_PROFILE": {
            const row = await (tx as any).student.findFirst({
              where: { id: studentId, schoolId },
              select: { profileExtended: true },
            });
            const prevExt = (row?.profileExtended || {}) as StudentExtendedProfile;
            const nextExt: StudentExtendedProfile = {
              ...prevExt,
              ...(input.extended ?? {}),
              aadhaarMasked:
                input.extended?.aadhaarFull !== undefined
                  ? maskAadhaarNumber(input.extended.aadhaarFull)
                  : prevExt.aadhaarMasked,
            };
            await (tx as any).student.update({
              where: { id: studentId },
              data: {
                ...(input.studentName ? { studentName: input.studentName } : {}),
                ...(input.gender !== undefined ? { gender: input.gender } : {}),
                ...(input.bloodGroup !== undefined ? { bloodGroup: input.bloodGroup } : {}),
                ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
                ...(input.email !== undefined ? { email: input.email || null } : {}),
                ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
                ...(input.guardianName ? { guardianName: input.guardianName } : {}),
                ...(input.guardianRelation ? { guardianRelation: input.guardianRelation } : {}),
                ...(input.guardianPhone ? { guardianPhone: input.guardianPhone } : {}),
                ...(input.guardianEmail !== undefined
                  ? { guardianEmail: input.guardianEmail || null }
                  : {}),
                ...(input.medicalNotes !== undefined ? { medicalNotes: input.medicalNotes } : {}),
                ...(input.photoKey !== undefined ? { photoKey: input.photoKey } : {}),
                profileExtended: nextExt,
              },
            });
            break;
          }
          case "UPSERT_ACADEMIC_MARK": {
            if (input.marksObtained > input.maxMarks) {
              throw new ValidationError("Marks obtained cannot exceed max marks.");
            }
            await (tx as any).studentExamResult.upsert({
              where: {
                schoolId_studentId_academicYear_term_subject: {
                  schoolId,
                  studentId,
                  academicYear: input.academicYear,
                  term: input.term,
                  subject: input.subject,
                },
              },
              create: {
                schoolId,
                studentId,
                academicYear: input.academicYear,
                term: input.term,
                subject: input.subject,
                maxMarks: input.maxMarks,
                marksObtained: input.marksObtained,
                grade: input.grade,
                classRank: input.classRank ?? null,
                schoolRank: input.schoolRank ?? null,
                remarks: input.remarks ?? null,
              },
              update: {
                maxMarks: input.maxMarks,
                marksObtained: input.marksObtained,
                grade: input.grade,
                classRank: input.classRank ?? null,
                schoolRank: input.schoolRank ?? null,
                remarks: input.remarks ?? null,
              },
            });
            break;
          }
          case "MARK_ATTENDANCE": {
            const dt = new Date(`${input.attendanceDate}T00:00:00.000Z`);
            await (tx as any).studentAttendanceRecord.upsert({
              where: {
                schoolId_studentId_attendanceDate: {
                  schoolId,
                  studentId,
                  attendanceDate: dt,
                },
              },
              create: {
                schoolId,
                studentId,
                academicYear: input.academicYear,
                attendanceDate: dt,
                status: input.status,
                remarks: input.remarks ?? null,
                markedByName: actor.userName,
              },
              update: {
                status: input.status,
                remarks: input.remarks ?? null,
                markedByName: actor.userName,
              },
            });
            break;
          }
          case "ADD_DOCUMENT": {
            await (tx as any).studentDocument.create({
              data: {
                schoolId,
                studentId,
                documentName: input.documentName,
                documentType: input.documentType,
                isRequired: input.isRequired,
                fileName: input.fileName,
                fileKey: input.fileKey || `schools/${schoolId}/students/${studentId}/${input.fileName}`,
                fileSizeBytes: input.fileSizeBytes,
                mimeType: input.mimeType,
                status: "PENDING",
                uploadedByName: actor.userName,
                remarks: input.remarks ?? null,
              },
            });
            break;
          }
          case "VERIFY_DOCUMENT": {
            const updated = await (tx as any).studentDocument.updateMany({
              where: { id: input.documentId, schoolId, studentId },
              data: {
                status: input.status,
                verifiedByName: actor.userName,
                verifiedAt: new Date(),
                ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
              },
            });
            if (updated.count === 0) throw new NotFoundError("StudentDocument");
            break;
          }
          case "SEND_COMMUNICATION": {
            await (tx as any).studentCommunication.create({
              data: {
                schoolId,
                studentId,
                channel: input.channel,
                direction: input.direction,
                senderName: actor.userName,
                recipientName: input.recipientName,
                subject: input.subject ?? null,
                body: input.body,
                status: "SENT",
              },
            });
            break;
          }
          case "RECORD_FEE_PAYMENT": {
            if (!student.applicationId) {
              throw new ValidationError(
                "Fee payment ledger requires a linked admission ledger entry.",
              );
            }
            const existing = await (tx as any).admissionFeePayment.findUnique({
              where: { idempotencyKey: input.idempotencyKey },
            });
            if (existing) {
              throw new ConflictError("Duplicate fee payment idempotency key.");
            }
            const ledger = await (tx as any).admissionFeeLedger.findUnique({
              where: { applicationId: student.applicationId },
            });
            if (!ledger) {
              throw new NotFoundError("AdmissionFeeLedger");
            }
            if (input.amountPaise > Number(ledger.outstandingPaise)) {
              throw new ValidationError("Payment exceeds outstanding fee balance.");
            }
            const nextPaid = Number(ledger.paidPaise) + input.amountPaise;
            const nextOutstanding = Math.max(0, Number(ledger.totalFeePaise) - nextPaid);
            await (tx as any).admissionFeePayment.create({
              data: {
                schoolId,
                ledgerId: ledger.id,
                applicationId: student.applicationId,
                idempotencyKey: input.idempotencyKey,
                receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
                amountPaise: input.amountPaise,
                paymentMode: input.paymentMode,
                remarks: `${input.feeHeadsLabel}${input.remarks ? ` - ${input.remarks}` : ""}`,
                recordedByName: actor.userName,
              },
            });
            await (tx as any).admissionFeeLedger.update({
              where: { id: ledger.id },
              data: {
                paidPaise: nextPaid,
                outstandingPaise: nextOutstanding,
                status: nextOutstanding === 0 ? "PAID" : "PARTIALLY_PAID",
              },
            });
            break;
          }
          case "ADD_ACTIVITY": {
            await (tx as any).studentCoCurricularActivity.create({
              data: {
                schoolId,
                studentId,
                title: input.title,
                category: input.category,
                eventDate: new Date(`${input.eventDate}T00:00:00.000Z`),
                status: input.status,
                achievement: input.achievement ?? null,
                remarks: input.remarks ?? null,
              },
            });
            break;
          }
          case "ADD_HOMEWORK": {
            await (tx as any).studentHomeworkItem.create({
              data: {
                schoolId,
                studentId,
                subject: input.subject,
                title: input.title,
                assignedOn: new Date(`${input.assignedOn}T00:00:00.000Z`),
                dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
                status: input.status,
                remarks: input.remarks ?? null,
              },
            });
            break;
          }
          case "TOGGLE_HOMEWORK": {
            const res = await (tx as any).studentHomeworkItem.updateMany({
              where: { id: input.homeworkId, schoolId, studentId },
              data: { status: input.status },
            });
            if (res.count === 0) throw new NotFoundError("StudentHomeworkItem");
            break;
          }
          case "ADD_REMARK": {
            await (tx as any).studentNoteRemark.create({
              data: {
                schoolId,
                studentId,
                tabScope: input.tabScope,
                kind: input.kind,
                title: input.title ?? null,
                body: input.body,
                dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
                authorName: actor.userName,
              },
            });
            break;
          }
          case "TOGGLE_TASK": {
            await (tx as any).studentNoteRemark.updateMany({
              where: { id: input.remarkId, schoolId, studentId },
              data: { isCompleted: Boolean(input.isCompleted) },
            });
            break;
          }
          case "EDIT_REMARK": {
            await (tx as any).studentNoteRemark.updateMany({
              where: { id: input.remarkId, schoolId, studentId },
              data: { body: input.body || "" },
            });
            break;
          }
          case "DELETE_REMARK": {
            await (tx as any).studentNoteRemark.deleteMany({
              where: { id: input.remarkId, schoolId, studentId },
            });
            break;
          }
        }
      });

      await this.invalidateDossier(schoolId, studentId);
      return { updated: true };
    }

    // Memory mode for unit tests & unmigrated DB
    const bag = getMemoryBag(schoolId);
    switch (input.action) {
      case "UPDATE_EXTENDED_PROFILE": {
        const prev = bag.extended[studentId] || {};
        bag.extended[studentId] = {
          ...prev,
          ...(input.extended ?? {}),
          aadhaarMasked:
            input.extended?.aadhaarFull !== undefined
              ? maskAadhaarNumber(input.extended.aadhaarFull)
              : prev.aadhaarMasked,
        };
        break;
      }
      case "UPSERT_ACADEMIC_MARK": {
        if (input.marksObtained > input.maxMarks) {
          throw new ValidationError("Marks obtained cannot exceed max marks.");
        }
        const list = bag.exams[studentId] || [];
        const idx = list.findIndex(
          (r) =>
            r.academicYear === input.academicYear &&
            r.term === input.term &&
            r.subject === input.subject,
        );
        const item: StudentExamResultItem = {
          id: idx >= 0 ? list[idx]!.id : randomUUID(),
          schoolId,
          studentId,
          academicYear: input.academicYear,
          term: input.term,
          subject: input.subject,
          maxMarks: input.maxMarks,
          marksObtained: input.marksObtained,
          grade: input.grade,
          classRank: input.classRank ?? null,
          schoolRank: input.schoolRank ?? null,
          remarks: input.remarks ?? null,
        };
        if (idx >= 0) list[idx] = item;
        else list.unshift(item);
        bag.exams[studentId] = list;
        break;
      }
      case "MARK_ATTENDANCE": {
        const list = bag.attendance[studentId] || [];
        const idx = list.findIndex((r) => r.attendanceDate === input.attendanceDate);
        const item: StudentAttendanceItem = {
          id: idx >= 0 ? list[idx]!.id : randomUUID(),
          schoolId,
          studentId,
          academicYear: input.academicYear,
          attendanceDate: input.attendanceDate,
          status: input.status,
          remarks: input.remarks ?? null,
          markedByName: actor.userName,
        };
        if (idx >= 0) list[idx] = item;
        else list.unshift(item);
        bag.attendance[studentId] = list;
        break;
      }
      case "ADD_DOCUMENT": {
        const list = bag.documents[studentId] || [];
        list.unshift({
          id: randomUUID(),
          schoolId,
          studentId,
          documentName: input.documentName,
          documentType: input.documentType,
          isRequired: input.isRequired,
          fileName: input.fileName,
          fileKey: input.fileKey || `schools/${schoolId}/students/${studentId}/${input.fileName}`,
          fileSizeBytes: input.fileSizeBytes,
          mimeType: input.mimeType,
          status: "PENDING",
          uploadedByName: actor.userName,
          verifiedByName: null,
          verifiedAt: null,
          remarks: input.remarks ?? null,
          createdAt: new Date().toISOString(),
        });
        bag.documents[studentId] = list;
        break;
      }
      case "VERIFY_DOCUMENT": {
        const doc = (bag.documents[studentId] || []).find((d) => d.id === input.documentId);
        if (!doc) throw new NotFoundError("StudentDocument");
        doc.status = input.status;
        doc.verifiedByName = actor.userName;
        doc.verifiedAt = new Date().toISOString();
        if (input.remarks !== undefined) doc.remarks = input.remarks;
        break;
      }
      case "SEND_COMMUNICATION": {
        const list = bag.communications[studentId] || [];
        list.unshift({
          id: randomUUID(),
          schoolId,
          studentId,
          channel: input.channel,
          direction: input.direction,
          senderName: actor.userName,
          recipientName: input.recipientName,
          subject: input.subject ?? null,
          body: input.body,
          status: "SENT",
          attachmentKey: null,
          createdAt: new Date().toISOString(),
        });
        bag.communications[studentId] = list;
        break;
      }
      case "RECORD_FEE_PAYMENT": {
        if (bag.seenIdempotencyKeys[input.idempotencyKey]) {
          throw new ConflictError("Duplicate fee payment idempotency key.");
        }
        const summary = this.buildFeeSummary(
          student.feeSummary,
          bag.extended[studentId] || {},
          bag.payments[studentId] || [],
        );
        if (input.amountPaise > summary.outstandingPaise) {
          throw new ValidationError("Payment exceeds outstanding fee balance.");
        }
        bag.seenIdempotencyKeys[input.idempotencyKey] = true;
        const payments = bag.payments[studentId] || [];
        payments.unshift({
          id: randomUUID(),
          receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
          paymentDate: new Date().toISOString().slice(0, 10),
          feeHeadsLabel: input.feeHeadsLabel,
          amountPaise: input.amountPaise,
          paymentMode: input.paymentMode,
          status: "PAID",
        });
        bag.payments[studentId] = payments;
        break;
      }
      case "ADD_ACTIVITY": {
        const list = bag.cocurricular[studentId] || [];
        list.unshift({
          id: randomUUID(),
          schoolId,
          studentId,
          title: input.title,
          category: input.category,
          eventDate: input.eventDate,
          status: input.status,
          achievement: input.achievement ?? null,
          remarks: input.remarks ?? null,
          certificateKey: null,
        });
        bag.cocurricular[studentId] = list;
        break;
      }
      case "ADD_HOMEWORK": {
        const list = bag.homework[studentId] || [];
        list.unshift({
          id: randomUUID(),
          schoolId,
          studentId,
          subject: input.subject,
          title: input.title,
          assignedOn: input.assignedOn,
          dueDate: input.dueDate,
          status: input.status,
          remarks: input.remarks ?? null,
        });
        bag.homework[studentId] = list;
        break;
      }
      case "TOGGLE_HOMEWORK": {
        const item = (bag.homework[studentId] || []).find((h) => h.id === input.homeworkId);
        if (!item) throw new NotFoundError("StudentHomeworkItem");
        item.status = input.status;
        break;
      }
      case "ADD_REMARK": {
        const list = bag.notes[studentId] || [];
        list.unshift({
          id: randomUUID(),
          schoolId,
          studentId,
          tabScope: input.tabScope,
          kind: input.kind,
          title: input.title ?? null,
          body: input.body,
          isCompleted: false,
          dueDate: input.dueDate ?? null,
          authorName: actor.userName,
          createdAt: new Date().toISOString(),
        });
        bag.notes[studentId] = list;
        break;
      }
      case "TOGGLE_TASK": {
        const item = (bag.notes[studentId] || []).find((n) => n.id === input.remarkId);
        if (item) item.isCompleted = Boolean(input.isCompleted);
        break;
      }
      case "EDIT_REMARK": {
        const item = (bag.notes[studentId] || []).find((n) => n.id === input.remarkId);
        if (item && input.body) item.body = input.body;
        break;
      }
      case "DELETE_REMARK": {
        bag.notes[studentId] = (bag.notes[studentId] || []).filter((n) => n.id !== input.remarkId);
        break;
      }
    }

    await this.invalidateDossier(schoolId, studentId);
    return { updated: true };
  }
}

export const studentDossierRepository = new StudentDossierRepository();
