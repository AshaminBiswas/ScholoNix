export type ParentNavSection =
  | "directory"
  | "profile"
  | "households"
  | "portal"
  | "communications";

export type GuardianPortalStatus = "NOT_INVITED" | "INVITED" | "ACTIVE" | "SUSPENDED";
export type GuardianLifecycleStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ParentSortField =
  | "fullName"
  | "phone"
  | "wardsCount"
  | "portalStatus"
  | "status"
  | "createdAt";

export interface GuardianCommunicationPrefs {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  inApp: boolean;
  feeReminders: boolean;
  attendanceAlerts: boolean;
  academicUpdates: boolean;
  mediaConsent: boolean;
}

export interface GuardianAddress {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

export interface LinkedWardSummary {
  linkId: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  currentAcademicYear: string;
  currentGrade: string;
  currentSection: string;
  studentStatus: string;
  relation: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  isFeePayer: boolean;
  receivesAcademicAlerts: boolean;
  receivesFeeAlerts: boolean;
  custodyNote: string | null;
  restrictedContact: boolean;
  isActive: boolean;
  linkedAt: string;
  outstandingFeePaise?: number;
}

export interface GuardianCommunicationRecord {
  id: string;
  schoolId: string;
  guardianId: string;
  studentId: string | null;
  studentName?: string | null;
  channel: "SMS" | "EMAIL" | "WHATSAPP" | "APP" | "CALL";
  direction: "OUTBOUND" | "INBOUND";
  senderName: string;
  recipientName: string;
  subject: string | null;
  body: string;
  status: "SENT" | "PENDING" | "FAILED";
  createdAt: string;
}

export interface GuardianRecord {
  id: string;
  schoolId: string;
  userId: string | null;
  fullName: string;
  phone: string;
  normalizedPhone: string | null;
  alternatePhone: string | null;
  email: string | null;
  occupation: string | null;
  employer: string | null;
  education: string | null;
  preferredLanguage: string;
  address: GuardianAddress | null;
  idProofType: string | null;
  idProofMasked: string | null;
  photoKey: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  portalStatus: GuardianPortalStatus;
  portalInvitedAt: string | null;
  status: GuardianLifecycleStatus;
  communicationPrefs: GuardianCommunicationPrefs;
  notes: string | null;
  wards: LinkedWardSummary[];
  recentCommunicationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuardianStudentCandidate {
  id: string;
  admissionNumber: string;
  studentName: string;
  currentGrade: string;
  currentSection: string;
  currentAcademicYear: string;
  status: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string | null;
  guardianRelation: string;
}

export interface HouseholdCluster {
  clusterKey: string;
  householdLabel: string;
  matchBasis: "PHONE" | "EMAIL" | "GUARDIAN";
  matchValue: string;
  guardians: GuardianRecord[];
  students: GuardianStudentCandidate[];
  hasMultiGuardianMergeCandidate: boolean;
  hasUnlinkedSiblings: boolean;
}

export interface ParentFilterParams {
  search?: string;
  relation?: string;
  portalStatus?: "ALL" | GuardianPortalStatus;
  status?: "ALL" | GuardianLifecycleStatus;
  grade?: string;
  multiChildOnly?: boolean;
  pickupAuthorizedOnly?: boolean;
  feePayerOnly?: boolean;
  sortBy?: ParentSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ParentDashboardAnalytics {
  kpis: {
    totalGuardians: number;
    activeGuardians: number;
    linkedHouseholds: number;
    multiChildFamilies: number;
    portalActivated: number;
    portalActivationPct: number;
    pickupAuthorizedCount: number;
    restrictedContactsCount: number;
  };
  relationSlices: Array<{ label: string; count: number; percentage: number; color: string }>;
  portalSlices: Array<{ label: string; count: number; percentage: number; color: string }>;
  gradeDistribution: Array<{ grade: string; count: number; percentage: number }>;
}

export interface ParentWorkspaceSnapshot {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  guardians: GuardianRecord[];
  students: GuardianStudentCandidate[];
  communications: GuardianCommunicationRecord[];
  grades: string[];
  sections: string[];
}

export interface GuardianDossierPayload {
  guardian: GuardianRecord;
  communications: GuardianCommunicationRecord[];
  availableStudents: GuardianStudentCandidate[];
}
