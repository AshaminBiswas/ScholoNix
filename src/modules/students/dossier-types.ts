import type {
  StudentActivityRecord,
  StudentGroupRecord,
  StudentRecord,
} from "@/modules/students/types";

export type StudentProfileTab =
  | "profile"
  | "academic"
  | "attendance"
  | "fees"
  | "documents"
  | "communication"
  | "activities"
  | "history";

export interface StudentExtendedProfile {
  category?: string | null;
  religion?: string | null;
  motherTongue?: string | null;
  languagesKnown?: string | null;
  aadhaarMasked?: string | null;
  aadhaarFull?: string | null;
  alternatePhone?: string | null;
  identificationMarks?: string | null;
  specialNeed?: string | null;
  rteConcession?: string | null;
  classTeacher?: string | null;
  houseName?: string | null;
  transportRoute?: string | null;
  hostelName?: string | null;
  permanentAddress?: {
    line1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  } | null;
  currentAddressSameAsPermanent?: boolean;
  father?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    occupation?: string | null;
  } | null;
  mother?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    occupation?: string | null;
  } | null;
  communicationPreferences?: {
    academicUpdates: boolean;
    attendanceAlerts: boolean;
    feeNotifications: boolean;
    schoolAnnouncements: boolean;
    autoFeeReminder: boolean;
  };
  feePlanName?: string | null;
  feeNextDueDate?: string | null;
  feeHeads?: Array<{ head: string; frequency: string; amountPaise: number }>;
  feeInstallments?: Array<{
    installment: string;
    dueDate: string;
    amountPaise: number;
    status: "PAID" | "PENDING" | "PARTIAL";
  }>;
  notices?: Array<{
    id: string;
    title: string;
    publishedOn: string;
    type: string;
    status: "ACTIVE" | "INACTIVE";
  }>;
}

export interface StudentAttendanceItem {
  id: string;
  schoolId: string;
  studentId: string;
  academicYear: string;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY";
  remarks: string | null;
  markedByName: string;
}

export interface StudentExamResultItem {
  id: string;
  schoolId: string;
  studentId: string;
  academicYear: string;
  term: string;
  subject: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  classRank: number | null;
  schoolRank: number | null;
  remarks: string | null;
}

export interface StudentDocumentItem {
  id: string;
  schoolId: string;
  studentId: string;
  documentName: string;
  documentType: string;
  isRequired: boolean;
  fileName: string;
  fileKey: string;
  fileSizeBytes: number;
  mimeType: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedByName: string;
  verifiedByName: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface StudentCommunicationItem {
  id: string;
  schoolId: string;
  studentId: string;
  channel: "MESSAGE" | "EMAIL" | "SMS" | "APP";
  direction: "OUTBOUND" | "INBOUND";
  senderName: string;
  recipientName: string;
  subject: string | null;
  body: string;
  status: "SENT" | "PENDING" | "FAILED";
  attachmentKey: string | null;
  createdAt: string;
}

export interface StudentHomeworkItemRecord {
  id: string;
  schoolId: string;
  studentId: string;
  subject: string;
  title: string;
  assignedOn: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED";
  remarks: string | null;
}

export interface StudentCoCurricularItem {
  id: string;
  schoolId: string;
  studentId: string;
  title: string;
  category: string;
  eventDate: string;
  status: string;
  achievement: string | null;
  remarks: string | null;
  certificateKey: string | null;
}

export interface StudentNoteRemarkItem {
  id: string;
  schoolId: string;
  studentId: string;
  tabScope:
    | "PROFILE"
    | "ACADEMIC"
    | "ATTENDANCE"
    | "FEES"
    | "DOCUMENTS"
    | "ACTIVITIES"
    | "HISTORY";
  kind: "REMARK" | "TASK" | "ACHIEVEMENT";
  title: string | null;
  body: string;
  isCompleted: boolean;
  dueDate: string | null;
  authorName: string;
  createdAt: string;
}

export interface StudentFeePaymentRecord {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  feeHeadsLabel: string;
  amountPaise: number;
  paymentMode: string;
  status: string;
}

export interface StudentDossier360Data {
  student: StudentRecord;
  extendedProfile: StudentExtendedProfile;
  groups: StudentGroupRecord[];
  activities: StudentActivityRecord[];
  attendanceRecords: StudentAttendanceItem[];
  examResults: StudentExamResultItem[];
  documents: StudentDocumentItem[];
  communications: StudentCommunicationItem[];
  homeworkItems: StudentHomeworkItemRecord[];
  coCurricularActivities: StudentCoCurricularItem[];
  notesRemarks: StudentNoteRemarkItem[];
  feeSummary: {
    totalFeePaise: number;
    paidPaise: number;
    outstandingPaise: number;
    status: "PAID" | "PARTIALLY_PAID" | "PENDING";
    feePlanName: string;
    nextDueDate: string | null;
    feeHeads: Array<{ head: string; frequency: string; amountPaise: number }>;
    installments: Array<{
      installment: string;
      dueDate: string;
      amountPaise: number;
      status: "PAID" | "PENDING" | "PARTIAL";
    }>;
    payments: StudentFeePaymentRecord[];
  };
  canRevealSensitiveId: boolean;
}
