export type PlatformTab =
  | "overview"
  | "employees"
  | "recruitment"
  | "attendance"
  | "leaves"
  | "payroll"
  | "expenses"
  | "projects"
  | "tasks"
  | "schools"
  | "users"
  | "sales"
  | "documents"
  | "reports"
  | "billing"
  | "support"
  | "audit"
  | "announcements"
  | "admins"
  | "settings";

export type PlatformOverviewPeriodDays = 7 | 30 | 90 | 365;

export type PlatformAdminRoleValue =
  | "SUPER_ADMIN"
  | "OPERATIONS"
  | "BILLING_MANAGER"
  | "SUPPORT_AGENT";

export type PlatformAdminStatusValue = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface PlatformAdminPasskeyRecord {
  id: string;
  adminId: string;
  credentialId: string;
  deviceName: string;
  algorithm: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface PlatformAdminRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: PlatformAdminRoleValue;
  status: PlatformAdminStatusValue;
  department: string | null;
  lastLoginAt: string | null;
  createdByAdminId: string | null;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  passkeyCount?: number;
  passkeys?: PlatformAdminPasskeyRecord[];
  activeSessionCount?: number;
  createdAt: string;
}

export type SchoolStatusValue = "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type SaaSPlanValue = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
export type SaaSBillingCycleValue = "MONTHLY" | "YEARLY";
export type SaaSSubscriptionStatusValue = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
export type PlatformInvoiceStatusValue = "PENDING" | "PAID" | "OVERDUE" | "VOID";
export type PlatformTicketSourceValue = "CONTACT_FORM" | "FEEDBACK_FORM" | "PORTAL_SUPPORT";
export type PlatformTicketStatusValue = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type PlatformTicketPriorityValue = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PlatformAnnouncementSeverityValue = "INFO" | "WARNING" | "MAINTENANCE";

export interface PlatformModuleFlags {
  admissions: boolean;
  enquiries: boolean;
  admittedStudents: boolean;
  feeLedgers: boolean;
  customFields: boolean;
  crmIntegration: boolean;
  reportsExport: boolean;
  smsAlerts: boolean;
}

export const DEFAULT_PLATFORM_MODULE_FLAGS: PlatformModuleFlags = {
  admissions: true,
  enquiries: true,
  admittedStudents: true,
  feeLedgers: true,
  customFields: true,
  crmIntegration: true,
  reportsExport: true,
  smsAlerts: true,
};

export function mergePlatformModuleFlags(
  raw?: Partial<PlatformModuleFlags> | Record<string, unknown> | null,
): PlatformModuleFlags {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PLATFORM_MODULE_FLAGS };
  }
  const src = raw as Record<string, unknown>;
  return {
    admissions: typeof src.admissions === "boolean" ? src.admissions : true,
    enquiries: typeof src.enquiries === "boolean" ? src.enquiries : true,
    admittedStudents:
      typeof src.admittedStudents === "boolean" ? src.admittedStudents : true,
    feeLedgers: typeof src.feeLedgers === "boolean" ? src.feeLedgers : true,
    customFields: typeof src.customFields === "boolean" ? src.customFields : true,
    crmIntegration:
      typeof src.crmIntegration === "boolean" ? src.crmIntegration : true,
    reportsExport: typeof src.reportsExport === "boolean" ? src.reportsExport : true,
    smsAlerts: typeof src.smsAlerts === "boolean" ? src.smsAlerts : true,
  };
}

export const SAAS_PLAN_CATALOG: Record<
  SaaSPlanValue,
  {
    name: string;
    monthlyPaise: number;
    yearlyMonthlyEquivalentPaise: number;
    yearlyTotalPaise: number;
    defaultMaxStudents: number;
    defaultMaxStaff: number;
  }
> = {
  STARTER: {
    name: "Starter",
    monthlyPaise: 199_900, // ₹1,999
    yearlyMonthlyEquivalentPaise: 159_900, // ₹1,599/mo
    yearlyTotalPaise: 1_918_800, // ₹19,188/yr
    defaultMaxStudents: 500,
    defaultMaxStaff: 50,
  },
  PROFESSIONAL: {
    name: "Professional",
    monthlyPaise: 399_900, // ₹3,999
    yearlyMonthlyEquivalentPaise: 319_900, // ₹3,199/mo
    yearlyTotalPaise: 3_838_800, // ₹38,388/yr
    defaultMaxStudents: 2000,
    defaultMaxStaff: 200,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyPaise: 799_900, // ₹7,999
    yearlyMonthlyEquivalentPaise: 639_900, // ₹6,399/mo
    yearlyTotalPaise: 7_678_800, // ₹76,788/yr
    defaultMaxStudents: 10000,
    defaultMaxStaff: 1000,
  },
};

export interface PlatformSchoolUserItem {
  id: string;
  schoolId: string | null;
  schoolName?: string | null;
  schoolSlug?: string | null;
  schoolUniqueId?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  activeSessionCount?: number;
  createdAt: string;
}

