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

export type AdmissionTypeValue = "FRESH" | "TRANSFER" | "RE_ADMISSION" | "OTHER";

export type AdmittedEnrollmentStatusValue = "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";

export type AdmittedFeePaymentStatusValue = "PAID" | "PARTIAL" | "PENDING";

export type AdmittedFeeHeadValue =
  | "Admission Fee"
  | "Tuition Fee"
  | "Annual Charges"
  | "Transport Fee"
  | "Hostel Fee";

export type AdmittedPaymentModeValue =
  | "UPI"
  | "Net Banking"
  | "Card"
  | "Cash"
  | "Cheque";

export type AdmissionCommunicationMode = "Phone" | "Email" | "SMS" | "WhatsApp";

export type AdmissionDocumentType =
  | "student_photo"
  | "father_aadhaar"
  | "mother_aadhaar"
  | "birth_certificate"
  | "student_aadhaar"
  | "last_marksheet";

export interface AdmissionUploadedDocument {
  key: string;
  docType: AdmissionDocumentType;
  label: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedAt: string;
}

export interface AdmissionAddressPayload {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface AdmissionStudentDetailsPayload {
  email?: string;
  phone?: string;
  address: AdmissionAddressPayload;
}

export interface AdmissionGuardianPersonPayload {
  fullName: string;
  relationship: string;
  occupation?: string;
  annualIncome?: string;
  email?: string;
  phone?: string;
}

export interface AdmissionGuardianDetailsPayload {
  primary: AdmissionGuardianPersonPayload;
  secondary?: AdmissionGuardianPersonPayload | null;
  sameAsStudentAddress: boolean;
  address?: AdmissionAddressPayload | null;
  emergencyContactNumber: string;
  preferredCommunicationMode: AdmissionCommunicationMode;
}

export interface AdmissionPreviousAcademicRow {
  id: string;
  academicYear: string;
  standard: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
}

export interface AdmissionAcademicDetailsPayload {
  previousSchoolName?: string;
  boardCurriculum?: string;
  lastStandardStudied?: string;
  yearOfCompletion?: string;
  schoolAddress?: string;
  totalMarks?: number | null;
  marksObtained?: number | null;
  percentage?: number | null;
  previousAcademics?: AdmissionPreviousAcademicRow[];
}

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
  admissionType?: AdmissionTypeValue;
  enrollmentStatus?: AdmittedEnrollmentStatusValue;
  isDraft?: boolean;
  currentStep?: number;
  studentPhotoKey?: string | null;
  nationality?: string | null;
  bloodGroup?: string | null;
  studentIdNumber?: string | null;
  studentDetails?: AdmissionStudentDetailsPayload | null;
  guardianDetails?: AdmissionGuardianDetailsPayload | null;
  academicDetails?: AdmissionAcademicDetailsPayload | null;
  uploadedDocuments?: AdmissionUploadedDocument[];
  declarationAccepted?: boolean;
  generatedPdfUrl?: string | null;
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
  enquiryDate?: string;
  studentName: string;
  studentDob?: string | null;
  studentGender?: string | null;
  guardianName: string;
  guardianRelation?: string | null;
  guardianPhone: string;
  guardianEmail: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  gradeApplied: string;
  academicYear: string;
  source: string;
  enquiryType?: string;
  status: AdmissionEnquiryStatusType;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  nextFollowUpAt?: string | null;
  hasSiblingsInSchool?: boolean;
  interestedInTransport?: boolean;
  interestedInHostel?: boolean;
  requiresSpecialSupport?: boolean;
  isDraft?: boolean;
  notes: string | null;
  convertedApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EnquiryFollowUpTypeValue =
  | "Phone Call"
  | "Email"
  | "WhatsApp"
  | "Meeting"
  | "Campus Visit";

export type EnquiryFollowUpStatusValue =
  | "UPCOMING"
  | "DUE_TODAY"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type EnquiryCommunicationChannelValue =
  | "Email"
  | "SMS"
  | "WhatsApp"
  | "Phone Call";

export type EnquiryNoteCategoryValue =
  | "Admission Related"
  | "Parent Requirement"
  | "Follow-up"
  | "Other";

export interface AdmissionEnquirySourceRecord {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  colorToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionEnquiryFollowUpRecord {
  id: string;
  schoolId: string;
  enquiryId: string;
  enquiryCode?: string;
  studentName?: string;
  guardianName?: string;
  academicYear?: string;
  followUpType: EnquiryFollowUpTypeValue;
  scheduledAt: string;
  completedAt: string | null;
  status: EnquiryFollowUpStatusValue;
  assignedToUserId: string | null;
  assignedToName: string | null;
  notes: string;
  outcome: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryCommunicationAttachment {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedAt: string;
}

export interface AdmissionEnquiryCommunicationRecord {
  id: string;
  schoolId: string;
  enquiryId: string;
  channel: EnquiryCommunicationChannelValue;
  recipient: string;
  cc: string | null;
  bcc: string | null;
  subject: string;
  message: string;
  attachments: EnquiryCommunicationAttachment[];
  status: "SENT" | "COMPLETED" | "FAILED";
  sentByUserId: string | null;
  sentByName: string;
  sentAt: string;
  createdAt: string;
}

export interface AdmissionEnquiryNoteRecord {
  id: string;
  schoolId: string;
  enquiryId: string;
  category: EnquiryNoteCategoryValue;
  title: string;
  content: string;
  createdByUserId: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolStaffOption {
  id: string;
  name: string;
  role: string;
}

export interface EnquiryDossierData {
  enquiry: AdmissionEnquiryRecord;
  followUps: AdmissionEnquiryFollowUpRecord[];
  communications: AdmissionEnquiryCommunicationRecord[];
  notes: AdmissionEnquiryNoteRecord[];
  activities: AdmissionActivityRecord[];
  staffOptions: SchoolStaffOption[];
}

export const DEFAULT_ENQUIRY_SOURCES: ReadonlyArray<{
  name: string;
  description: string;
  colorToken: string;
}> = [
  {
    name: "Website",
    description: "Enquiries from school website (enquiry form)",
    colorToken: "violet",
  },
  {
    name: "Walk-In",
    description: "Enquiries from direct walk-in at school",
    colorToken: "sky",
  },
  {
    name: "Referral",
    description: "Enquiries through parent or alumni referral",
    colorToken: "cyan",
  },
  {
    name: "Social Media",
    description: "Enquiries from social media campaigns",
    colorToken: "emerald",
  },
  {
    name: "Event / Campaign",
    description: "Enquiries from school events, fairs or campaigns",
    colorToken: "amber",
  },
  {
    name: "Phone Call",
    description: "Direct telephone admission enquiries",
    colorToken: "indigo",
  },
  {
    name: "Other",
    description: "Other enquiry channels and partner referrals",
    colorToken: "rose",
  },
];

export type AdmissionModeValue = "ONLINE_OFFLINE" | "ONLINE_ONLY" | "OFFLINE_ONLY";

export type AdmissionApprovalProcessValue = "MULTI_LEVEL" | "SINGLE_LEVEL" | "AUTO_APPROVE";

export type AdmissionCriteriaTypeValue = "AGE_BASED" | "MERIT_BASED" | "AGE_AND_MERIT";

export interface AdmissionDocumentRequirementItem {
  id: string;
  label: string;
  mandatory: boolean;
}

export interface AdmissionSeatQuotaItem {
  id: string;
  name: string;
  percentage: number;
}

export interface AdmissionCustomFieldItem {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required: boolean;
}

export interface AdmissionExtendedSettings {
  admissionMode: AdmissionModeValue;
  gradeRangeFrom: string;
  gradeRangeTo: string;
  admissionEnabled: boolean;
  startDate: string | null;
  lateAdmissionEnabled: boolean;
  lateFeeAmount: number;
  onlineFormEnabled: boolean;
  allowGradeSelection: boolean;
  allowMultipleApplications: boolean;
  applicationFeeEnabled: boolean;
  applicationFeeAmount: number;
  documentRequirements: AdmissionDocumentRequirementItem[];
  approvalProcess: AdmissionApprovalProcessValue;
  criteriaEnabled: boolean;
  criteriaType: AdmissionCriteriaTypeValue;
  minAgeYears: number;
  maxAgeYears: number;
  ageAsOfDate: string;
  minPercentage: number;
  totalSeatsPerClass: number;
  quotas: AdmissionSeatQuotaItem[];
  sendConfirmationNotification: boolean;
  sendVerificationUpdates: boolean;
  notifyApprovalRejection: boolean;
  enableOfferLetter: boolean;
  emailTemplate: string;
  smsTemplate: string;
  crmIntegrationEnabled: boolean;
  referralCodeEnabled: boolean;
  customFields: AdmissionCustomFieldItem[];
}

export interface AdmissionSettingRecord {
  schoolId: string;
  currentAcademicYear: string;
  applicationDeadline: string | null;
  applicationPrefix: string;
  enabledGrades: string[];
  extendedConfig?: AdmissionExtendedSettings;
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

export interface AdmissionFeeLedgerRecord {
  id: string;
  schoolId: string;
  applicationId: string;
  academicYear: string;
  totalFeePaise: number;
  concessionPaise: number;
  concessionReason: string | null;
  currency: string;
  paidPaise: number;
  outstandingPaise: number;
  paymentStatus: AdmittedFeePaymentStatusValue;
  lastPaymentDate: string | null;
  updatedAt: string;
}

export interface AdmissionFeePaymentRecord {
  id: string;
  schoolId: string;
  applicationId: string;
  studentName?: string;
  admissionNumber?: string | null;
  receiptNumber: string;
  idempotencyKey: string;
  feeHead: AdmittedFeeHeadValue;
  amountPaise: number;
  paymentDate: string;
  paymentMode: AdmittedPaymentModeValue;
  referenceNo: string | null;
  remarks: string | null;
  recordedByUserId: string | null;
  recordedByName: string;
  createdAt: string;
}

export interface AdmittedStudentFeeSummary {
  totalStudents: number;
  totalFeePaise: number;
  totalConcessionPaise: number;
  totalCollectedPaise: number;
  totalOutstandingPaise: number;
  collectionRate: number;
  fullyPaidCount: number;
  partialPaidCount: number;
  pendingCount: number;
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
  drafts?: AdmissionApplicationRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  enquiries: AdmissionEnquiryRecord[];
  enquirySources?: AdmissionEnquirySourceRecord[];
  enquiryFollowUps?: AdmissionEnquiryFollowUpRecord[];
  staffOptions?: SchoolStaffOption[];
  admittedStudents: AdmissionApplicationRecord[];
  admittedFeeLedgers?: AdmissionFeeLedgerRecord[];
  admittedFeePayments?: AdmissionFeePaymentRecord[];
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

export function createDefaultExtendedSettings(): AdmissionExtendedSettings {
  return {
    admissionMode: "ONLINE_OFFLINE",
    gradeRangeFrom: "Nursery",
    gradeRangeTo: "Class XII",
    admissionEnabled: true,
    startDate: null,
    lateAdmissionEnabled: true,
    lateFeeAmount: 500,
    onlineFormEnabled: true,
    allowGradeSelection: true,
    allowMultipleApplications: false,
    applicationFeeEnabled: true,
    applicationFeeAmount: 1000,
    documentRequirements: [
      { id: "student_aadhaar", label: "Student Aadhar Card", mandatory: true },
      { id: "birth_certificate", label: "Birth Certificate", mandatory: true },
      { id: "parent_aadhaar", label: "Parent/Guardian Aadhar Card", mandatory: true },
      { id: "previous_tc", label: "Previous School TC", mandatory: false },
      { id: "address_proof", label: "Address Proof", mandatory: true },
    ],
    approvalProcess: "MULTI_LEVEL",
    criteriaEnabled: true,
    criteriaType: "AGE_BASED",
    minAgeYears: 3,
    maxAgeYears: 18,
    ageAsOfDate: `${new Date().getFullYear()}-03-31`,
    minPercentage: 50,
    totalSeatsPerClass: 60,
    quotas: [
      { id: "general", name: "General", percentage: 70 },
      { id: "sibling", name: "Sibling", percentage: 10 },
      { id: "staff_ward", name: "Staff Ward", percentage: 5 },
      { id: "management", name: "Management", percentage: 15 },
    ],
    sendConfirmationNotification: true,
    sendVerificationUpdates: true,
    notifyApprovalRejection: true,
    enableOfferLetter: true,
    emailTemplate: "Admission Confirmation",
    smsTemplate: "Application Received",
    crmIntegrationEnabled: true,
    referralCodeEnabled: false,
    customFields: [],
  };
}

export function mergeExtendedSettings(
  raw?: Partial<AdmissionExtendedSettings> | null,
): AdmissionExtendedSettings {
  const defaults = createDefaultExtendedSettings();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }
  return {
    ...defaults,
    ...raw,
    documentRequirements:
      Array.isArray(raw.documentRequirements) && raw.documentRequirements.length > 0
        ? raw.documentRequirements.map((d) => ({ ...d }))
        : defaults.documentRequirements,
    quotas:
      Array.isArray(raw.quotas) && raw.quotas.length > 0
        ? raw.quotas.map((q) => ({ ...q }))
        : defaults.quotas,
    customFields: Array.isArray(raw.customFields)
      ? raw.customFields.map((f) => ({ ...f }))
      : defaults.customFields,
  };
}

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
