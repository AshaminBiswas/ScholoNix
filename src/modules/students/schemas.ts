import { z } from "zod";

const CLEAN_TEXT = (max: number) => z.string().trim().min(1).max(max);
const OPT_TEXT = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const createStudentSchema = z.object({
  studentName: CLEAN_TEXT(200),
  admissionNumber: z.string().trim().max(40).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  dateOfBirth: OPT_TEXT(30),
  bloodGroup: OPT_TEXT(20),
  nationality: OPT_TEXT(80),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  phone: OPT_TEXT(30),
  address: z
    .object({
      addressLine1: OPT_TEXT(200),
      addressLine2: OPT_TEXT(200),
      city: OPT_TEXT(100),
      state: OPT_TEXT(100),
      postalCode: OPT_TEXT(20),
    })
    .optional()
    .nullable(),
  guardianName: CLEAN_TEXT(200),
  guardianRelation: z.string().trim().max(60).default("Parent"),
  guardianPhone: CLEAN_TEXT(30),
  guardianEmail: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  previousSchool: OPT_TEXT(255),
  medicalNotes: OPT_TEXT(1000),
  admissionType: z.enum(["FRESH", "TRANSFER", "RE_ADMISSION", "OTHER"]).default("FRESH"),
  admissionDate: OPT_TEXT(40),
  academicYear: CLEAN_TEXT(30),
  grade: CLEAN_TEXT(60),
  section: z.string().trim().min(1).max(20).default("A"),
  rollNumber: OPT_TEXT(30),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"]).default("ACTIVE"),
});

export const updateStudentSchema = z.object({
  studentName: CLEAN_TEXT(200).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  dateOfBirth: OPT_TEXT(30),
  bloodGroup: OPT_TEXT(20),
  nationality: OPT_TEXT(80),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  phone: OPT_TEXT(30),
  guardianName: CLEAN_TEXT(200).optional(),
  guardianRelation: OPT_TEXT(60),
  guardianPhone: CLEAN_TEXT(30).optional(),
  guardianEmail: z.string().trim().email().max(255).optional().or(z.literal("")).nullable(),
  previousSchool: OPT_TEXT(255),
  medicalNotes: OPT_TEXT(1000),
  academicYear: CLEAN_TEXT(30).optional(),
  grade: CLEAN_TEXT(60).optional(),
  section: z.string().trim().min(1).max(20).optional(),
  rollNumber: OPT_TEXT(30),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"]).optional(),
  graduationYear: OPT_TEXT(30),
  inactiveReason: OPT_TEXT(255),
});

export const promoteStudentsSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(500),
  toAcademicYear: CLEAN_TEXT(30),
  toGrade: CLEAN_TEXT(60),
  toSection: z.string().trim().min(1).max(20).default("A"),
  markAsAlumni: z.boolean().default(false),
  remarks: OPT_TEXT(255),
});

export const transferStudentSchema = z.object({
  studentId: z.string().uuid(),
  transferType: z.enum(["TRANSFER_IN", "TRANSFER_OUT"]),
  transferDate: OPT_TEXT(40),
  tcNumber: OPT_TEXT(60),
  counterpartySchool: OPT_TEXT(255),
  reason: OPT_TEXT(500),
  clearanceStatus: z.enum(["CLEARED", "PENDING"]).default("CLEARED"),
  toGrade: OPT_TEXT(60),
  toSection: OPT_TEXT(20),
  toAcademicYear: OPT_TEXT(30),
});

export const bulkStudentsActionSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum([
    "SET_STATUS",
    "ASSIGN_SECTION",
    "ADD_TO_GROUP",
    "REMOVE_FROM_GROUP",
  ]),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"]).optional(),
  reason: OPT_TEXT(255),
  section: OPT_TEXT(20),
  groupId: z.string().uuid().optional(),
});

export const createStudentGroupSchema = z.object({
  name: CLEAN_TEXT(100),
  category: z.string().trim().max(60).default("General"),
  colorToken: z.string().trim().max(30).default("violet"),
  description: OPT_TEXT(255),
});

export const updateStudentSettingsSchema = z.object({
  defaultSections: z.array(CLEAN_TEXT(20)).min(1).max(26).optional(),
  sectionsByGrade: z.record(z.string(), z.array(CLEAN_TEXT(20))).optional(),
  rollNumberMode: z.enum(["AUTO_ALPHA", "MANUAL"]).optional(),
  requireTcOnTransfer: z.boolean().optional(),
  idCardConfig: z
    .object({
      showBloodGroup: z.boolean().default(true),
      showGuardianPhone: z.boolean().default(true),
      showEmergencyContact: z.boolean().default(true),
      motto: z.string().trim().max(120).optional(),
    })
    .optional(),
  promotionConfig: z
    .object({
      finalGradeForAlumni: z.string().trim().max(60).default("Class XII"),
      autoAssignRollNumbers: z.boolean().default(true),
    })
    .optional(),
});

export const importStudentsSchema = z.object({
  rows: z.array(createStudentSchema).min(1).max(300),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type PromoteStudentsInput = z.infer<typeof promoteStudentsSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
export type BulkStudentsActionInput = z.infer<typeof bulkStudentsActionSchema>;
export type CreateStudentGroupInput = z.infer<typeof createStudentGroupSchema>;
export type UpdateStudentSettingsInput = z.infer<typeof updateStudentSettingsSchema>;
