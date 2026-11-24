export interface GuideItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  readingTime: string;
  badgeType: "Step-by-Step" | "Guide" | "Quickstart" | "Deep-Dive";
  iconType: "rocket" | "settings" | "academics" | "fees" | "reports" | "integrations";
  stepsCount: number;
  featured?: boolean;
  popular?: boolean;
  journeyId?: string;
  overview?: string;
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    tip?: string;
  }[];
}

export interface GuideCategory {
  id: string;
  name: string;
  iconType: "all" | "rocket" | "settings" | "academics" | "fees" | "reports" | "integrations";
  count: number;
}

export interface GuideJourney {
  id: string;
  title: string;
  description: string;
  iconType: "clipboard" | "users" | "chart" | "star";
  guidesCount: number;
  guideSlugs: string[];
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: "getting-started", name: "Getting Started", iconType: "rocket", count: 6 },
  { id: "admin-settings", name: "Admin & Settings", iconType: "settings", count: 5 },
  { id: "academics", name: "Academics", iconType: "academics", count: 5 },
  { id: "fees-payments", name: "Fees & Payments", iconType: "fees", count: 4 },
  { id: "reports-analytics", name: "Reports & Analytics", iconType: "reports", count: 4 },
  { id: "integrations", name: "Integrations", iconType: "integrations", count: 4 },
];

export const FEATURED_GUIDE: GuideItem = {
  id: "featured-complete-school-setup",
  slug: "complete-school-setup-guide",
  title: "Complete School Setup Guide",
  description:
    "A step-by-step guide to set up your school, add users, configure settings and get started quickly.",
  category: "Getting Started",
  categoryId: "getting-started",
  readingTime: "12 min read",
  badgeType: "Step-by-Step",
  iconType: "rocket",
  stepsCount: 6,
  featured: true,
  journeyId: "setup-your-school",
  overview:
    "Setting up a modern digital campus requires structuring your school hierarchy, adding verified staff and students, configuring grade levels and subject allocations, and defining fee collection schedules. This master guide walks school administrators and leadership through every phase of configuration from day one to complete institutional launch.",
  steps: [
    {
      stepNumber: 1,
      title: "School Profile & Institutional Branding",
      description:
        "Input your school affiliation details (CBSE, ICSE, State Board, IB), upload official logos, set up academic calendars, and define term milestones.",
      tip: "Upload a high-resolution PNG transparent logo for crisp automatic printing on fee receipts and report cards.",
    },
    {
      stepNumber: 2,
      title: "Class, Section & Curriculum Hierarchy",
      description:
        "Configure grade levels from Kindergarten to Grade 12, define sections with max capacity limits, and assign scholastic and co-scholastic subjects.",
      tip: "You can clone academic structures from previous terms to save time during multi-grade onboarding.",
    },
    {
      stepNumber: 3,
      title: "Bulk Staff & Student Onboarding",
      description:
        "Import student demographics, parent phone numbers, and teacher profiles using our verified CSV template with automatic data sanitization.",
      tip: "Ensure phone numbers have country codes (+91) for instant OTP delivery and automated SMS alerts.",
    },
    {
      stepNumber: 4,
      title: "Timetable & Teacher Period Allocation",
      description:
        "Use our conflict-free timetable engine to assign teacher periods, classroom allocations, and lunch recess intervals without double-booking.",
    },
    {
      stepNumber: 5,
      title: "Tuition & Transport Fee Schedules",
      description:
        "Define installment deadlines, concession categories (sibling discounts, scholarships), transport routes, and instant digital receipt rules.",
    },
    {
      stepNumber: 6,
      title: "Role-Based Permissions & Staff Go-Live",
      description:
        "Review access privileges for accountants, class teachers, and front-desk receptionists before inviting parents to the mobile web portal.",
    },
  ],
};

