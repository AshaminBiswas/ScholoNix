export type PromotionSuiteTab =
  | "overview"
  | "list"
  | "rules"
  | "criteria"
  | "history"
  | "settings";

export type PromotionDecisionStatus =
  | "PROMOTED"
  | "PENDING"
  | "NOT_PROMOTED"
  | "ALUMNI";

export interface StudentPromotionRuleRecord {
  id: string;
  schoolId: string;
  academicYear: string;
  fromGrade: string;
  toGrade: string;
  markAsAlumni: boolean;
  defaultSectionMode: "KEEP_SAME" | "TARGET_SECTION" | "AUTO_BALANCE";
  targetSection: string | null;
  minResultPct: number;
  minAttendancePct: number;
  maxFailedSubjects: number;
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
