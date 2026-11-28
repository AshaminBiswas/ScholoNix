import { z } from "zod";

const CLEAN_TEXT = (max: number) => z.string().trim().min(1).max(max);
const OPT_TEXT = (max: number) => z.string().trim().max(max).optional().nullable();

export const createAcademicSessionSchema = z.object({
  action: z.literal("CREATE_SESSION"),
  name: CLEAN_TEXT(30),
  startDate: OPT_TEXT(20),
  endDate: OPT_TEXT(20),
  isCurrent: z.boolean().default(false),
  status: z.enum(["UPCOMING", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const setCurrentSessionSchema = z.object({
  action: z.literal("SET_CURRENT_SESSION"),
  sessionId: z.string().uuid(),
});

export const createAcademicClassSchema = z.object({
  action: z.literal("CREATE_CLASS"),
  academicYear: CLEAN_TEXT(30),
  name: CLEAN_TEXT(60),
  code: OPT_TEXT(30),
  department: z.string().trim().max(60).default("General"),
  displayOrder: z.number().int().min(1).max(200).default(1),
  defaultSections: z.array(z.string().trim().min(1).max(20)).max(15).optional(),
});

export const createAcademicSectionSchema = z.object({
  action: z.literal("CREATE_SECTION"),
  classId: CLEAN_TEXT(80),
  className: OPT_TEXT(60),
  academicYear: CLEAN_TEXT(30),
  name: CLEAN_TEXT(20),
  capacity: z.number().int().min(1).max(200).default(40),
  roomNumber: OPT_TEXT(40),
  classTeacherName: OPT_TEXT(150),
});

export const updateSectionSchema = z.object({
  action: z.literal("UPDATE_SECTION"),
  sectionId: CLEAN_TEXT(80),
  capacity: z.number().int().min(1).max(200).optional(),
  roomNumber: OPT_TEXT(40),
  classTeacherName: OPT_TEXT(150),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const createAcademicSubjectSchema = z.object({
  action: z.literal("CREATE_SUBJECT"),
  code: CLEAN_TEXT(30),
  name: CLEAN_TEXT(120),
  category: z.enum(["CORE", "ELECTIVE", "LAB", "CO_SCHOLASTIC"]).default("CORE"),
  defaultMaxMarks: z.number().int().min(1).max(1000).default(100),
  defaultPassMarks: z.number().int().min(0).max(1000).default(33),
});

export const assignClassSubjectSchema = z.object({
  action: z.literal("ASSIGN_CLASS_SUBJECT"),
  classId: CLEAN_TEXT(80),
  className: OPT_TEXT(60),
  subjectId: z.string().uuid(),
  academicYear: CLEAN_TEXT(30),
  teacherName: OPT_TEXT(150),
  weeklyPeriods: z.number().int().min(1).max(40).default(5),
  maxMarks: z.number().int().min(1).max(1000).default(100),
  passMarks: z.number().int().min(0).max(1000).default(33),
  isCompulsory: z.boolean().default(true),
});

export const removeClassSubjectSchema = z.object({
  action: z.literal("REMOVE_CLASS_SUBJECT"),
  assignmentId: z.string().uuid(),
});

export const academicMutationSchema = z.discriminatedUnion("action", [
  createAcademicSessionSchema,
  setCurrentSessionSchema,
  createAcademicClassSchema,
  createAcademicSectionSchema,
  updateSectionSchema,
  createAcademicSubjectSchema,
  assignClassSubjectSchema,
  removeClassSubjectSchema,
]);

export type AcademicMutationInput = z.infer<typeof academicMutationSchema>;