export const POPULAR_GUIDES: GuideItem[] = [
  {
    id: "pop-get-started-in-10-minutes",
    slug: "get-started-in-10-minutes",
    title: "Get Started in 10 Minutes",
    description: "Quick setup guide to launch your school on the platform.",
    category: "Getting Started",
    categoryId: "getting-started",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "rocket",
    stepsCount: 4,
    popular: true,
    journeyId: "setup-your-school",
  },
  {
    id: "pop-manage-users-and-roles",
    slug: "manage-users-and-roles",
    title: "Manage Users and Roles",
    description: "Add staff, teachers and set role-based access easily.",
    category: "Admin & Settings",
    categoryId: "admin-settings",
    readingTime: "8 min read",
    badgeType: "Guide",
    iconType: "settings",
    stepsCount: 5,
    popular: true,
    journeyId: "setup-your-school",
  },
  {
    id: "pop-create-classes-and-timetables",
    slug: "create-classes-and-timetables",
    title: "Create Classes and Timetables",
    description: "Set up classes, subjects and build timetables for your school.",
    category: "Academics",
    categoryId: "academics",
    readingTime: "7 min read",
    badgeType: "Guide",
    iconType: "academics",
    stepsCount: 4,
    popular: true,
    journeyId: "manage-daily-operations",
  },
  {
    id: "pop-set-up-fees-and-payments",
    slug: "set-up-fees-and-payments",
    title: "Set Up Fees and Payments",
    description: "Configure fee structures, collect payments and manage receipts.",
    category: "Fees & Payments",
    categoryId: "fees-payments",
    readingTime: "6 min read",
    badgeType: "Guide",
    iconType: "fees",
    stepsCount: 5,
    popular: true,
    journeyId: "manage-daily-operations",
  },
  {
    id: "pop-generate-reports-and-analytics",
    slug: "generate-reports-and-analytics",
    title: "Generate Reports & Analytics",
    description: "Access key reports and insights to track your school's performance.",
    category: "Reports & Analytics",
    categoryId: "reports-analytics",
    readingTime: "8 min read",
    badgeType: "Guide",
    iconType: "reports",
    stepsCount: 4,
    popular: true,
    journeyId: "get-the-most-value",
  },
  {
    id: "pop-connect-integrations",
    slug: "connect-integrations",
    title: "Connect Integrations",
    description: "Integrate with essential tools like ERP, LMS and more.",
    category: "Integrations",
    categoryId: "integrations",
    readingTime: "9 min read",
    badgeType: "Guide",
    iconType: "integrations",
    stepsCount: 4,
    popular: true,
    journeyId: "get-the-most-value",
  },
];

