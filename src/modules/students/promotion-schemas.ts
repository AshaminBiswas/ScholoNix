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

export const promotionGradeBandSchema = z.object({
  grade: z.string().trim().min(1).max(16),
  minPct: z.coerce.number().min(0).max(100),
  maxPct: z.coerce.number().min(0).max(100),
  resultLabel: z.string().trim().min(1).max(60),
  promote: z.boolean(),
});

export const promotionSettingsSuiteSchema = z
  .object({
    general: z
      .object({
        moduleEnabled: z.boolean(),
        allowClassPromotion: z.boolean(),
        allowBulkPromotion: z.boolean(),
        allowRePromotion: z.boolean(),
        requireMandatoryConditions: z.boolean(),
        defaultPromotionType: z.enum(["GRADE_BASED", "PERCENTAGE_BASED", "MANUAL"]),
        overallPassPct: z.coerce.number().min(0).max(100),
        minSubjectPassPct: z.coerce.number().min(0).max(100),
        considerAllSubjects: z.boolean(),
        enforceAttendance: z.boolean(),
        minAttendancePct: z.coerce.number().min(0).max(100),
        enforceFeeClearance: z.boolean(),
        enforceAssessmentCompletion: z.boolean(),
        includeCoScholastic: z.boolean(),
        checkDisciplinaryClearance: z.boolean(),
        autoPromotionEnabled: z.boolean(),
        notifyClassTeacher: z.boolean(),
        notifyParents: z.boolean(),
        notifyStudentInApp: z.boolean(),
        sendSummaryReport: z.boolean(),
      })
      .optional(),
    academicDefaults: z
      .object({
        curriculum: z.string().trim().min(1).max(60),
        gradingSystem: z.string().trim().min(1).max(80),
        examType: z.string().trim().min(1).max(60),
        numberOfTerms: z.coerce.number().int().min(1).max(6),
        resultCalculation: z.string().trim().min(1).max(80),
        applySameCriteriaToAllClasses: z.boolean(),
        considerBestOfTerm: z.boolean(),
        attendanceSource: z.enum(["ENTIRE_YEAR", "CURRENT_TERM", "LAST_90_DAYS"]),
        selectedSubjectGrade: z.string().trim().min(1).max(60),
        subjects: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(100),
              type: z.enum(["Compulsory", "Optional"]),
              maxMarks: z.coerce.number().int().min(1).max(1000),
              passMarks: z.coerce.number().int().min(0).max(1000),
              included: z.boolean(),
            }),
          )
          .max(40),
        terms: z
          .array(
            z.object({
              term: z.string().trim().min(1).max(50),
              weightagePct: z.coerce.number().min(0).max(100),
              active: z.boolean(),
            }),
          )
          .max(10),
        assessments: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(80),
              weightagePct: z.coerce.number().min(0).max(100),
              applicableTo: z.string().trim().min(1).max(80),
            }),
          )
          .max(20),
        remarkTemplates: z
          .array(
            z.object({
              text: z.string().trim().min(1).max(200),
              category: z.enum(["Promotion", "Not Promotion"]),
            }),
          )
          .max(30),
      })
      .optional(),
    automation: z
      .object({
        enabled: z.boolean(),
        enableAutoProcessing: z.boolean(),
        autoClassUpdate: z.boolean(),
        autoGenerateReport: z.boolean(),
        autoSendNotifications: z.boolean(),
        autoUpdateAcademicYear: z.boolean(),
        autoArchivePreviousYear: z.boolean(),
        runInBackground: z.boolean(),
        runFrequency: z.enum(["YEARLY", "TERM", "MANUAL"]),
        runDate: z.string().trim().min(1).max(30),
        runTime: z.string().trim().min(1).max(20),
        flagUnqualifiedStudents: z.boolean(),
        allowManualOverride: z.boolean(),
        keepRetainedInSameClass: z.boolean(),
        generateExceptionReport: z.boolean(),
        automationRules: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(100),
              condition: z.string().trim().min(1).max(150),
              action: z.string().trim().min(1).max(80),
              active: z.boolean(),
            }),
          )
          .max(30),
      })
      .optional(),
    notifications: z
      .object({
        notifyParents: z.boolean(),
        notifyTeachers: z.boolean(),
        notifyStudents: z.boolean(),
        sendSummaryReport: z.boolean(),
        includeResultDetails: z.boolean(),
        channels: z.object({
          email: z.boolean(),
          sms: z.boolean(),
          inApp: z.boolean(),
          whatsapp: z.boolean(),
          desktop: z.boolean(),
        }),
        triggers: z.object({
          onCompleted: z.boolean(),
          onNotPromoted: z.boolean(),
          onResultsPublished: z.boolean(),
          onClassUpdated: z.boolean(),
          beforeReminder: z.boolean(),
          afterReportGenerated: z.boolean(),
        }),
        schedule: z.object({
          enabled: z.boolean(),
          sendOn: z.string().trim().min(1).max(80),
          timeSlot: z.string().trim().min(1).max(20),
          scheduleDate: z.string().trim().min(1).max(30),
          repeat: z.enum(["ONCE", "DAILY", "WEEKLY"]),
        }),
        templates: z
          .array(
            z.object({
              id: z.string().trim().min(1).max(60),
              name: z.string().trim().min(1).max(120),
              audience: z.string().trim().min(1).max(120),
              channels: z.array(z.string().trim().min(1).max(30)).max(10),
              active: z.boolean(),
              subject: z.string().trim().min(1).max(200),
              body: z.string().trim().min(1).max(1500),
            }),
          )
          .max(30),
      })
      .optional(),
    accessControl: z
      .object({
        roles: z
          .array(
            z.object({
              id: z.string().trim().min(1).max(60),
              name: z.string().trim().min(1).max(80),
              accessLevel: z.enum(["Full Access", "Manage", "Limited", "Custom"]),
              description: z.string().trim().max(300),
              active: z.boolean(),
              matrix: z.record(
                z.string(),
                z.object({
                  view: z.boolean(),
                  create: z.boolean(),
                  edit: z.boolean(),
                  delete: z.boolean(),
                  approve: z.boolean(),
                  export: z.boolean(),
                }),
              ),
            }),
          )
          .max(20),
        moduleQuickControls: z.record(z.string(), z.boolean()),
        userAssignments: z
          .array(
            z.object({
              userId: z.string().trim().min(1).max(80),
              userName: z.string().trim().min(1).max(120),
              roleName: z.string().trim().min(1).max(80),
              assignedClasses: z.string().trim().min(1).max(150),
              active: z.boolean(),
            }),
          )
          .max(100),
        policies: z.object({
          restrictToAssignedClasses: z.boolean(),
          viewOnlyNonClassTeachers: z.boolean(),
          requireApprovalForChanges: z.boolean(),
          logAllPermissionChanges: z.boolean(),
          exportOnlyAdminPrincipal: z.boolean(),
        }),
      })
      .optional(),
    resultCriteriaByGrade: z
      .record(
        z.string(),
        z.object({
          criteriaName: z.string().trim().min(1).max(120),
          evaluationType: z.enum(["Grade", "Marks"]),
          minSubjectPassPct: z.coerce.number().min(0).max(100),
          includeCoScholastic: z.boolean(),
          subjects: z
            .array(
              z.object({
                subject: z.string().trim().min(1).max(100),
                maxMarks: z.coerce.number().int().min(1).max(1000),
                passMarks: z.coerce.number().int().min(0).max(1000),
              }),
            )
            .max(40),
        }),
      )
      .optional(),
  })
  .optional();

