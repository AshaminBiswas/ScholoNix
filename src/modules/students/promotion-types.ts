export type PromotionSuiteTab =
  | "overview"
  | "list"
  | "rules"
  | "criteria"
  | "history"
  | "settings";

export type PromotionSettingsSubTab =
  | "general"
  | "academic"
  | "automation"
  | "notifications"
  | "access"
  | "audit";

export type PromotionDecisionStatus =
  | "PROMOTED"
  | "PENDING"
  | "NOT_PROMOTED"
  | "ALUMNI";

export interface PromotionGradeBand {
  grade: string;
  minPct: number;
  maxPct: number;
  resultLabel: string;
  promote: boolean;
}

export const DEFAULT_PROMOTION_GRADE_BANDS: PromotionGradeBand[] = [
  { grade: "A+", minPct: 90, maxPct: 100, resultLabel: "Excellent", promote: true },
  { grade: "A", minPct: 80, maxPct: 89, resultLabel: "Very Good", promote: true },
  { grade: "B+", minPct: 70, maxPct: 79, resultLabel: "Good", promote: true },
  { grade: "B", minPct: 60, maxPct: 69, resultLabel: "Above Average", promote: true },
  { grade: "C", minPct: 50, maxPct: 59, resultLabel: "Average", promote: true },
  { grade: "D", minPct: 40, maxPct: 49, resultLabel: "Pass", promote: true },
  { grade: "E", minPct: 0, maxPct: 39, resultLabel: "Fail", promote: false },
];

export interface StudentPromotionRuleRecord {
  id: string;
  schoolId: string;
  academicYear: string;
  ruleName: string;
  fromGrade: string;
  toGrade: string;
  markAsAlumni: boolean;
  defaultSectionMode: "KEEP_SAME" | "TARGET_SECTION" | "AUTO_BALANCE";
  targetSection: string | null;
  minResultPct: number;
  minAttendancePct: number;
  maxFailedSubjects: number;
  criteriaSummary: string;
  requireAssessmentsCompleted: boolean;
  requireResultPublished: boolean;
  requireFeeClearance: boolean;
  gradeCriteria: PromotionGradeBand[];
  isActive: boolean;
}

export interface StudentPromotionBatchRecord {
  id: string;
  schoolId: string;
  academicYear: string;
  toAcademicYear: string;
  fromGrade: string | null;
  toGrade: string | null;
  totalEligible: number;
  promotedCount: number;
  retainedCount: number;
  pendingCount: number;
  alumniCount: number;
  promotionPct: number;
  status: "COMPLETED" | "IN_PROGRESS" | "DRY_RUN";
  triggeredByName: string;
  completedAt: string | null;
  remarks: string | null;
}

export interface StudentPromotionDecisionRow {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  currentGrade: string;
  currentSection: string;
  nextGrade: string;
  nextSection: string;
  academicYear: string;
  resultGrade: string;
  promotionPct: number;
  attendancePct: number;
  status: PromotionDecisionStatus;
  remarks: string | null;
}

export interface ClassPromotionSummaryRow {
  fromGrade: string;
  sectionSummary: string;
  toGrade: string;
  totalStudents: number;
  promotedCount: number;
  pendingCount: number;
  notPromotedCount: number;
  promotionPct: number;
  status: "Completed" | "In Progress";
}

export interface PromotionSettingsConfig {
  finalGradeForAlumni: string;
  autoAssignRollNumbers: boolean;
  minResultPct: number;
  minAttendancePct: number;
  lockPromotionAfterPublish: boolean;
  notifyParentsOnPromotion: boolean;
  requirePendingFeeClearance: boolean;
}

export interface PromotionSubjectDefault {
  name: string;
  type: "Compulsory" | "Optional";
  maxMarks: number;
  passMarks: number;
  included: boolean;
}

export interface PromotionTermDefault {
  term: string;
  weightagePct: number;
  active: boolean;
}

export interface PromotionAssessmentDefault {
  name: string;
  weightagePct: number;
  applicableTo: string;
}

export interface PromotionRemarkTemplate {
  text: string;
  category: "Promotion" | "Not Promotion";
}

export interface PromotionAutomationRuleItem {
  name: string;
  condition: string;
  action: string;
  active: boolean;
}

export interface PromotionNotificationTemplateItem {
  id: string;
  name: string;
  audience: string;
  channels: string[];
  active: boolean;
  subject: string;
  body: string;
}

