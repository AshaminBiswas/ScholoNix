import { z } from "zod";

const OPT_TEXT = (max: number) => z.string().trim().max(max).optional().nullable();

export const updateExtendedProfileSchema = z.object({
  action: z.literal("UPDATE_EXTENDED_PROFILE"),
  studentName: z.string().trim().min(1).max(200).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  dateOfBirth: OPT_TEXT(30),
  bloodGroup: OPT_TEXT(20),
  nationality: OPT_TEXT(80),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  phone: OPT_TEXT(30),
  guardianName: z.string().trim().min(1).max(200).optional(),
  guardianRelation: OPT_TEXT(60),
  guardianPhone: OPT_TEXT(30),
  guardianEmail: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  medicalNotes: OPT_TEXT(1000),
  photoKey: OPT_TEXT(500),
  extended: z
    .object({
      category: OPT_TEXT(60),
      religion: OPT_TEXT(60),
      motherTongue: OPT_TEXT(60),
      languagesKnown: OPT_TEXT(160),
      aadhaarFull: OPT_TEXT(20),
      alternatePhone: OPT_TEXT(30),
      identificationMarks: OPT_TEXT(200),
      specialNeed: OPT_TEXT(160),
      rteConcession: OPT_TEXT(120),
      classTeacher: OPT_TEXT(120),
      houseName: OPT_TEXT(60),
      transportRoute: OPT_TEXT(120),
      hostelName: OPT_TEXT(120),
      currentAddressSameAsPermanent: z.boolean().optional(),
      permanentAddress: z
        .object({
          line1: OPT_TEXT(200),
          city: OPT_TEXT(80),
          state: OPT_TEXT(80),
          postalCode: OPT_TEXT(20),
        })
        .optional()
        .nullable(),
      father: z
        .object({
          name: OPT_TEXT(150),
          phone: OPT_TEXT(30),
          email: OPT_TEXT(150),
          occupation: OPT_TEXT(120),
        })
        .optional()
        .nullable(),
      mother: z
        .object({
          name: OPT_TEXT(150),
          phone: OPT_TEXT(30),
          email: OPT_TEXT(150),
          occupation: OPT_TEXT(120),
        })
        .optional()
        .nullable(),
      communicationPreferences: z
        .object({
          academicUpdates: z.boolean(),
          attendanceAlerts: z.boolean(),
          feeNotifications: z.boolean(),
          schoolAnnouncements: z.boolean(),
          autoFeeReminder: z.boolean(),
        })
        .optional(),
    })
    .optional(),
});

export const upsertExamMarkSchema = z.object({
  action: z.literal("UPSERT_ACADEMIC_MARK"),
  academicYear: z.string().trim().min(1).max(30),
  term: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(1).max(100),
  maxMarks: z.coerce.number().int().min(1).max(1000),
  marksObtained: z.coerce.number().min(0).max(1000),
  grade: z.string().trim().min(1).max(10),
  classRank: z.coerce.number().int().min(1).optional().nullable(),
  schoolRank: z.coerce.number().int().min(1).optional().nullable(),
  remarks: OPT_TEXT(255),
});

export const markAttendanceSchema = z.object({
  action: z.literal("MARK_ATTENDANCE"),
  academicYear: z.string().trim().min(1).max(30),
  attendanceDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"]),
  remarks: OPT_TEXT(255),
});

export const addDocumentSchema = z.object({
  action: z.literal("ADD_DOCUMENT"),
  documentName: z.string().trim().min(1).max(150),
  documentType: z.string().trim().min(1).max(60),
  isRequired: z.boolean().default(false),
  fileName: z.string().trim().min(1).max(255),
  fileKey: OPT_TEXT(500),
  fileSizeBytes: z.coerce.number().int().min(0).max(25_000_000).default(102400),
  mimeType: z.string().trim().max(100).default("application/pdf"),
  remarks: OPT_TEXT(255),
});

export const verifyDocumentSchema = z.object({
  action: z.literal("VERIFY_DOCUMENT"),
  documentId: z.string().uuid(),
  status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
  remarks: OPT_TEXT(255),
});

export const sendCommunicationSchema = z.object({
  action: z.literal("SEND_COMMUNICATION"),
  channel: z.enum(["MESSAGE", "EMAIL", "SMS", "APP"]),
  direction: z.enum(["OUTBOUND", "INBOUND"]).default("OUTBOUND"),
  recipientName: z.string().trim().min(1).max(150),
  subject: OPT_TEXT(255),
  body: z.string().trim().min(1).max(2000),
});

export const recordStudentFeePaymentSchema = z.object({
  action: z.literal("RECORD_FEE_PAYMENT"),
  idempotencyKey: z.string().trim().min(8).max(80),
  amountPaise: z.coerce.number().int().min(100).max(500_000_000),
  paymentMode: z.enum(["UPI", "CARD", "NETBANKING", "CASH", "CHEQUE", "BANK_TRANSFER"]),
  feeHeadsLabel: z.string().trim().min(1).max(120).default("Tuition Fee"),
  remarks: OPT_TEXT(255),
});

export const addCoCurricularActivitySchema = z.object({
  action: z.literal("ADD_ACTIVITY"),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(60),
  eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.string().trim().min(1).max(60),
  achievement: OPT_TEXT(150),
  remarks: OPT_TEXT(255),
});

export const addHomeworkSchema = z.object({
  action: z.literal("ADD_HOMEWORK"),
  subject: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(255),
  assignedOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PENDING", "SUBMITTED"]).default("PENDING"),
  remarks: OPT_TEXT(255),
});

export const toggleHomeworkSchema = z.object({
  action: z.literal("TOGGLE_HOMEWORK"),
  homeworkId: z.string().uuid(),
  status: z.enum(["PENDING", "SUBMITTED"]),
});

export const createNoteRemarkSchema = z.object({
  action: z.literal("ADD_REMARK"),
  tabScope: z.enum([
    "PROFILE",
    "ACADEMIC",
    "ATTENDANCE",
    "FEES",
    "DOCUMENTS",
    "ACTIVITIES",
    "HISTORY",
  ]),
  kind: z.enum(["REMARK", "TASK", "ACHIEVEMENT"]).default("REMARK"),
  title: OPT_TEXT(200),
  body: z.string().trim().min(1).max(2000),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const toggleTaskOrDeleteRemarkSchema = z.object({
  action: z.enum(["TOGGLE_TASK", "DELETE_REMARK", "EDIT_REMARK"]),
  remarkId: z.string().uuid(),
  body: OPT_TEXT(2000),
  isCompleted: z.boolean().optional(),
});

export const studentDossierActionSchema = z.discriminatedUnion("action", [
  updateExtendedProfileSchema,
  upsertExamMarkSchema,
  markAttendanceSchema,
  addDocumentSchema,
  verifyDocumentSchema,
  sendCommunicationSchema,
  recordStudentFeePaymentSchema,
  addCoCurricularActivitySchema,
  addHomeworkSchema,
  toggleHomeworkSchema,
  createNoteRemarkSchema,
  toggleTaskOrDeleteRemarkSchema,
]);

export type StudentDossierActionInput = z.infer<typeof studentDossierActionSchema>;
