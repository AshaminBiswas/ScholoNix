import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""));

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must have at least 7 characters")
  .max(25, "Phone number must not exceed 25 characters");

const documentChecklistItemSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  submitted: z.boolean(),
  verified: z.boolean(),
});

export const createEnquirySchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required").max(120),
  guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
  guardianPhone: phoneSchema,
  guardianEmail: optionalEmailSchema,
  gradeApplied: z.string().trim().min(1, "Grade is required").max(60),
  academicYear: z.string().trim().min(4, "Academic year is required").max(30),
  source: z
    .enum(["Website", "Walk-In", "Phone Call", "Referral", "Campaign", "Other"])
    .default("Walk-In"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateEnquirySchema = z.object({
  action: z.enum(["update", "convert"]).default("update"),
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"]).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createApplicationSchema = z.object({
  studentName: z.string().trim().min(2, "Student name is required").max(120),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  gradeApplied: z.string().trim().min(1, "Admission grade is required").max(60),
  academicYear: z.string().trim().min(4, "Academic year is required").max(30),
  guardianName: z.string().trim().min(2, "Guardian name is required").max(120),
  guardianRelation: z.string().trim().min(2).max(60).default("Parent"),
  guardianPhone: phoneSchema,
  guardianEmail: optionalEmailSchema,
  previousSchool: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED"]).default("UNDER_REVIEW"),
  enquiryId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateApplicationSchema = z.object({
  status: z
    .enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED", "ADMITTED", "REJECTED"])
    .optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  verificationNotes: z.string().trim().max(500).optional().nullable(),
  documentsChecklist: z.array(documentChecklistItemSchema).max(20).optional(),
  gradeApplied: z.string().trim().min(1).max(60).optional(),
  guardianName: z.string().trim().min(2).max(120).optional(),
  guardianPhone: phoneSchema.optional(),
  guardianEmail: optionalEmailSchema,
  previousSchool: z.string().trim().max(200).optional().nullable(),
});

export const updateAdmissionsSettingsSchema = z.object({
  currentAcademicYear: z.string().trim().min(4).max(30),
  applicationDeadline: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
  applicationPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,8}$/, "Prefix must be 2-8 uppercase letters"),
  enabledGrades: z
    .array(z.string().trim().min(1).max(60))
    .min(1, "Select at least one admission grade")
    .max(25),
});

export const createReminderSchema = z.object({
  title: z.string().trim().min(3, "Reminder text must be at least 3 characters").max(240),
  academicYear: z.string().trim().min(4).max(30).optional().nullable(),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .nullable()
    .or(z.literal("")),
  priority: z.enum(["INFO", "WARNING"]).default("INFO"),
});

export const updateReminderSchema = z.object({
  isCompleted: z.boolean(),
});

export const bulkImportApplicationsSchema = z.object({
  applications: z
    .array(createApplicationSchema)
    .min(1, "Include at least one application row to import")
    .max(100, "Import at most 100 applications per batch"),
});

export const bulkUpdateApplicationsSchema = z
  .object({
    applicationIds: z
      .array(z.string().uuid("Invalid application ID"))
      .min(1, "Select at least one application")
      .max(100, "Bulk update is limited to 100 applications at once"),
    status: z
      .enum(["UNDER_REVIEW", "DOCUMENTS_PENDING", "SHORTLISTED", "ADMITTED", "REJECTED"])
      .optional(),
    verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
    verificationNotes: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (val) =>
      val.status !== undefined ||
      val.verificationStatus !== undefined ||
      val.verificationNotes !== undefined,
    { message: "Provide at least one field to update across selected applications." },
  );

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateAdmissionsSettingsInput = z.infer<typeof updateAdmissionsSettingsSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type BulkImportApplicationsInput = z.infer<typeof bulkImportApplicationsSchema>;
export type BulkUpdateApplicationsInput = z.infer<typeof bulkUpdateApplicationsSchema>;