export const ALL_GUIDES: GuideItem[] = [
  FEATURED_GUIDE,
  ...POPULAR_GUIDES,
  // Remaining Getting Started (Total 6)
  {
    id: "gs-import-student-roster",
    slug: "bulk-import-student-roster",
    title: "Bulk Import Student Roster via CSV",
    description: "Import thousands of student records in under 3 minutes with automated schema validation.",
    category: "Getting Started",
    categoryId: "getting-started",
    readingTime: "6 min read",
    badgeType: "Step-by-Step",
    iconType: "rocket",
    stepsCount: 3,
    journeyId: "setup-your-school",
  },
  {
    id: "gs-configure-academic-year",
    slug: "configure-academic-year-and-terms",
    title: "Configure Academic Year & Term Dates",
    description: "Define school calendar terms, examination windows, and holiday closures.",
    category: "Getting Started",
    categoryId: "getting-started",
    readingTime: "4 min read",
    badgeType: "Quickstart",
    iconType: "rocket",
    stepsCount: 3,
    journeyId: "setup-your-school",
  },
  {
    id: "gs-parent-portal-invitations",
    slug: "send-parent-portal-invitations",
    title: "Broadcast Parent Portal Access Credentials",
    description: "Deliver SMS and WhatsApp credentials for parents to access attendance and fee statements.",
    category: "Getting Started",
    categoryId: "getting-started",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "rocket",
    stepsCount: 4,
    journeyId: "engage-parents",
  },
  {
    id: "gs-mobile-app-walkthrough",
    slug: "teacher-mobile-app-onboarding",
    title: "Teacher Mobile App Rollout Guide",
    description: "Guide your teaching staff to mark morning roll-call and assign homework via smartphones.",
    category: "Getting Started",
    categoryId: "getting-started",
    readingTime: "7 min read",
    badgeType: "Step-by-Step",
    iconType: "rocket",
    stepsCount: 4,
    journeyId: "manage-daily-operations",
  },

  // Remaining Admin & Settings (Total 5: 1 in popular + 4 here)
  {
    id: "as-two-factor-authentication",
    slug: "enable-two-factor-auth-for-staff",
    title: "Enable 2FA & Security Policies for Admins",
    description: "Protect sensitive student records with mandatory OTP verification and session timeout rules.",
    category: "Admin & Settings",
    categoryId: "admin-settings",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "settings",
    stepsCount: 3,
    journeyId: "setup-your-school",
  },
  {
    id: "as-school-branding-receipts",
    slug: "customize-school-letterhead-and-receipts",
    title: "Custom Letterheads, Receipts & Badges",
    description: "Configure dynamic headers, school motto, and digital principal signatures on official documents.",
    category: "Admin & Settings",
    categoryId: "admin-settings",
    readingTime: "6 min read",
    badgeType: "Step-by-Step",
    iconType: "settings",
    stepsCount: 4,
    journeyId: "setup-your-school",
  },
  {
    id: "as-multi-branch-organization",
    slug: "manage-multi-branch-campuses",
    title: "Manage Multi-Branch School Campuses",
    description: "Coordinate trust-wide head offices, unified finances, and distinct campus administrations.",
    category: "Admin & Settings",
    categoryId: "admin-settings",
    readingTime: "11 min read",
    badgeType: "Deep-Dive",
    iconType: "settings",
    stepsCount: 5,
    journeyId: "get-the-most-value",
  },
  {
    id: "as-audit-logs-tracking",
    slug: "track-staff-audit-logs-and-history",
    title: "Review System Audit Logs & Data Edits",
    description: "Trace every mark entry, fee adjustment, and student edit for complete institutional accountability.",
    category: "Admin & Settings",
    categoryId: "admin-settings",
    readingTime: "4 min read",
    badgeType: "Guide",
    iconType: "settings",
    stepsCount: 3,
    journeyId: "manage-daily-operations",
  },

  // Remaining Academics (Total 5: 1 in popular + 4 here)
  {
    id: "ac-grading-scales-setup",
    slug: "configure-cbse-icse-grading-scales",
    title: "Configure CBSE & ICSE Grading Scales",
    description: "Set up 8-point, 9-point, percentage, and co-scholastic grading systems effortlessly.",
    category: "Academics",
    categoryId: "academics",
    readingTime: "8 min read",
    badgeType: "Step-by-Step",
    iconType: "academics",
    stepsCount: 4,
    journeyId: "manage-daily-operations",
  },
  {
    id: "ac-publish-exam-report-cards",
    slug: "generate-and-publish-exam-report-cards",
    title: "Generate & Publish Digital Report Cards",
    description: "Compile term scores, compute GPA rankings, and publish watermarked PDF report cards.",
    category: "Academics",
    categoryId: "academics",
    readingTime: "7 min read",
    badgeType: "Guide",
    iconType: "academics",
    stepsCount: 5,
    journeyId: "engage-parents",
  },
  {
    id: "ac-lesson-plans-syllabus",
    slug: "track-curriculum-syllabus-completion",
    title: "Track Curriculum & Syllabus Milestones",
    description: "Ensure teachers stay aligned with academic schedules using real-time syllabus tracking.",
    category: "Academics",
    categoryId: "academics",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "academics",
    stepsCount: 3,
    journeyId: "manage-daily-operations",
  },
  {
    id: "ac-year-end-student-promotion",
    slug: "year-end-student-promotion-wizard",
    title: "Year-End Student Promotion & Rollover",
    description: "Promote passing students from Grade 9 to 10 with automatic section and fee updates.",
    category: "Academics",
    categoryId: "academics",
    readingTime: "6 min read",
    badgeType: "Quickstart",
    iconType: "academics",
    stepsCount: 4,
    journeyId: "manage-daily-operations",
  },

  // Remaining Fees & Payments (Total 4: 1 in popular + 3 here)
  {
    id: "fp-online-payment-gateway",
    slug: "configure-online-payment-gateways",
    title: "Enable UPI & NetBanking Online Payments",
    description: "Connect Razorpay or Stripe to allow parents to pay tuition fees via UPI and debit cards.",
    category: "Fees & Payments",
    categoryId: "fees-payments",
    readingTime: "9 min read",
    badgeType: "Step-by-Step",
    iconType: "fees",
    stepsCount: 4,
    journeyId: "manage-daily-operations",
  },
  {
    id: "fp-concession-scholarship-rules",
    slug: "apply-fee-concessions-and-scholarships",
    title: "Apply Sibling Discounts & Scholarships",
    description: "Set automated rules for staff wards, sibling concessions, and merit scholarships.",
    category: "Fees & Payments",
    categoryId: "fees-payments",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "fees",
    stepsCount: 3,
    journeyId: "manage-daily-operations",
  },
  {
    id: "fp-track-defaulters-due-reminders",
    slug: "automate-fee-dues-and-sms-reminders",
    title: "Automate Fee Dues & SMS Reminders",
    description: "Send automated gentle WhatsApp and SMS reminders 3 days before fee due dates.",
    category: "Fees & Payments",
    categoryId: "fees-payments",
    readingTime: "6 min read",
    badgeType: "Quickstart",
    iconType: "fees",
    stepsCount: 3,
    journeyId: "engage-parents",
  },

  // Remaining Reports & Analytics (Total 4: 1 in popular + 3 here)
  {
    id: "ra-financial-collection-ledgers",
    slug: "daily-fee-collection-and-defaulter-reports",
    title: "Daily Fee Collection & Defaulter Ledgers",
    description: "Audit counter collections, bank reconciliations, and outstanding balance aging.",
    category: "Reports & Analytics",
    categoryId: "reports-analytics",
    readingTime: "7 min read",
    badgeType: "Deep-Dive",
    iconType: "reports",
    stepsCount: 4,
    journeyId: "get-the-most-value",
  },
  {
    id: "ra-student-attendance-trends",
    slug: "student-attendance-trends-and-absenteeism",
    title: "Analyze Chronic Absenteeism & Attendance",
    description: "Identify drops in attendance patterns before examinations to take proactive intervention.",
    category: "Reports & Analytics",
    categoryId: "reports-analytics",
    readingTime: "5 min read",
    badgeType: "Guide",
    iconType: "reports",
    stepsCount: 3,
    journeyId: "get-the-most-value",
  },
  {
    id: "ra-export-board-compliance-reports",
    slug: "export-board-compliance-and-demographics",
    title: "Export Education Board Demographic Data",
    description: "Generate compliant student count transmittals and gender ratios with one click.",
    category: "Reports & Analytics",
    categoryId: "reports-analytics",
    readingTime: "6 min read",
    badgeType: "Step-by-Step",
    iconType: "reports",
    stepsCount: 3,
    journeyId: "get-the-most-value",
  },

  // Remaining Integrations (Total 4: 1 in popular + 3 here)
  {
    id: "int-biometric-rfid-turnstile",
    slug: "integrate-biometric-and-rfid-hardware",
    title: "Integrate Biometric & RFID Turnstiles",
    description: "Sync campus entrance RFID turnstiles directly with real-time student attendance.",
    category: "Integrations",
    categoryId: "integrations",
    readingTime: "10 min read",
    badgeType: "Deep-Dive",
    iconType: "integrations",
    stepsCount: 5,
    journeyId: "manage-daily-operations",
  },
  {
    id: "int-gps-school-bus-tracking",
    slug: "configure-gps-school-bus-tracking",
    title: "Configure GPS School Bus Route Tracking",
    description: "Integrate vehicle GPS trackers so parents can view live bus ETA on their smartphones.",
    category: "Integrations",
    categoryId: "integrations",
    readingTime: "8 min read",
    badgeType: "Step-by-Step",
    iconType: "integrations",
    stepsCount: 4,
    journeyId: "manage-daily-operations",
  },
  {
    id: "int-google-classroom-moodle",
    slug: "sync-google-classroom-and-moodle-lms",
    title: "Sync Google Classroom & Moodle LMS",
    description: "Automatically synchronize student rosters, course assignments, and grades with external LMS tools.",
    category: "Integrations",
    categoryId: "integrations",
    readingTime: "7 min read",
    badgeType: "Guide",
    iconType: "integrations",
    stepsCount: 4,
    journeyId: "get-the-most-value",
  },
];