export interface PromotionRoleMatrixRow {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface PromotionRoleConfigItem {
  id: string;
  name: string;
  accessLevel: "Full Access" | "Manage" | "Limited" | "Custom";
  description: string;
  active: boolean;
  matrix: Record<string, PromotionRoleMatrixRow>;
}

export interface PromotionRoleUserAssignment {
  userId: string;
  userName: string;
  roleName: string;
  assignedClasses: string;
  active: boolean;
}

export interface PromotionSettingsSuiteConfig {
  general: {
    moduleEnabled: boolean;
    allowClassPromotion: boolean;
    allowBulkPromotion: boolean;
    allowRePromotion: boolean;
    requireMandatoryConditions: boolean;
    defaultPromotionType: "GRADE_BASED" | "PERCENTAGE_BASED" | "MANUAL";
    overallPassPct: number;
    minSubjectPassPct: number;
    considerAllSubjects: boolean;
    enforceAttendance: boolean;
    minAttendancePct: number;
    enforceFeeClearance: boolean;
    enforceAssessmentCompletion: boolean;
    includeCoScholastic: boolean;
    checkDisciplinaryClearance: boolean;
    autoPromotionEnabled: boolean;
    notifyClassTeacher: boolean;
    notifyParents: boolean;
    notifyStudentInApp: boolean;
    sendSummaryReport: boolean;
  };
  academicDefaults: {
    curriculum: string;
    gradingSystem: string;
    examType: string;
    numberOfTerms: number;
    resultCalculation: string;
    applySameCriteriaToAllClasses: boolean;
    considerBestOfTerm: boolean;
    attendanceSource: "ENTIRE_YEAR" | "CURRENT_TERM" | "LAST_90_DAYS";
    selectedSubjectGrade: string;
    subjects: PromotionSubjectDefault[];
    terms: PromotionTermDefault[];
    assessments: PromotionAssessmentDefault[];
    remarkTemplates: PromotionRemarkTemplate[];
  };
  automation: {
    enabled: boolean;
    enableAutoProcessing: boolean;
    autoClassUpdate: boolean;
    autoGenerateReport: boolean;
    autoSendNotifications: boolean;
    autoUpdateAcademicYear: boolean;
    autoArchivePreviousYear: boolean;
    runInBackground: boolean;
    runFrequency: "YEARLY" | "TERM" | "MANUAL";
    runDate: string;
    runTime: string;
    flagUnqualifiedStudents: boolean;
    allowManualOverride: boolean;
    keepRetainedInSameClass: boolean;
    generateExceptionReport: boolean;
    automationRules: PromotionAutomationRuleItem[];
  };
  notifications: {
    notifyParents: boolean;
    notifyTeachers: boolean;
    notifyStudents: boolean;
    sendSummaryReport: boolean;
    includeResultDetails: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
      whatsapp: boolean;
      desktop: boolean;
    };
    triggers: {
      onCompleted: boolean;
      onNotPromoted: boolean;
      onResultsPublished: boolean;
      onClassUpdated: boolean;
      beforeReminder: boolean;
      afterReportGenerated: boolean;
    };
    schedule: {
      enabled: boolean;
      sendOn: string;
      timeSlot: string;
      scheduleDate: string;
      repeat: "ONCE" | "DAILY" | "WEEKLY";
    };
    templates: PromotionNotificationTemplateItem[];
  };
  accessControl: {
    roles: PromotionRoleConfigItem[];
    moduleQuickControls: Record<string, boolean>;
    userAssignments: PromotionRoleUserAssignment[];
    policies: {
      restrictToAssignedClasses: boolean;
      viewOnlyNonClassTeachers: boolean;
      requireApprovalForChanges: boolean;
      logAllPermissionChanges: boolean;
      exportOnlyAdminPrincipal: boolean;
    };
  };
  resultCriteriaByGrade?: Record<
    string,
    {
      criteriaName: string;
      evaluationType: "Grade" | "Marks";
      minSubjectPassPct: number;
      includeCoScholastic: boolean;
      subjects: Array<{ subject: string; maxMarks: number; passMarks: number }>;
    }
  >;
}

export interface PromotionAuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorName: string;
  module: string;
  action: string;
  description: string;
  ipAddress: string;
  status: "Success" | "Warning" | "Failed";
  entityType: string;
  entityId: string;
}

export interface PromotionAuditLogsResponse {
  totalLogs: number;
  uniqueUsers: number;
  settingsChanges: number;
  promotionActions: number;
  logs: PromotionAuditLogEntry[];
  moduleSummary: Array<{ module: string; count: number }>;
  topUsers: Array<{ userName: string; count: number }>;
}

const fullMatrixRow = (): PromotionRoleMatrixRow => ({
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  export: true,
});

const limitedMatrixRow = (edit = false, approve = false): PromotionRoleMatrixRow => ({
  view: true,
  create: edit,
  edit,
  delete: false,
  approve,
  export: true,
});