export interface PlatformSchoolItem {
  id: string;
  name: string;
  slug: string;
  uniqueId: string | null;
  code: string | null;
  category: string | null;
  affiliationBoard: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  country: string;
  status: SchoolStatusValue | string;
  plan: SaaSPlanValue;
  billingCycle: SaaSBillingCycleValue;
  subscriptionStatus: SaaSSubscriptionStatusValue;
  maxStudentsLimit: number;
  maxStaffLimit: number;
  enabledModules: PlatformModuleFlags;
  suspendedReason: string | null;
  internalNotes: string | null;
  onboardingStep: number;
  onboardingDone: boolean;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface PlatformSchoolEntry {
  school: PlatformSchoolItem;
  users: PlatformSchoolUserItem[];
  counts: {
    users: number;
    staffCount?: number;
    studentCount?: number;
    applications: number;
    enquiries: number;
    admitted: number;
    feeCollectedPaise: number;
    saasBilledPaise: number;
  };
}

export interface PlatformInvoiceRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolUniqueId: string | null;
  invoiceNumber: string;
  idempotencyKey: string;
  plan: SaaSPlanValue;
  billingCycle: SaaSBillingCycleValue;
  amountPaise: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: PlatformInvoiceStatusValue;
  paymentMode: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PlatformSupportTicketRecord {
  id: string;
  referenceCode: string;
  source: PlatformTicketSourceValue;
  schoolId: string | null;
  userId: string | null;
  senderName: string;
  senderEmail: string | null;
  senderPhone: string | null;
  schoolName: string | null;
  role: string | null;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  sentiment: string | null;
  module: string | null;
  status: PlatformTicketStatusValue;
  priority: PlatformTicketPriorityValue;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAnnouncementRecord {
  id: string;
  title: string;
  message: string;
  severity: PlatformAnnouncementSeverityValue;
  targetPlan: SaaSPlanValue | null;
  targetSchoolId: string | null;
  targetSchoolName: string | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export interface PlatformAuditLogRecord {
  id: string;
  schoolId: string | null;
  schoolName: string | null;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PlatformHealthSnapshot {
  databaseConnected: boolean;
  dbLatencyMs: number | null;
  redisConfigured: boolean;
  redisLatencyMs?: number | null;
  avgApiResponseMs?: number | null;
  blockedRequests24h?: number;
  lastCheckedIso?: string;
  platformSchemaProvisioned: boolean;
  admissionsSchemaProvisioned: boolean;
  serverTimeIso: string;
  environment: string;
}

export interface PlatformOverviewData {
  periodDays?: PlatformOverviewPeriodDays;
  kpis: {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    suspendedSchools: number;
    totalUsers: number;
    totalApplications: number;
    totalEnquiries: number;
    totalAdmittedStudents: number;
    studentFeeCollectedPaise: number;
    saasRevenueCollectedPaise: number;
    saasPendingPaise: number;
    openSupportTickets: number;
    mrrPaise?: number;
    feeVolumePeriodPaise?: number;
    trialsExpiringNext7Days?: number;
    schoolsDelta?: number;
    schoolsGrowthPct?: number;
    activeSchoolsDelta?: number;
    activeSchoolsGrowthPct?: number;
    usersDelta?: number;
    usersGrowthPct?: number;
    admissionsDelta?: number;
    admissionsGrowthPct?: number;
    feeVolumeGrowthPct?: number;
    mrrGrowthPct?: number;
    ticketsDelta?: number;
    ticketsGrowthPct?: number;
  };
  planBreakdown: Array<{ plan: SaaSPlanValue; label: string; count: number; percentage: number }>;
  subscriptionBreakdown?: Array<{
    status: SaaSSubscriptionStatusValue;
    label: string;
    count: number;
    percentage: number;
  }>;
  boardBreakdown: Array<{ board: string; count: number }>;
  signupTrend: Array<{ label: string; count: number }>;
  dailySignupTrend?: Array<{ date: string; label: string; count: number }>;
  expiringTrials: PlatformSchoolItem[];
  recentRegistrations?: PlatformSchoolItem[];
  recentOpenTickets?: PlatformSupportTicketRecord[];
  recentAuditLogs: PlatformAuditLogRecord[];
  health: PlatformHealthSnapshot;
}

export interface PlatformSchoolDataInspectResult {
  schoolId: string;
  settings: Record<string, unknown> | null;
  applications: Array<{
    id: string;
    applicationCode: string;
    admissionNumber: string | null;
    studentName: string;
    gender?: string | null;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    nationality?: string | null;
    studentIdNumber?: string | null;
    previousSchool?: string | null;
    admissionType?: string | null;
    gradeApplied: string;
    academicYear: string;
    guardianName: string;
    guardianRelation?: string | null;
    guardianPhone: string;
    guardianEmail?: string | null;
    fatherName?: string | null;
    fatherPhone?: string | null;
    motherName?: string | null;
    motherPhone?: string | null;
    studentDetails?: Record<string, unknown> | null;
    guardianDetails?: Record<string, unknown> | null;
    academicDetails?: Record<string, unknown> | null;
    documentsChecklist?: Array<{
      key: string;
      label: string;
      submitted: boolean;
      verified: boolean;
    }>;
    uploadedDocuments?: Array<{
      key: string;
      docType: string;
      label: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      uploadedAt: string;
    }>;
    status: string;
    verificationStatus: string;
    verificationNotes?: string | null;
    enrollmentStatus: string;
    appliedAt: string;
    shortlistedAt?: string | null;
    verifiedAt?: string | null;
    admittedAt?: string | null;
    rejectedAt?: string | null;
  }>;
  enquiries: Array<{
    id: string;
    enquiryCode: string;
    studentName: string;
    guardianName: string;
    guardianPhone: string;
    gradeApplied: string;
    academicYear: string;
    source: string;
    status: string;
    createdAt: string;
  }>;
  feeLedgers: Array<{
    id: string;
    applicationId: string;
    studentName: string;
    academicYear: string;
    totalFeePaise: number;
    concessionPaise: number;
    paidPaise: number;
    outstandingPaise: number;
    updatedAt: string;
  }>;
  feePayments: Array<{
    id: string;
    applicationId?: string;
    receiptNumber: string;
    studentName: string;
    feeHead: string;
    amountPaise: number;
    paymentMode: string;
    paymentDate: string;
  }>;
  saasInvoices?: PlatformInvoiceRecord[];
  supportTickets?: PlatformSupportTicketRecord[];
}