export const GUIDE_JOURNEYS: GuideJourney[] = [
  {
    id: "setup-your-school",
    title: "Setup Your School",
    description: "A complete guide to get your school up and running.",
    iconType: "clipboard",
    guidesCount: 7,
    guideSlugs: [
      "complete-school-setup-guide",
      "get-started-in-10-minutes",
      "manage-users-and-roles",
      "bulk-import-student-roster",
      "configure-academic-year-and-terms",
      "enable-two-factor-auth-for-staff",
      "customize-school-letterhead-and-receipts",
    ],
  },
  {
    id: "manage-daily-operations",
    title: "Manage Daily Operations",
    description: "Guides for academics, attendance, fees and more.",
    iconType: "users",
    guidesCount: 8,
    guideSlugs: [
      "create-classes-and-timetables",
      "set-up-fees-and-payments",
      "configure-cbse-icse-grading-scales",
      "teacher-mobile-app-onboarding",
      "track-staff-audit-logs-and-history",
      "track-curriculum-syllabus-completion",
      "configure-online-payment-gateways",
      "integrate-biometric-and-rfid-hardware",
    ],
  },
  {
    id: "engage-parents",
    title: "Engage Parents",
    description: "Set up communication, share updates and keep parents informed.",
    iconType: "chart",
    guidesCount: 5,
    guideSlugs: [
      "send-parent-portal-invitations",
      "generate-and-publish-exam-report-cards",
      "automate-fee-dues-and-sms-reminders",
      "configure-gps-school-bus-tracking",
      "apply-fee-concessions-and-scholarships",
    ],
  },
  {
    id: "get-the-most-value",
    title: "Get the Most Value",
    description: "Tips and best practices to maximize your school's success.",
    iconType: "star",
    guidesCount: 8,
    guideSlugs: [
      "generate-reports-and-analytics",
      "connect-integrations",
      "manage-multi-branch-campuses",
      "daily-fee-collection-and-defaulter-reports",
      "student-attendance-trends-and-absenteeism",
      "export-board-compliance-and-demographics",
      "sync-google-classroom-and-moodle-lms",
      "year-end-student-promotion-wizard",
    ],
  },
];

export function getAllGuideSlugs(): string[] {
  return ALL_GUIDES.map((g) => g.slug);
}

export function getGuideBySlug(slug: string): GuideItem | null {
  return ALL_GUIDES.find((g) => g.slug === slug) ?? null;
}

export function getGuidesByCategory(categoryId: string): GuideItem[] {
  if (categoryId === "all") return ALL_GUIDES;
  return ALL_GUIDES.filter((g) => g.categoryId === categoryId);
}
