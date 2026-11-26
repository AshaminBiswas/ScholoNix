export type AdmissionsTab = "overview" | "applications" | "enquiries" | "admitted" | "settings";

export type AdmissionEnquiryStatusType =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "CLOSED";

export type AdmissionApplicationStatusType =
  | "UNDER_REVIEW"
  | "DOCUMENTS_PENDING"
  | "SHORTLISTED"
  | "ADMITTED"
  | "REJECTED";

export type DocumentVerificationStatusType = "PENDING" | "VERIFIED" | "REJECTED";

export type AdmissionReminderPriorityType = "INFO" | "WARNING";

export type AdmissionsDatePreset = "all" | "year" | "30d" | "90d" | "custom";

export type AdmissionsTrendGranularity = "month" | "week";

export interface AdmissionDocumentChecklistItem {
  key: string;
  label: string;
  submitted: boolean;
  verified: boolean;
}

export interface AdmissionApplicationRecord {
  id: string;
  schoolId: string;
  applicationCode: string;
  admissionNumber: string | null;
  enquiryId: string | null;
  studentName: string;
  gender: string | null;
  dateOfBirth: string | null;
  gradeApplied: string;
  academicYear: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string | null;
  previousSchool: string | null;
  status: AdmissionApplicationStatusType;
  verificationStatus: DocumentVerificationStatusType;
  verificationNotes: string | null;
  documentsChecklist: AdmissionDocumentChecklistItem[];
  appliedAt: string;
  shortlistedAt: string | null;
  admittedAt: string | null;
  rejectedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionEnquiryRecord {
  id: string;
  schoolId: string;
  enquiryCode: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  gradeApplied: string;
  academicYear: string;
  source: string;
  status: AdmissionEnquiryStatusType;
  notes: string | null;
  convertedApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionSettingRecord {
  schoolId: string;
  currentAcademicYear: string;
  applicationDeadline: string | null;
  applicationPrefix: string;
  enabledGrades: string[];
  updatedAt: string;
}

export interface AdmissionReminderRecord {
  id: string;
  schoolId: string;
  title: string;
  academicYear: string | null;
  dueDate: string | null;
  priority: AdmissionReminderPriorityType;
  isCompleted: boolean;
  isSystemGenerated?: boolean;
  createdAt: string;
}

export interface AdmissionActivityRecord {
  id: string;
  schoolId: string;
  applicationId: string | null;
  enquiryId: string | null;
  actorId: string | null;
  actorName: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface AdmissionsKpiMetric {
  value: number;
  previousValue: number;
  deltaPercent: number | null;
}

export interface AdmissionsConversionMetric {
  rate: number;
  previousRate: number;
  deltaPercentagePoints: number | null;
}

export interface AdmissionsStatusSlice {
  status: AdmissionApplicationStatusType;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AdmissionsGradeCount {
  grade: string;
  shortLabel: string;
  count: number;
}

export interface AdmissionsTrendPoint {
  key: string;
  label: string;
  count: number;
}

export interface AdmissionsOverviewFilters {
  academicYear: string;
  grade: string;
  status: AdmissionApplicationStatusType | "all";
  verificationStatus: DocumentVerificationStatusType | "all";
  datePreset: AdmissionsDatePreset;
  from: string;
  to: string;
  granularity: AdmissionsTrendGranularity;
  search: string;
  page: number;
  pageSize: number;
}

export interface AdmissionsOverviewData {
  schoolId: string;
  filters: AdmissionsOverviewFilters;
  availableAcademicYears: string[];
  availableGrades: string[];
  settings: AdmissionSettingRecord;
  kpis: {
    totalApplications: AdmissionsKpiMetric;
    shortlisted: AdmissionsKpiMetric;
    admitted: AdmissionsKpiMetric;
    conversionRate: AdmissionsConversionMetric;
  };
  funnel: {
    enquiries: number;
    applications: number;
    shortlistedPipeline: number;
    admitted: number;
    conversionRate: number;
    deltaPercentagePoints: number | null;
  };
  trend: AdmissionsTrendPoint[];
  byGrade: AdmissionsGradeCount[];
  statusBreakdown: AdmissionsStatusSlice[];
  applications: AdmissionApplicationRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  enquiries: AdmissionEnquiryRecord[];
  admittedStudents: AdmissionApplicationRecord[];
  activities: AdmissionActivityRecord[];
  reminders: AdmissionReminderRecord[];
  permissions: {
    canWrite: boolean;
    canVerify: boolean;
    canExport: boolean;
    canManageSettings: boolean;
  };
}

export const DEFAULT_ADMISSION_GRADES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class I",
  "Class II",
  "Class III",
  "Class IV",
  "Class V",
  "Class VI",
  "Class VII",
  "Class VIII",
  "Class IX",
  "Class X",
  "Class XI",
  "Class XII",
] as const;

export const DEFAULT_DOCUMENT_CHECKLIST: AdmissionDocumentChecklistItem[] = [
  { key: "birth_certificate", label: "Birth Certificate", submitted: false, verified: false },
  { key: "transfer_certificate", label: "Transfer Certificate", submitted: false, verified: false },
  { key: "previous_report_card", label: "Previous Report Card", submitted: false, verified: false },
  { key: "address_proof", label: "Address Proof", submitted: false, verified: false },
  { key: "student_photo", label: "Passport Size Photo", submitted: false, verified: false },
];

export const ADMISSION_STATUS_META: Record<
  AdmissionApplicationStatusType,
  { label: string; color: string; bgClass: string; textClass: string; borderClass: string }
> = {
  UNDER_REVIEW: {
    label: "Under Review",
    color: "#8B5CF6",
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800/70",
  },
  DOCUMENTS_PENDING: {
    label: "Documents Pending",
    color: "#F59E0B",
    bgClass: "bg-sky-50 dark:bg-sky-950/60",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-200 dark:border-sky-800/70",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    color: "#38BDF8",
    bgClass: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    textClass: "text-[#5B21B6] dark:text-[#CBB8FF]",
    borderClass: "border-[#DDD6FE] dark:border-[#4D3B94]",
  },
  ADMITTED: {
    label: "Admitted",
    color: "#22C55E",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800/70",
  },
  REJECTED: {
    label: "Rejected",
    color: "#F472B6",
    bgClass: "bg-rose-50 dark:bg-rose-950/60",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-200 dark:border-rose-800/70",
  },
};

export const DOCUMENT_VERIFICATION_META: Record<
  DocumentVerificationStatusType,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  PENDING: {
    label: "Pending",
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800/70",
  },
  VERIFIED: {
    label: "Verified",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800/70",
  },
  REJECTED: {
    label: "Rejected",
    bgClass: "bg-rose-50 dark:bg-rose-950/60",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-200 dark:border-rose-800/70",
  },
};

export const ENQUIRY_STATUS_META: Record<
  AdmissionEnquiryStatusType,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  NEW: {
    label: "New",
    bgClass: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    textClass: "text-[#5B21B6] dark:text-[#CBB8FF]",
    borderClass: "border-[#DDD6FE] dark:border-[#4D3B94]",
  },
  CONTACTED: {
    label: "Contacted",
    bgClass: "bg-sky-50 dark:bg-sky-950/60",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-200 dark:border-sky-800/70",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800/70",
  },
  CONVERTED: {
    label: "Converted",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800/70",
  },
  CLOSED: {
    label: "Closed",
    bgClass: "bg-slate-100 dark:bg-slate-800/80",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-200 dark:border-slate-700",
  },
};