export const DEFAULT_PROMOTION_SETTINGS_SUITE: PromotionSettingsSuiteConfig = {
  general: {
    moduleEnabled: true,
    allowClassPromotion: true,
    allowBulkPromotion: true,
    allowRePromotion: true,
    requireMandatoryConditions: true,
    defaultPromotionType: "GRADE_BASED",
    overallPassPct: 45,
    minSubjectPassPct: 33,
    considerAllSubjects: true,
    enforceAttendance: true,
    minAttendancePct: 75,
    enforceFeeClearance: false,
    enforceAssessmentCompletion: true,
    includeCoScholastic: true,
    checkDisciplinaryClearance: false,
    autoPromotionEnabled: true,
    notifyClassTeacher: true,
    notifyParents: true,
    notifyStudentInApp: false,
    sendSummaryReport: true,
  },
  academicDefaults: {
    curriculum: "CBSE",
    gradingSystem: "A+ to E (Grade Points)",
    examType: "Term Based",
    numberOfTerms: 2,
    resultCalculation: "Percentage (Overall)",
    applySameCriteriaToAllClasses: true,
    considerBestOfTerm: false,
    attendanceSource: "ENTIRE_YEAR",
    selectedSubjectGrade: "Class V",
    subjects: [
      { name: "English", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
      { name: "Mathematics", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
      { name: "Science", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
      { name: "Social Science", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
      { name: "Hindi", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
      { name: "EVS", type: "Compulsory", maxMarks: 100, passMarks: 33, included: true },
    ],
    terms: [
      { term: "Term 1", weightagePct: 50, active: true },
      { term: "Term 2", weightagePct: 50, active: true },
    ],
    assessments: [
      { name: "Periodic Test (PT)", weightagePct: 20, applicableTo: "All Subjects" },
      { name: "Half Yearly (HY)", weightagePct: 30, applicableTo: "All Subjects" },
      { name: "Annual Exam (AE)", weightagePct: 50, applicableTo: "All Subjects" },
    ],
    remarkTemplates: [
      { text: "Promoted to next class.", category: "Promotion" },
      { text: "Promoted with good performance.", category: "Promotion" },
      { text: "Promoted (Needs improvement in certain subjects).", category: "Promotion" },
      { text: "Not promoted (Does not meet promotion criteria).", category: "Not Promotion" },
    ],
  },
  automation: {
    enabled: true,
    enableAutoProcessing: true,
    autoClassUpdate: true,
    autoGenerateReport: true,
    autoSendNotifications: true,
    autoUpdateAcademicYear: true,
    autoArchivePreviousYear: false,
    runInBackground: true,
    runFrequency: "YEARLY",
    runDate: "2026-03-31",
    runTime: "23:00",
    flagUnqualifiedStudents: true,
    allowManualOverride: true,
    keepRetainedInSameClass: true,
    generateExceptionReport: true,
    automationRules: [
      { name: "Promote by Result", condition: "Overall ≥ 45%", action: "Promote", active: true },
      { name: "Min Attendance", condition: "Attendance ≥ 75%", action: "Allow Promotion", active: true },
      { name: "Fee Clearance", condition: "All Dues Cleared", action: "Allow Promotion", active: true },
      { name: "Assessment Complete", condition: "All Assessments Done", action: "Allow Promotion", active: true },
      { name: "Co-scholastic Check", condition: "Minimum Grade B", action: "Allow Promotion", active: false },
    ],
  },
  notifications: {
    notifyParents: true,
    notifyTeachers: true,
    notifyStudents: true,
    sendSummaryReport: true,
    includeResultDetails: true,
    channels: { email: true, sms: true, inApp: true, whatsapp: true, desktop: false },
    triggers: {
      onCompleted: true,
      onNotPromoted: true,
      onResultsPublished: true,
      onClassUpdated: true,
      beforeReminder: false,
      afterReportGenerated: true,
    },
    schedule: {
      enabled: true,
      sendOn: "Promotion Completion",
      timeSlot: "18:00",
      scheduleDate: "2026-03-31",
      repeat: "ONCE",
    },
    templates: [
      {
        id: "tpl-promoted",
        name: "Promotion Successful",
        audience: "Parents, Students",
        channels: ["Email", "SMS", "WhatsApp", "In-App"],
        active: true,
        subject: "Promotion to Next Class – Congratulations!",
        body: "Dear Parent / Guardian, We are pleased to inform you that your ward {{studentName}} ({{admissionNumber}}) has been successfully promoted to {{nextGrade}} for Academic Year {{academicYear}}.",
      },
      {
        id: "tpl-retained",
        name: "Not Promoted",
        audience: "Parents, Students",
        channels: ["Email", "SMS", "WhatsApp"],
        active: true,
        subject: "Academic Progression Review Update",
        body: "Dear Parent / Guardian, {{studentName}} ({{admissionNumber}}) requires academic review before promotion from {{currentGrade}}. Please contact the class teacher.",
      },
      {
        id: "tpl-teacher-summary",
        name: "Promotion Summary (Teacher)",
        audience: "Teachers",
        channels: ["Email"],
        active: true,
        subject: "Class Promotion Batch Summary",
        body: "Class promotion processing has completed for {{currentGrade}} -> {{nextGrade}}.",
      },
      {
        id: "tpl-admin-summary",
        name: "Promotion Summary (Admin)",
        audience: "Administrators",
        channels: ["Email"],
        active: true,
        subject: "School Promotion Batch Report Ready",
        body: "School-wide promotion processing has completed. Audit logs and summary reports are ready.",
      },
    ],
  },
  accessControl: {
    roles: [
      {
        id: "role-admin",
        name: "Administrator",
        accessLevel: "Full Access",
        description: "Complete access to rules, criteria, batch execution, settings & audit exports.",
        active: true,
        matrix: {
          "Promotion Overview": fullMatrixRow(),
          "Promotion List": fullMatrixRow(),
          "Promotion Rules": fullMatrixRow(),
          "Result Criteria": fullMatrixRow(),
          "Promotion History": fullMatrixRow(),
          Settings: fullMatrixRow(),
          "Reports & Export": fullMatrixRow(),
        },
      },
      {
        id: "role-principal",
        name: "Principal",
        accessLevel: "Manage",
        description: "Approve promotions, manage result criteria, and review audit logs.",
        active: true,
        matrix: {
          "Promotion Overview": limitedMatrixRow(true, true),
          "Promotion List": limitedMatrixRow(true, true),
          "Promotion Rules": limitedMatrixRow(true, true),
          "Result Criteria": limitedMatrixRow(true, true),
          "Promotion History": limitedMatrixRow(false, true),
          Settings: limitedMatrixRow(true, true),
          "Reports & Export": limitedMatrixRow(false, true),
        },
      },
      {
        id: "role-teacher",
        name: "Class Teacher",
        accessLevel: "Limited",
        description: "Can view promotion data, update results, and recommend promotion for assigned classes.",
        active: true,
        matrix: {
          "Promotion Overview": { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          "Promotion List": limitedMatrixRow(true, true),
          "Promotion Rules": { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          "Result Criteria": limitedMatrixRow(true, true),
          "Promotion History": { view: true, create: false, edit: false, delete: false, approve: false, export: true },
          Settings: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
          "Reports & Export": { view: true, create: false, edit: false, delete: false, approve: false, export: true },
        },
      },
    ],
    moduleQuickControls: {
      "Promotion Overview": true,
      "Promotion List": true,
      "Promotion Rules": true,
      "Result Criteria": true,
      "Promotion History": true,
      Settings: false,
    },
    userAssignments: [],
    policies: {
      restrictToAssignedClasses: true,
      viewOnlyNonClassTeachers: true,
      requireApprovalForChanges: false,
      logAllPermissionChanges: true,
      exportOnlyAdminPrincipal: true,
    },
  },
};

export interface StudentPromotionOverviewData {
  schoolId: string;
  schoolName: string;
  academicYears: string[];
  grades: string[];
  sections: string[];
  kpis: {
    totalStudents: number;
    eligibleStudents: number;
    promotedCount: number;
    pendingCount: number;
    notPromotedCount: number;
    promotionRatePct: number;
  };
  trendByYear: Array<{ label: string; count: number }>;
  trendByClass: Array<{ grade: string; count: number; percentage: number }>;
  readiness: {
    resultsPublished: boolean;
    attendanceVerified: boolean;
    rulesConfigured: boolean;
  };
  classMatrix: ClassPromotionSummaryRow[];
  decisions: StudentPromotionDecisionRow[];
  rules: StudentPromotionRuleRecord[];
  batches: StudentPromotionBatchRecord[];
  recentPromotions: StudentPromotionDecisionRow[];
  settings: PromotionSettingsConfig;
  settingsSuite: PromotionSettingsSuiteConfig;
  schoolStaff: Array<{ id: string; name: string; role: string }>;
}

export interface PlatformGlobalPromotionsData {
  totalSchools: number;
  kpis: {
    totalStudents: number;
    promotedCount: number;
    pendingCount: number;
    notPromotedCount: number;
    overallPromotionRatePct: number;
    schoolsCompletedCount: number;
  };
  trendByYear: Array<{ label: string; count: number }>;
  schoolSummaries: Array<{
    schoolId: string;
    schoolName: string;
    schoolUniqueId: string | null;
    totalStudents: number;
    promotedCount: number;
    pendingCount: number;
    notPromotedCount: number;
    promotionRatePct: number;
    rulesConfigured: boolean;
    lastBatchAt: string | null;
  }>;
  recentBatches: Array<StudentPromotionBatchRecord & { schoolName: string }>;
}
