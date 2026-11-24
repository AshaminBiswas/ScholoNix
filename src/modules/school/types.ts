export interface StudentSectionBreakdown {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AttendanceStats {
  rate: number;
  present: number;
  absent: number;
  notMarked: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

export interface FeeCollectionData {
  collectedAmount: number;
  collectionRate: number;
  totalFee: number;
  pendingFee: number;
  overdueFee: number;
  monthlyTrends: Array<{
    month: string;
    collected: number;
    due: number;
  }>;
}

export interface SchoolEvent {
  id: string;
  date: string;
  day: string;
  month: string;
  title: string;
  time: string;
  category: "PTM" | "Event" | "Finance" | "Academic" | "Sports";
  badgeBg: string;
  badgeText: string;
}

export interface AdmissionApplicant {
  id: string;
  name: string;
  classApplied: string;
  status: "Under Review" | "Documents Pending" | "Approved" | "Waitlisted";
  statusColor: string;
  statusBg: string;
  appliedOn: string;
  initials: string;
  avatarBg: string;
}

export interface SchoolActivity {
  id: string;
  description: string;
  timestamp: string;
  type: "admission" | "timetable" | "notice" | "payment" | "exam";
}

export interface QuickActionItem {
  id: string;
  title: string;
  icon: string;
  href: string;
}

export interface ClassStrengthItem {
  range: string;
  count: number;
}

export interface AcademicPerformanceData {
  overallPassRate: number;
  trendVsLastTerm: number;
  termTrends: Array<{
    term: string;
    percentage: number;
  }>;
  topClasses: Array<{
    rank: number;
    className: string;
    score: number;
  }>;
}

export interface AdmissionFunnelData {
  enquiries: number;
  applications: number;
  shortlisted: number;
  admitted: number;
  conversionRate: number;
  trendVsLastYear: number;
}

export interface StaffBreakdown {
  total: number;
  teaching: number;
  teachingPercentage: number;
  nonTeaching: number;
  nonTeachingPercentage: number;
  administrative: number;
  adminPercentage: number;
}

export interface GenderBreakdown {
  total: number;
  boys: number;
  boysPercentage: number;
  girls: number;
  girlsPercentage: number;
}

export interface KeyInsight {
  id: string;
  metric: string;
  changeText: string;
  highlightText: string;
  periodText: string;
  type: "positive" | "warning" | "neutral";
}

export interface NoticeItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  iconType: "calendar" | "info" | "bell";
}

export interface SchoolDashboardData {
  school: {
    id: string;
    name: string;
    slug: string;
    code: string;
    affiliationBoard: string;
    city: string;
    state: string;
  };
  currentUser: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  academicSession: {
    currentDate: string;
    year: string;
    term: string;
    workingDaysLeft: number;
  };
  kpis: {
    totalStudents: { value: number; change: number };
    totalStaff: { value: number; change: number };
    pendingAdmissions: { value: number; change: number };
    feeDues: { value: number; change: number };
  };
  studentOverview: {
    total: number;
    sections: StudentSectionBreakdown[];
  };
  attendanceToday: AttendanceStats;
  todayTasks: TaskItem[];
  feeCollection: FeeCollectionData;
  upcomingEvents: SchoolEvent[];
  recentAdmissions: AdmissionApplicant[];
  recentActivities: SchoolActivity[];
  classStrength: ClassStrengthItem[];
  academicPerformance: AcademicPerformanceData;
  admissionFunnel: AdmissionFunnelData;
  staffOverview: StaffBreakdown;
  genderBreakdown: GenderBreakdown;
  keyInsights: KeyInsight[];
  notices: NoticeItem[];
  communicationSummary: {
    noticesSent: number;
    smsDelivered: number;
    emailsDelivered: number;
  };
}
