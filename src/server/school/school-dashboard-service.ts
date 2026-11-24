import "server-only";
import { authRepository, SchoolRecord } from "@/server/auth/auth-repository";

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

export const schoolDashboardService = {
  /**
   * Generates or fetches unique, school-specific dynamic dashboard data.
   */
  async getDashboardData(schoolId: string, currentUserId?: string): Promise<SchoolDashboardData> {
    const school = await authRepository.findSchoolById(schoolId);
    const user = currentUserId ? await authRepository.findUserById(currentUserId) : null;

    const schoolName = school?.name || "Sunrise International School";
    const schoolCode = school?.code || "SIS-1001";
    const schoolSlug = school?.slug || "sunrise-international";
    const affiliation = school?.affiliationBoard || "CBSE";
    const city = school?.city || "Bengaluru";
    const state = school?.state || "Karnataka";

    const userName = user?.name || "Rohan Mehta";
    const userRole = user?.role ? user.role.replace(/_/g, " ") : "Principal";
    const initials = userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Check specific preset profiles or generate deterministically from schoolId
    if (schoolId === "sch_sunrise_001" || schoolSlug === "sunrise-international") {
      return getSunriseDashboard(schoolId, userName, userRole, initials);
    } else if (schoolId === "sch_apex_002" || schoolSlug === "apex-global") {
      return getApexDashboard(schoolId, userName, userRole, initials);
    } else if (schoolId === "sch_xavier_003" || schoolSlug === "st-xaviers") {
      return getXavierDashboard(schoolId, userName, userRole, initials);
    }

    // Dynamic deterministic fallback for any registered school
    return getDynamicSchoolDashboard(schoolId, schoolName, schoolCode, schoolSlug, affiliation, city, state, userName, userRole, initials);
  },

  /**
   * Retrieves all available schools for switcher preview / administration.
   */
  async getAllSchools(): Promise<SchoolRecord[]> {
    const list = await authRepository.getAllSchools();
    const coreSchools: SchoolRecord[] = [
      {
        id: "sch_sunrise_001",
        name: "Sunrise International School",
        slug: "sunrise-international-school",
        code: "SIS-BLR-01",
        affiliationBoard: "CBSE",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        status: "ACTIVE",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: "sch_apex_002",
        name: "Apex Global Academy",
        slug: "apex-global-academy",
        code: "AGA-DEL-02",
        affiliationBoard: "ICSE",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
        status: "ACTIVE",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: "sch_xavier_003",
        name: "St. Xavier's International School",
        slug: "st-xaviers-international",
        code: "SXI-MUM-03",
        affiliationBoard: "State Board",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        status: "ACTIVE",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ];

    const map = new Map<string, SchoolRecord>();
    for (const s of coreSchools) {
      map.set(s.id, s);
    }
    for (const s of list) {
      map.set(s.id, s);
    }
    return Array.from(map.values());
  },
};

/**
 * 1. Preset Profile: Sunrise International School (CBSE, Bengaluru)
 * Exactly matches the user-uploaded image specification.
 */
function getSunriseDashboard(
  schoolId: string,
  userName: string,
  userRole: string,
  initials: string
): SchoolDashboardData {
  return {
    school: {
      id: schoolId,
      name: "Sunrise International School",
      slug: "sunrise-international",
      code: "SIS-1001",
      affiliationBoard: "CBSE",
      city: "Bengaluru",
      state: "Karnataka",
    },
    currentUser: {
      name: userName || "Rohan Mehta",
      role: userRole || "Principal",
      avatarInitials: initials || "RM",
    },
    academicSession: {
      currentDate: "Wed, Jan 24, 2026",
      year: "2025 – 2026",
      term: "Term 2",
      workingDaysLeft: 332,
    },
    kpis: {
      totalStudents: { value: 1248, change: 3.8 },
      totalStaff: { value: 86, change: 2.4 },
      pendingAdmissions: { value: 37, change: 12.1 },
      feeDues: { value: 548000, change: 7.6 },
    },
    studentOverview: {
      total: 1248,
      sections: [
        { label: "Primary (I – V)", count: 462, percentage: 37.0, color: "#8B5CF6" },
        { label: "Middle (VI – VIII)", count: 308, percentage: 24.7, color: "#38BDF8" },
        { label: "Secondary (IX – X)", count: 278, percentage: 22.3, color: "#EC4899" },
        { label: "Senior Sec. (XI – XII)", count: 200, percentage: 16.0, color: "#F59E0B" },
      ],
    },
    attendanceToday: {
      rate: 96.4,
      present: 1204,
      absent: 44,
      notMarked: 0,
    },
    todayTasks: [
      { id: "task-1", title: "Mark class attendance", completed: true, category: "Attendance" },
      { id: "task-2", title: "Review new admission applications (5)", completed: false, category: "Admissions" },
      { id: "task-3", title: "Approve fee reimbursements (2)", completed: false, category: "Finance" },
      { id: "task-4", title: "Publish notice for PTM", completed: false, category: "Communication" },
      { id: "task-5", title: "Update timetable (Class XI)", completed: true, category: "Academics" },
    ],
    feeCollection: {
      collectedAmount: 1275000,
      collectionRate: 72.6,
      totalFee: 1755000,
      pendingFee: 480000,
      overdueFee: 210000,
      monthlyTrends: [
        { month: "Apr", collected: 13, due: 3 },
        { month: "May", collected: 11, due: 4 },
        { month: "Jun", collected: 14, due: 2 },
        { month: "Jul", collected: 12, due: 4 },
        { month: "Aug", collected: 15, due: 2 },
        { month: "Sep", collected: 12, due: 5 },
        { month: "Oct", collected: 14, due: 3 },
        { month: "Nov", collected: 13, due: 4 },
        { month: "Dec", collected: 15, due: 2 },
        { month: "Jan", collected: 16, due: 3 },
        { month: "Feb", collected: 14, due: 3 },
        { month: "Mar", collected: 15, due: 2 },
      ],
    },
    upcomingEvents: [
      {
        id: "ev-1",
        date: "24",
        day: "Wed",
        month: "Jan",
        title: "Parent-Teacher Meeting (Classes I – V)",
        time: "10:00 AM – 1:00 PM",
        category: "PTM",
        badgeBg: "bg-[#EDE7FF]",
        badgeText: "text-[#663CF6]",
      },
      {
        id: "ev-2",
        date: "26",
        day: "Fri",
        month: "Jan",
        title: "Republic Day Celebration",
        time: "09:00 AM – 11:30 AM",
        category: "Event",
        badgeBg: "bg-[#E0F2FE]",
        badgeText: "text-[#0284C7]",
      },
      {
        id: "ev-3",
        date: "31",
        day: "Wed",
        month: "Jan",
        title: "Last Date for Fee Payment (Jan)",
        time: "Till 05:00 PM",
        category: "Finance",
        badgeBg: "bg-[#DCFCE7]",
        badgeText: "text-[#15803D]",
      },
    ],
    recentAdmissions: [
      {
        id: "adm-1",
        name: "Aarav Sharma",
        classApplied: "Class I",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50 border-amber-200",
        appliedOn: "20 Jan 2026",
        initials: "AS",
        avatarBg: "bg-purple-100 text-purple-700",
      },
      {
        id: "adm-2",
        name: "Diya Verma",
        classApplied: "Class VI",
        status: "Documents Pending",
        statusColor: "text-sky-700",
        statusBg: "bg-sky-50 border-sky-200",
        appliedOn: "19 Jan 2026",
        initials: "DV",
        avatarBg: "bg-blue-100 text-blue-700",
      },
      {
        id: "adm-3",
        name: "Ishaan Gupta",
        classApplied: "Class III",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "18 Jan 2026",
        initials: "IG",
        avatarBg: "bg-emerald-100 text-emerald-700",
      },
      {
        id: "adm-4",
        name: "Priya Kapoor",
        classApplied: "Class IX",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50 border-amber-200",
        appliedOn: "17 Jan 2026",
        initials: "PK",
        avatarBg: "bg-pink-100 text-pink-700",
      },
    ],
    recentActivities: [
      {
        id: "act-1",
        description: "New admission application received from Aarav Sharma.",
        timestamp: "10 minutes ago",
        type: "admission",
      },
      {
        id: "act-2",
        description: "Timetable updated for Class XI.",
        timestamp: "45 minutes ago",
        type: "timetable",
      },
      {
        id: "act-3",
        description: 'New notice published: "PTM Schedule – January".',
        timestamp: "1 hour ago",
        type: "notice",
      },
      {
        id: "act-4",
        description: "Fee payment of ₹25,000 received from Riya Singh.",
        timestamp: "2 hours ago",
        type: "payment",
      },
    ],
    classStrength: [
      { range: "I – V", count: 462 },
      { range: "VI – VIII", count: 308 },
      { range: "IX – X", count: 278 },
      { range: "XI – XII", count: 200 },
    ],
    academicPerformance: {
      overallPassRate: 84.2,
      trendVsLastTerm: 2.8,
      termTrends: [
        { term: "Term 1 (2024-25)", percentage: 78.6 },
        { term: "Term 2 (2024-25)", percentage: 80.3 },
        { term: "Term 3 (2024-25)", percentage: 81.9 },
        { term: "Term 1 (2025-26)", percentage: 83.5 },
        { term: "Term 2 (2025-26)", percentage: 84.2 },
      ],
      topClasses: [
        { rank: 1, className: "Class X A", score: 92.6 },
        { rank: 2, className: "Class XII Science", score: 91.8 },
        { rank: 3, className: "Class VIII A", score: 90.4 },
      ],
    },
    admissionFunnel: {
      enquiries: 620,
      applications: 480,
      shortlisted: 275,
      admitted: 192,
      conversionRate: 31.0,
      trendVsLastYear: 4.2,
    },
    staffOverview: {
      total: 86,
      teaching: 56,
      teachingPercentage: 65.1,
      nonTeaching: 20,
      nonTeachingPercentage: 23.3,
      administrative: 10,
      adminPercentage: 11.6,
    },
    genderBreakdown: {
      total: 1248,
      boys: 652,
      boysPercentage: 52.2,
      girls: 596,
      girlsPercentage: 47.8,
    },
    keyInsights: [
      {
        id: "ins-1",
        metric: "Student Strength",
        changeText: "increased by 3.8%",
        highlightText: "(+46 students)",
        periodText: "vs. previous month",
        type: "positive",
      },
      {
        id: "ins-2",
        metric: "Pending Fee Dues",
        changeText: "increased by 7.6%",
        highlightText: "(₹38,000)",
        periodText: "vs. previous month",
        type: "warning",
      },
      {
        id: "ins-3",
        metric: "Admissions",
        changeText: "increased by 12.1%",
        highlightText: "(+4 applications)",
        periodText: "vs. previous month",
        type: "positive",
      },
    ],
    notices: [
      {
        id: "not-1",
        title: "PTM Schedule – January",
        summary: "The Parent-Teacher Meeting for Classes I – V will be held on 24 Jan 2026.",
        date: "20 Jan 2026",
        iconType: "calendar",
      },
      {
        id: "not-2",
        title: "Republic Day Celebration",
        summary: "All students are invited to the Republic Day celebration on 26 Jan 2026.",
        date: "18 Jan 2026",
        iconType: "info",
      },
      {
        id: "not-3",
        title: "Fee Payment Reminder",
        summary: "Last date to pay the January fee is 31 Jan 2026 till 05:00 PM.",
        date: "16 Jan 2026",
        iconType: "bell",
      },
    ],
    communicationSummary: {
      noticesSent: 285,
      smsDelivered: 1074,
      emailsDelivered: 842,
    },
  };
}

/**
 * 2. Preset Profile: Apex Global Academy (ICSE, New Delhi)
 */
function getApexDashboard(
  schoolId: string,
  userName: string,
  userRole: string,
  initials: string
): SchoolDashboardData {
  return {
    school: {
      id: schoolId,
      name: "Apex Global Academy",
      slug: "apex-global",
      code: "APEX-101",
      affiliationBoard: "ICSE",
      city: "New Delhi",
      state: "Delhi",
    },
    currentUser: {
      name: userName || "Dr. Vikram Seth",
      role: userRole || "School Administrator",
      avatarInitials: initials || "VS",
    },
    academicSession: {
      currentDate: "Wed, Jan 24, 2026",
      year: "2025 – 2026",
      term: "Term 2",
      workingDaysLeft: 310,
    },
    kpis: {
      totalStudents: { value: 1890, change: 4.2 },
      totalStaff: { value: 112, change: 3.1 },
      pendingAdmissions: { value: 54, change: 8.4 },
      feeDues: { value: 812000, change: 4.5 },
    },
    studentOverview: {
      total: 1890,
      sections: [
        { label: "Primary (I – V)", count: 680, percentage: 36.0, color: "#8B5CF6" },
        { label: "Middle (VI – VIII)", count: 510, percentage: 27.0, color: "#38BDF8" },
        { label: "Secondary (IX – X)", count: 420, percentage: 22.2, color: "#EC4899" },
        { label: "Senior Sec. (XI – XII)", count: 280, percentage: 14.8, color: "#F59E0B" },
      ],
    },
    attendanceToday: {
      rate: 97.2,
      present: 1837,
      absent: 53,
      notMarked: 0,
    },
    todayTasks: [
      { id: "task-1", title: "Complete ICSE pre-board registration", completed: true, category: "Academics" },
      { id: "task-2", title: "Review staff leave requests for next week", completed: true, category: "Staff" },
      { id: "task-3", title: "Verify quarterly transport ledger", completed: false, category: "Finance" },
      { id: "task-4", title: "Distribute science laboratory equipment", completed: false, category: "Operations" },
      { id: "task-5", title: "Sync biometric attendance machine logs", completed: true, category: "Attendance" },
    ],
    feeCollection: {
      collectedAmount: 2450000,
      collectionRate: 81.6,
      totalFee: 3000000,
      pendingFee: 550000,
      overdueFee: 180000,
      monthlyTrends: [
        { month: "Apr", collected: 22, due: 5 },
        { month: "May", collected: 20, due: 6 },
        { month: "Jun", collected: 25, due: 4 },
        { month: "Jul", collected: 23, due: 5 },
        { month: "Aug", collected: 26, due: 3 },
        { month: "Sep", collected: 24, due: 5 },
        { month: "Oct", collected: 27, due: 4 },
        { month: "Nov", collected: 25, due: 4 },
        { month: "Dec", collected: 28, due: 3 },
        { month: "Jan", collected: 29, due: 4 },
        { month: "Feb", collected: 26, due: 4 },
        { month: "Mar", collected: 27, due: 3 },
      ],
    },
    upcomingEvents: [
      {
        id: "ev-1",
        date: "25",
        day: "Thu",
        month: "Jan",
        title: "Inter-School Science Olympiad 2026",
        time: "09:30 AM – 3:30 PM",
        category: "Academic",
        badgeBg: "bg-[#EDE7FF]",
        badgeText: "text-[#663CF6]",
      },
      {
        id: "ev-2",
        date: "26",
        day: "Fri",
        month: "Jan",
        title: "Flag Hoisting Ceremony & Parade",
        time: "08:30 AM – 10:30 AM",
        category: "Event",
        badgeBg: "bg-[#E0F2FE]",
        badgeText: "text-[#0284C7]",
      },
      {
        id: "ev-3",
        date: "02",
        day: "Mon",
        month: "Feb",
        title: "Pre-Board Mock Examinations Begin",
        time: "09:00 AM – 12:30 PM",
        category: "Academic",
        badgeBg: "bg-[#FEF3C7]",
        badgeText: "text-[#D97706]",
      },
    ],
    recentAdmissions: [
      {
        id: "adm-1",
        name: "Kabir Sen",
        classApplied: "Class VI",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "21 Jan 2026",
        initials: "KS",
        avatarBg: "bg-emerald-100 text-emerald-700",
      },
      {
        id: "adm-2",
        name: "Ananya Deshmukh",
        classApplied: "Class IX",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50 border-amber-200",
        appliedOn: "20 Jan 2026",
        initials: "AD",
        avatarBg: "bg-purple-100 text-purple-700",
      },
      {
        id: "adm-3",
        name: "Rohan Das",
        classApplied: "Class II",
        status: "Documents Pending",
        statusColor: "text-sky-700",
        statusBg: "bg-sky-50 border-sky-200",
        appliedOn: "19 Jan 2026",
        initials: "RD",
        avatarBg: "bg-blue-100 text-blue-700",
      },
      {
        id: "adm-4",
        name: "Tanvi Patel",
        classApplied: "Class XI",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "18 Jan 2026",
        initials: "TP",
        avatarBg: "bg-pink-100 text-pink-700",
      },
    ],
    recentActivities: [
      {
        id: "act-1",
        description: "Library book renewal alerts sent to 320 senior students.",
        timestamp: "20 minutes ago",
        type: "notice",
      },
      {
        id: "act-2",
        description: "Chemistry lab inventory updated for Grade 12 Practicals.",
        timestamp: "1 hour ago",
        type: "exam",
      },
      {
        id: "act-3",
        description: "Annual bus transport passes generated for Sector 14 routes.",
        timestamp: "3 hours ago",
        type: "timetable",
      },
      {
        id: "act-4",
        description: "Tuition installment received: ₹42,000 from Kabir Sen.",
        timestamp: "4 hours ago",
        type: "payment",
      },
    ],
    classStrength: [
      { range: "I – V", count: 680 },
      { range: "VI – VIII", count: 510 },
      { range: "IX – X", count: 420 },
      { range: "XI – XII", count: 280 },
    ],
    academicPerformance: {
      overallPassRate: 88.6,
      trendVsLastTerm: 3.4,
      termTrends: [
        { term: "Term 1 (2024-25)", percentage: 82.1 },
        { term: "Term 2 (2024-25)", percentage: 84.5 },
        { term: "Term 3 (2024-25)", percentage: 86.2 },
        { term: "Term 1 (2025-26)", percentage: 87.8 },
        { term: "Term 2 (2025-26)", percentage: 88.6 },
      ],
      topClasses: [
        { rank: 1, className: "Class XII Commerce", score: 94.2 },
        { rank: 2, className: "Class X B", score: 93.1 },
        { rank: 3, className: "Class IX A", score: 91.5 },
      ],
    },
    admissionFunnel: {
      enquiries: 890,
      applications: 640,
      shortlisted: 390,
      admitted: 265,
      conversionRate: 29.8,
      trendVsLastYear: 5.1,
    },
    staffOverview: {
      total: 112,
      teaching: 76,
      teachingPercentage: 67.9,
      nonTeaching: 24,
      nonTeachingPercentage: 21.4,
      administrative: 12,
      adminPercentage: 10.7,
    },
    genderBreakdown: {
      total: 1890,
      boys: 980,
      boysPercentage: 51.9,
      girls: 910,
      girlsPercentage: 48.1,
    },
    keyInsights: [
      {
        id: "ins-1",
        metric: "ICSE Enrollment",
        changeText: "increased by 4.2%",
        highlightText: "(+76 students)",
        periodText: "vs. previous month",
        type: "positive",
      },
      {
        id: "ins-2",
        metric: "Fee Clearance",
        changeText: "81.6% collected",
        highlightText: "(ahead of schedule)",
        periodText: "for January",
        type: "positive",
      },
      {
        id: "ins-3",
        metric: "Staff Attendance",
        changeText: "98.5% present",
        highlightText: "(optimal staffing)",
        periodText: "this week",
        type: "positive",
      },
    ],
    notices: [
      {
        id: "not-1",
        title: "ICSE Practical Examination Schedule",
        summary: "Laboratory assessments for Grade 10 & 12 begin on Monday, 9th February.",
        date: "22 Jan 2026",
        iconType: "calendar",
      },
      {
        id: "not-2",
        title: "Inter-House Sports Meet Postponement",
        summary: "Due to annual grounds maintenance, sports day is rescheduled to 14th February.",
        date: "19 Jan 2026",
        iconType: "info",
      },
      {
        id: "not-3",
        title: "Winter Uniform Compliance",
        summary: "All students are requested to wear full school blazers and ties starting tomorrow.",
        date: "15 Jan 2026",
        iconType: "bell",
      },
    ],
    communicationSummary: {
      noticesSent: 412,
      smsDelivered: 1890,
      emailsDelivered: 1420,
    },
  };
}

/**
 * 3. Preset Profile: St. Xavier's International School (State Board / Mumbai)
 */
function getXavierDashboard(
  schoolId: string,
  userName: string,
  userRole: string,
  initials: string
): SchoolDashboardData {
  return {
    school: {
      id: schoolId,
      name: "St. Xavier's International School",
      slug: "st-xaviers",
      code: "STX-5002",
      affiliationBoard: "State Board",
      city: "Mumbai",
      state: "Maharashtra",
    },
    currentUser: {
      name: userName || "Sister Mary Thomas",
      role: userRole || "Principal",
      avatarInitials: initials || "MT",
    },
    academicSession: {
      currentDate: "Wed, Jan 24, 2026",
      year: "2025 – 2026",
      term: "Term 2",
      workingDaysLeft: 340,
    },
    kpis: {
      totalStudents: { value: 2150, change: 2.1 },
      totalStaff: { value: 140, change: 1.8 },
      pendingAdmissions: { value: 28, change: -3.4 },
      feeDues: { value: 420000, change: -5.1 },
    },
    studentOverview: {
      total: 2150,
      sections: [
        { label: "Primary (I – V)", count: 780, percentage: 36.3, color: "#8B5CF6" },
        { label: "Middle (VI – VIII)", count: 590, percentage: 27.4, color: "#38BDF8" },
        { label: "Secondary (IX – X)", count: 480, percentage: 22.3, color: "#EC4899" },
        { label: "Senior Sec. (XI – XII)", count: 300, percentage: 14.0, color: "#F59E0B" },
      ],
    },
    attendanceToday: {
      rate: 95.8,
      present: 2060,
      absent: 90,
      notMarked: 0,
    },
    todayTasks: [
      { id: "task-1", title: "Review annual merit scholarship awards", completed: true, category: "Academics" },
      { id: "task-2", title: "Sign off monthly hostel provisions bill", completed: true, category: "Finance" },
      { id: "task-3", title: "Conduct teacher evaluation debrief", completed: false, category: "Staff" },
      { id: "task-4", title: "Inspect student cafeteria hygiene audit", completed: false, category: "Operations" },
      { id: "task-5", title: "Send choir rehearsal notifications", completed: true, category: "Communication" },
    ],
    feeCollection: {
      collectedAmount: 3150000,
      collectionRate: 88.2,
      totalFee: 3570000,
      pendingFee: 310000,
      overdueFee: 110000,
      monthlyTrends: [
        { month: "Apr", collected: 30, due: 4 },
        { month: "May", collected: 28, due: 5 },
        { month: "Jun", collected: 32, due: 3 },
        { month: "Jul", collected: 31, due: 4 },
        { month: "Aug", collected: 34, due: 3 },
        { month: "Sep", collected: 32, due: 4 },
        { month: "Oct", collected: 35, due: 3 },
        { month: "Nov", collected: 33, due: 3 },
        { month: "Dec", collected: 36, due: 2 },
        { month: "Jan", collected: 37, due: 3 },
        { month: "Feb", collected: 33, due: 3 },
        { month: "Mar", collected: 35, due: 2 },
      ],
    },
    upcomingEvents: [
      {
        id: "ev-1",
        date: "27",
        day: "Sat",
        month: "Jan",
        title: "Annual Cultural Festival & Dramatics",
        time: "05:00 PM – 9:00 PM",
        category: "Event",
        badgeBg: "bg-[#EDE7FF]",
        badgeText: "text-[#663CF6]",
      },
      {
        id: "ev-2",
        date: "30",
        day: "Tue",
        month: "Jan",
        title: "Father Founder Memorial Lecture",
        time: "11:00 AM – 1:00 PM",
        category: "Academic",
        badgeBg: "bg-[#E0F2FE]",
        badgeText: "text-[#0284C7]",
      },
      {
        id: "ev-3",
        date: "05",
        day: "Thu",
        month: "Feb",
        title: "Alumni Scholarship Fund Drive",
        time: "02:00 PM – 5:00 PM",
        category: "Finance",
        badgeBg: "bg-[#DCFCE7]",
        badgeText: "text-[#15803D]",
      },
    ],
    recentAdmissions: [
      {
        id: "adm-1",
        name: "Samuel D'Souza",
        classApplied: "Class I",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "22 Jan 2026",
        initials: "SD",
        avatarBg: "bg-emerald-100 text-emerald-700",
      },
      {
        id: "adm-2",
        name: "Meera Nair",
        classApplied: "Class VIII",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "20 Jan 2026",
        initials: "MN",
        avatarBg: "bg-purple-100 text-purple-700",
      },
      {
        id: "adm-3",
        name: "Arjun Kamat",
        classApplied: "Class XI",
        status: "Waitlisted",
        statusColor: "text-purple-700",
        statusBg: "bg-purple-50 border-purple-200",
        appliedOn: "19 Jan 2026",
        initials: "AK",
        avatarBg: "bg-blue-100 text-blue-700",
      },
      {
        id: "adm-4",
        name: "Zara Fernandez",
        classApplied: "Class V",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50 border-amber-200",
        appliedOn: "18 Jan 2026",
        initials: "ZF",
        avatarBg: "bg-pink-100 text-pink-700",
      },
    ],
    recentActivities: [
      {
        id: "act-1",
        description: "Merit scholarship list finalized for 45 deserving students.",
        timestamp: "15 minutes ago",
        type: "notice",
      },
      {
        id: "act-2",
        description: "Stage rehearsal booked for Annual Day festival.",
        timestamp: "50 minutes ago",
        type: "timetable",
      },
      {
        id: "act-3",
        description: "Online fee portal recorded 180 parent transactions.",
        timestamp: "2 hours ago",
        type: "payment",
      },
      {
        id: "act-4",
        description: "Parent circular issued for upcoming board examinations.",
        timestamp: "3 hours ago",
        type: "notice",
      },
    ],
    classStrength: [
      { range: "I – V", count: 780 },
      { range: "VI – VIII", count: 590 },
      { range: "IX – X", count: 480 },
      { range: "XI – XII", count: 300 },
    ],
    academicPerformance: {
      overallPassRate: 91.4,
      trendVsLastTerm: 1.6,
      termTrends: [
        { term: "Term 1 (2024-25)", percentage: 86.4 },
        { term: "Term 2 (2024-25)", percentage: 88.0 },
        { term: "Term 3 (2024-25)", percentage: 89.5 },
        { term: "Term 1 (2025-26)", percentage: 90.8 },
        { term: "Term 2 (2025-26)", percentage: 91.4 },
      ],
      topClasses: [
        { rank: 1, className: "Class XII Arts", score: 95.8 },
        { rank: 2, className: "Class X Blue", score: 94.6 },
        { rank: 3, className: "Class IX White", score: 92.4 },
      ],
    },
    admissionFunnel: {
      enquiries: 940,
      applications: 710,
      shortlisted: 420,
      admitted: 310,
      conversionRate: 33.0,
      trendVsLastYear: 3.2,
    },
    staffOverview: {
      total: 140,
      teaching: 95,
      teachingPercentage: 67.9,
      nonTeaching: 30,
      nonTeachingPercentage: 21.4,
      administrative: 15,
      adminPercentage: 10.7,
    },
    genderBreakdown: {
      total: 2150,
      boys: 1050,
      boysPercentage: 48.8,
      girls: 1100,
      girlsPercentage: 51.2,
    },
    keyInsights: [
      {
        id: "ins-1",
        metric: "Fee Default Rate",
        changeText: "decreased by 5.1%",
        highlightText: "(lowest in 3 years)",
        periodText: "vs. previous month",
        type: "positive",
      },
      {
        id: "ins-2",
        metric: "Academic Pass Rate",
        changeText: "reached 91.4%",
        highlightText: "(top 5% in district)",
        periodText: "this term",
        type: "positive",
      },
      {
        id: "ins-3",
        metric: "Library Usage",
        changeText: "increased by 22%",
        highlightText: "(active readership)",
        periodText: "vs. last semester",
        type: "positive",
      },
    ],
    notices: [
      {
        id: "not-1",
        title: "Annual Day Rehearsal Timings",
        summary: "Special practice sessions for drama, choir, and band will run daily from 3:30 PM.",
        date: "23 Jan 2026",
        iconType: "calendar",
      },
      {
        id: "not-2",
        title: "Mid-Term Fee Receipt Verification",
        summary: "Account office counter will remain open this Saturday from 9:00 AM to 1:00 PM.",
        date: "21 Jan 2026",
        iconType: "info",
      },
      {
        id: "not-3",
        title: "Inter-School Debate Championship",
        summary: "Congratulations to our Senior Debate team for winning the Mumbai Zone Cup!",
        date: "17 Jan 2026",
        iconType: "bell",
      },
    ],
    communicationSummary: {
      noticesSent: 520,
      smsDelivered: 2150,
      emailsDelivered: 1980,
    },
  };
}

/**
 * 4. Deterministic Dynamic Fallback for any newly registered school
 */
function getDynamicSchoolDashboard(
  schoolId: string,
  schoolName: string,
  schoolCode: string,
  schoolSlug: string,
  affiliation: string,
  city: string,
  state: string,
  userName: string,
  userRole: string,
  initials: string
): SchoolDashboardData {
  // Simple hash for deterministic values
  let hash = 0;
  for (let i = 0; i < schoolId.length; i++) {
    hash = (hash << 5) - hash + schoolId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const studentBase = 800 + (positiveHash % 1200);
  const staffCount = Math.round(studentBase / 15);
  const pendingAdmissions = 20 + (positiveHash % 40);
  const feeDues = 200000 + (positiveHash % 600000);
  const attendanceRate = +(94 + ((positiveHash % 40) / 10)).toFixed(1);

  const primaryCount = Math.round(studentBase * 0.36);
  const middleCount = Math.round(studentBase * 0.26);
  const secondaryCount = Math.round(studentBase * 0.22);
  const seniorCount = studentBase - primaryCount - middleCount - secondaryCount;

  const presentCount = Math.round((studentBase * attendanceRate) / 100);
  const absentCount = studentBase - presentCount;

  const totalFee = studentBase * 1400;
  const collectedFee = Math.round(totalFee * 0.74);
  const pendingFee = totalFee - collectedFee;
  const overdueFee = Math.round(pendingFee * 0.4);

  return {
    school: {
      id: schoolId,
      name: schoolName,
      slug: schoolSlug,
      code: schoolCode,
      affiliationBoard: affiliation,
      city,
      state,
    },
    currentUser: {
      name: userName,
      role: userRole,
      avatarInitials: initials,
    },
    academicSession: {
      currentDate: "Wed, Jan 24, 2026",
      year: "2025 – 2026",
      term: "Term 2",
      workingDaysLeft: 320,
    },
    kpis: {
      totalStudents: { value: studentBase, change: +((positiveHash % 50) / 10 + 1).toFixed(1) },
      totalStaff: { value: staffCount, change: +((positiveHash % 30) / 10 + 1).toFixed(1) },
      pendingAdmissions: { value: pendingAdmissions, change: +((positiveHash % 80) / 10 + 2).toFixed(1) },
      feeDues: { value: feeDues, change: +((positiveHash % 40) / 10 + 1).toFixed(1) },
    },
    studentOverview: {
      total: studentBase,
      sections: [
        { label: "Primary (I – V)", count: primaryCount, percentage: +((primaryCount / studentBase) * 100).toFixed(1), color: "#8B5CF6" },
        { label: "Middle (VI – VIII)", count: middleCount, percentage: +((middleCount / studentBase) * 100).toFixed(1), color: "#38BDF8" },
        { label: "Secondary (IX – X)", count: secondaryCount, percentage: +((secondaryCount / studentBase) * 100).toFixed(1), color: "#EC4899" },
        { label: "Senior Sec. (XI – XII)", count: seniorCount, percentage: +((seniorCount / studentBase) * 100).toFixed(1), color: "#F59E0B" },
      ],
    },
    attendanceToday: {
      rate: attendanceRate,
      present: presentCount,
      absent: absentCount,
      notMarked: 0,
    },
    todayTasks: [
      { id: "task-1", title: `Verify morning attendance records for ${schoolName}`, completed: true, category: "Attendance" },
      { id: "task-2", title: "Review new student admissions", completed: false, category: "Admissions" },
      { id: "task-3", title: "Approve pending fee waivers and receipts", completed: false, category: "Finance" },
      { id: "task-4", title: "Check upcoming academic calendar dates", completed: true, category: "Academics" },
    ],
    feeCollection: {
      collectedAmount: collectedFee,
      collectionRate: +((collectedFee / totalFee) * 100).toFixed(1),
      totalFee,
      pendingFee,
      overdueFee,
      monthlyTrends: [
        { month: "Apr", collected: 12, due: 3 },
        { month: "May", collected: 11, due: 4 },
        { month: "Jun", collected: 13, due: 2 },
        { month: "Jul", collected: 14, due: 3 },
        { month: "Aug", collected: 15, due: 2 },
        { month: "Sep", collected: 13, due: 4 },
        { month: "Oct", collected: 14, due: 3 },
        { month: "Nov", collected: 15, due: 2 },
        { month: "Dec", collected: 16, due: 2 },
        { month: "Jan", collected: 17, due: 3 },
        { month: "Feb", collected: 14, due: 2 },
        { month: "Mar", collected: 15, due: 2 },
      ],
    },
    upcomingEvents: [
      {
        id: "ev-1",
        date: "25",
        day: "Thu",
        month: "Jan",
        title: "Staff Academic Committee Assembly",
        time: "10:00 AM – 12:00 PM",
        category: "Academic",
        badgeBg: "bg-[#EDE7FF]",
        badgeText: "text-[#663CF6]",
      },
      {
        id: "ev-2",
        date: "26",
        day: "Fri",
        month: "Jan",
        title: "Republic Day Special Assembly",
        time: "09:00 AM – 11:30 AM",
        category: "Event",
        badgeBg: "bg-[#E0F2FE]",
        badgeText: "text-[#0284C7]",
      },
    ],
    recentAdmissions: [
      {
        id: "adm-1",
        name: "Devendra Patel",
        classApplied: "Class I",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50 border-emerald-200",
        appliedOn: "21 Jan 2026",
        initials: "DP",
        avatarBg: "bg-emerald-100 text-emerald-700",
      },
      {
        id: "adm-2",
        name: "Shreya Ghoshal",
        classApplied: "Class VI",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50 border-amber-200",
        appliedOn: "19 Jan 2026",
        initials: "SG",
        avatarBg: "bg-purple-100 text-purple-700",
      },
    ],
    recentActivities: [
      {
        id: "act-1",
        description: `Admission enquiry received for ${schoolName}.`,
        timestamp: "30 minutes ago",
        type: "admission",
      },
      {
        id: "act-2",
        description: "Attendance report generated for Grade 10.",
        timestamp: "2 hours ago",
        type: "notice",
      },
    ],
    classStrength: [
      { range: "I – V", count: primaryCount },
      { range: "VI – VIII", count: middleCount },
      { range: "IX – X", count: secondaryCount },
      { range: "XI – XII", count: seniorCount },
    ],
    academicPerformance: {
      overallPassRate: 86.5,
      trendVsLastTerm: 2.1,
      termTrends: [
        { term: "Term 1 (2024-25)", percentage: 80.2 },
        { term: "Term 2 (2024-25)", percentage: 82.1 },
        { term: "Term 3 (2024-25)", percentage: 84.3 },
        { term: "Term 1 (2025-26)", percentage: 85.5 },
        { term: "Term 2 (2025-26)", percentage: 86.5 },
      ],
      topClasses: [
        { rank: 1, className: "Class X A", score: 93.4 },
        { rank: 2, className: "Class XII Science", score: 92.1 },
        { rank: 3, className: "Class VIII A", score: 90.8 },
      ],
    },
    admissionFunnel: {
      enquiries: Math.round(studentBase * 0.5),
      applications: Math.round(studentBase * 0.38),
      shortlisted: Math.round(studentBase * 0.22),
      admitted: Math.round(studentBase * 0.15),
      conversionRate: 30.0,
      trendVsLastYear: 3.5,
    },
    staffOverview: {
      total: staffCount,
      teaching: Math.round(staffCount * 0.65),
      teachingPercentage: 65.0,
      nonTeaching: Math.round(staffCount * 0.23),
      nonTeachingPercentage: 23.0,
      administrative: staffCount - Math.round(staffCount * 0.65) - Math.round(staffCount * 0.23),
      adminPercentage: 12.0,
    },
    genderBreakdown: {
      total: studentBase,
      boys: Math.round(studentBase * 0.52),
      boysPercentage: 52.0,
      girls: studentBase - Math.round(studentBase * 0.52),
      girlsPercentage: 48.0,
    },
    keyInsights: [
      {
        id: "ins-1",
        metric: "Student Enrollment",
        changeText: "healthy growth",
        highlightText: `(${studentBase} students active)`,
        periodText: "this session",
        type: "positive",
      },
      {
        id: "ins-2",
        metric: "Fee Clearance",
        changeText: "stable trajectory",
        highlightText: `(${attendanceRate}% attendance rate)`,
        periodText: "this month",
        type: "positive",
      },
    ],
    notices: [
      {
        id: "not-1",
        title: "Welcome to Academic Session 2025–2026",
        summary: `Orientation details for students and faculty of ${schoolName}.`,
        date: "20 Jan 2026",
        iconType: "info",
      },
    ],
    communicationSummary: {
      noticesSent: 150 + (positiveHash % 200),
      smsDelivered: studentBase,
      emailsDelivered: Math.round(studentBase * 0.8),
    },
  };
}
