export type StudentNavSection =
  | "dashboard"
  | "list"
  | "profile"
  | "enrolment"
  | "promotion"
  | "transfer"
  | "inactive"
  | "alumni"
  | "settings";

export type StudentListSubTab =
  | "list"
  | "bulk"
  | "groups"
  | "cards"
  | "export";

export type StudentLifecycleStatusValue =
  | "ACTIVE"
  | "INACTIVE"
  | "TRANSFERRED"
  | "ALUMNI"
  | "WITHDRAWN";

export type StudentEnrollmentStatusValue =
  | "ENROLLED"
  | "PROMOTED"
  | "RETAINED"
  | "TRANSFERRED_OUT"
  | "GRADUATED";

export type StudentTransferTypeValue = "TRANSFER_IN" | "TRANSFER_OUT";

export type StudentSortField =
  | "admissionNumber"
  | "studentName"
  | "grade"
  | "section"
  | "admissionDate"
  | "status";

export interface StudentFilterParams {
  academicYear?: string;
  grade?: string;
  section?: string;
  status?: "ALL" | StudentLifecycleStatusValue;
  gender?: "ALL" | "Male" | "Female" | "Other";
  fromDate?: string;
  toDate?: string;
  search?: string;
  groupId?: string;
  sortBy?: StudentSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StudentEnrollmentRecord {
  id: string;
  schoolId: string;
  studentId: string;
  academicYear: string;
  grade: string;
  section: string;
  rollNumber: string | null;
  status: StudentEnrollmentStatusValue;
  isCurrent: boolean;
  promotedFromEnrollmentId: string | null;
  remarks: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface StudentTransferRecord {
  id: string;
  schoolId: string;
  studentId: string;
  transferType: StudentTransferTypeValue;
  transferDate: string;
  tcNumber: string | null;
  counterpartySchool: string | null;
  reason: string | null;
  clearanceStatus: string;
  fromGrade: string | null;
  toGrade: string | null;
  processedByName: string | null;
}

export interface StudentGroupRecord {
  id: string;
  schoolId: string;
  name: string;
  category: string;
  colorToken: string;
  description: string | null;
  memberStudentIds: string[];
}

export interface StudentActivityRecord {
  id: string;
  schoolId: string;
  studentId: string | null;
  actorName: string;
  actionType: string;
  summary: string;
  createdAt: string;
}

export interface StudentSettingRecord {
  schoolId: string;
  defaultSections: string[];
  sectionsByGrade: Record<string, string[]>;
  rollNumberMode: "AUTO_ALPHA" | "MANUAL";
  requireTcOnTransfer: boolean;
  idCardConfig: {
    showBloodGroup: boolean;
    showGuardianPhone: boolean;
    showEmergencyContact: boolean;
    motto?: string;
  };
  promotionConfig: {
    finalGradeForAlumni: string;
    autoAssignRollNumbers: boolean;
  };
}

export interface StudentRecord {
  id: string;
  schoolId: string;
  applicationId: string | null;
  admissionNumber: string;
  studentIdNumber: string | null;
  studentName: string;
  gender: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  photoKey: string | null;
  email: string | null;
  phone: string | null;
  address: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string | null;
  guardianDetails: Record<string, unknown> | null;
  previousSchool: string | null;
  academicDetails: Record<string, unknown> | null;
  medicalNotes: string | null;
  admissionType: string;
  admissionDate: string;
  status: StudentLifecycleStatusValue;
  currentAcademicYear: string;
  currentGrade: string;
  currentSection: string;
  currentRollNumber: string | null;
  graduationYear: string | null;
  inactiveReason: string | null;
  groupIds: string[];
  enrollments: StudentEnrollmentRecord[];
  transfers: StudentTransferRecord[];
  feeSummary?: {
    totalFeePaise: number;
    paidPaise: number;
    outstandingPaise: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSliceDatum {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface StudentDashboardKpis {
  totalStudents: number;
  totalGrowthPct: number;
  activeStudents: number;
  activeGrowthPct: number;
  inactiveStudents: number;
  inactiveGrowthPct: number;
  newEnrolments: number;
  newEnrolmentsGrowthPct: number;
  transferredCount: number;
  transferredGrowthPct: number;
  alumniCount: number;
  alumniGrowthPct: number;
}

export interface StudentWorkspaceSnapshot {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  students: StudentRecord[];
  groups: StudentGroupRecord[];
  activities: StudentActivityRecord[];
  settings: StudentSettingRecord;
  academicYears: string[];
  grades: string[];
  sections: string[];
  pendingAdmittedCount: number;
}

export interface StudentDashboardAnalytics {
  kpis: StudentDashboardKpis;
  enrolmentTrend: Array<{ label: string; count: number }>;
  statusSlices: StudentSliceDatum[];
  gradeBars: Array<{ grade: string; count: number; percentage: number }>;
  genderSlices: StudentSliceDatum[];
  keyInsights: {
    enrolmentGrowthPct: number;
    newEnrolments: number;
    transferIn: number;
    transferOut: number;
    promotionPending: number;
    inactiveStudents: number;
  };
  recentStudents: StudentRecord[];
}

export interface PlatformGlobalStudentsAnalytics {
  totalSchoolsWithStudents: number;
  analytics: StudentDashboardAnalytics;
  schoolSummaries: Array<{
    schoolId: string;
    schoolName: string;
    schoolUniqueId: string | null;
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    transferredCount: number;
    alumniCount: number;
    newEnrolments: number;
  }>;
  students: Array<StudentRecord & { schoolName: string; schoolUniqueId: string | null }>;
  academicYears: string[];
  grades: string[];
  sections: string[];
}