export const upsertPromotionRulesSchema = z.object({
  academicYear: z.string().trim().min(1).max(30),
  rules: z
    .array(
      z.object({
        ruleName: z.string().trim().min(1).max(150).optional(),
        fromGrade: z.string().trim().min(1).max(60),
        toGrade: z.string().trim().min(1).max(60),
        markAsAlumni: z.boolean().default(false),
        defaultSectionMode: z.enum(["KEEP_SAME", "TARGET_SECTION", "AUTO_BALANCE"]).default("KEEP_SAME"),
        targetSection: z.string().trim().max(20).optional().nullable(),
        minResultPct: z.coerce.number().min(0).max(100).default(40),
        minAttendancePct: z.coerce.number().min(0).max(100).default(75),
        maxFailedSubjects: z.coerce.number().int().min(0).max(20).default(0),
        criteriaSummary: z.string().trim().max(255).optional(),
        requireAssessmentsCompleted: z.boolean().default(true),
        requireResultPublished: z.boolean().default(true),
        requireFeeClearance: z.boolean().default(false),
        gradeCriteria: z.array(promotionGradeBandSchema).min(1).max(15).optional(),
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
  settingsSuite: promotionSettingsSuiteSchema,
});

export const promotionAuditFilterSchema = z.object({
  module: z.string().trim().max(60).optional(),
  action: z.string().trim().max(60).optional(),
  user: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", "Success", "Warning", "Failed"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const runPromotionAutomationSchema = z.object({
  academicYear: z.string().trim().min(1).max(30),
  toAcademicYear: z.string().trim().min(1).max(30),
  dryRun: z.boolean().default(true),
});

export type RunPromotionAutomationInput = z.infer<typeof runPromotionAutomationSchema>;

export type ExecutePromotionBatchInput = z.infer<typeof executePromotionBatchSchema>;
export type UpsertPromotionRulesInput = z.infer<typeof upsertPromotionRulesSchema>;
