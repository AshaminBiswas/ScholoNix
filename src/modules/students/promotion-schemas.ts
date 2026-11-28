import { z } from "zod";

export const promotionFilterQuerySchema = z.object({
  academicYear: z.string().trim().max(30).optional(),
  fromGrade: z.string().trim().max(60).optional(),
  toGrade: z.string().trim().max(60).optional(),
  section: z.string().trim().max(20).optional(),
  status: z.enum(["ALL", "PROMOTED", "PENDING", "NOT_PROMOTED", "ALUMNI"]).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const executePromotionBatchSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(2000),
  academicYear: z.string().trim().min(1).max(30),
  toAcademicYear: z.string().trim().min(1).max(30),
  toGrade: z.string().trim().min(1).max(60),
  toSection: z.string().trim().min(1).max(20).default("A"),
  decision: z.enum(["PROMOTE", "RETAIN", "ALUMNI"]).default("PROMOTE"),
  dryRun: z.boolean().default(false),
  remarks: z.string().trim().max(255).optional().nullable(),
});

export const upsertPromotionRulesSchema = z.object({
  academicYear: z.string().trim().min(1).max(30),
  rules: z
    .array(
      z.object({
        fromGrade: z.string().trim().min(1).max(60),
        toGrade: z.string().trim().min(1).max(60),
        markAsAlumni: z.boolean().default(false),
        defaultSectionMode: z.enum(["KEEP_SAME", "TARGET_SECTION", "AUTO_BALANCE"]).default("KEEP_SAME"),
        targetSection: z.string().trim().max(20).optional().nullable(),
        minResultPct: z.coerce.number().min(0).max(100).default(35),
        minAttendancePct: z.coerce.number().min(0).max(100).default(75),
        maxFailedSubjects: z.coerce.number().int().min(0).max(20).default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .max(30)
    .optional(),
  settings: z
    .object({
      finalGradeForAlumni: z.string().trim().min(1).max(60).optional(),
      autoAssignRollNumbers: z.boolean().optional(),
      minResultPct: z.coerce.number().min(0).max(100).optional(),
      minAttendancePct: z.coerce.number().min(0).max(100).optional(),
      lockPromotionAfterPublish: z.boolean().optional(),
      notifyParentsOnPromotion: z.boolean().optional(),
      requirePendingFeeClearance: z.boolean().optional(),
    })
    .optional(),
});

export type ExecutePromotionBatchInput = z.infer<typeof executePromotionBatchSchema>;
export type UpsertPromotionRulesInput = z.infer<typeof upsertPromotionRulesSchema>;
