export interface HelpArticleStep {
  number: number;
  title: string;
  description: string;
}

export interface WhatsNextItem {
  title: string;
  description: string;
  iconType: "users" | "academics" | "fees" | "reports";
  href: string;
}

export interface DetailedHelpArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId: string;
  subtitle: string;
  lastUpdated: string;
  readTime: string;
  overviewText: string;
  beforeYouStart: string;
  setupSteps: HelpArticleStep[];
  allSetMessage: string;
  whatsNext: WhatsNextItem[];
  relatedSlugs: string[];
}

export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  iconType: "rocket" | "settings" | "users" | "academics" | "attendance" | "fees" | "reports" | "integrations";
  articleCount: number;
  articles: string[];
}

export const DETAILED_HELP_ARTICLES: DetailedHelpArticle[] = [
  {
    id: "setup-school-account",
    slug: "how-to-set-up-your-school-account",
    title: "How to Set Up Your School Account",
    category: "Getting Started",
    categoryId: "getting-started",
    subtitle:
      "A step-by-step guide to create your school account, complete the initial setup, and get your school ready to use ScholoNix.",
    lastUpdated: "Aug 28, 2025",
    readTime: "6 min read",
    overviewText:
      "Setting up your school account is the first step to start managing admissions, classes, attendance, fees, and more. This guide will walk you through the complete setup process, from creating your account to configuring your school details.",
    beforeYouStart:
      "Keep your school's basic information handy, such as school name, address, school type, and the estimated number of students.",
    setupSteps: [
      {
        number: 1,
        title: "Create Your Account",
        description: "Go to the Sign Up page, enter your name, work email, and create a secure password.",
      },
      {
        number: 2,
        title: "Verify Your Email",
        description: "Check your inbox and click the verification link to activate your account.",
      },
      {
        number: 3,
        title: "Add School Details",
        description: "Log in and enter your school's information, such as name, address, school type, and contact details.",
      },
      {
        number: 4,
        title: "Configure Basic Settings",
        description: "Set up academic year, classes, sections, and other key preferences.",
      },
      {
        number: 5,
        title: "Invite Your Team (Optional)",
        description: "Add admins, teachers, and staff to collaborate on the platform.",
      },
    ],
    allSetMessage:
      "Your school account is now ready. You can start adding students, managing classes, and exploring other features.",
    whatsNext: [
      {
        title: "Add Students",
        description: "Import or add student details to your school.",
        iconType: "users",
        href: "/help/add-students-in-bulk-csv-upload",
      },
      {
        title: "Create Classes",
        description: "Set up classes, sections, and timetables.",
        iconType: "academics",
        href: "/help/create-classes-sections-and-timetables",
      },
      {
        title: "Set Up Fees",
        description: "Configure fee structures and start collecting payments.",
        iconType: "fees",
        href: "/help/configure-fee-structures-and-collect-payments",
      },
      {
        title: "Explore Reports",
        description: "Track attendance, academic progress, and more.",
        iconType: "reports",
        href: "/help/mark-and-manage-student-attendance",
      },
    ],
    relatedSlugs: [
      "getting-started-with-school-management-saas",
      "add-students-in-bulk-csv-upload",
      "configure-fee-structures-and-collect-payments",
      "create-classes-sections-and-timetables",
    ],
  },
  {
    id: "getting-started-overview",
    slug: "getting-started-with-school-management-saas",
    title: "Getting Started with ScholoNix",
    category: "Getting Started",
    categoryId: "getting-started",
    subtitle:
      "An institutional primer covering platform architecture, portal navigation, and security standards.",
    lastUpdated: "Aug 26, 2025",
    readTime: "5 min read",
    overviewText:
      "ScholoNix is built from the ground up for K-12 schools, CBSE/ICSE colleges, and multi-branch educational academies. Learn how each module connects seamlessly.",
    beforeYouStart:
      "Confirm you have administrator privileges for your institution's tenant domain.",
    setupSteps: [
      {
        number: 1,
        title: "Access the Administrative Dashboard",
        description: "Sign in with your master school administrator credentials.",
      },
      {
        number: 2,
        title: "Review Security and Isolation Settings",
        description: "Verify PostgreSQL Row-Level Security rules and tenant scoping.",
      },
      {
        number: 3,
        title: "Familiarize with the Global Sidebar",
        description: "Explore Admissions, Academics, Finance, and Communication tabs.",
      },
      {
        number: 4,
        title: "Download Staff Mobile Quick Start Guides",
        description: "Share simplified teacher guidelines for daily roll call and marks entry.",
      },
    ],
    allSetMessage:
      "You have completed the onboarding primer! Proceed to configuring academic sessions.",
    whatsNext: [
      {
        title: "School Account Setup",
        description: "Complete full institutional profile configuration.",
        iconType: "academics",
        href: "/help/how-to-set-up-your-school-account",
      },
      {
        title: "Add Students",
        description: "Import student rosters in bulk.",
        iconType: "users",
        href: "/help/add-students-in-bulk-csv-upload",
      },
    ],
    relatedSlugs: [
      "how-to-set-up-your-school-account",
      "add-students-in-bulk-csv-upload",
      "create-classes-sections-and-timetables",
    ],
  },
  {
    id: "add-students-bulk-csv",
    slug: "add-students-in-bulk-csv-upload",
    title: "Add Students in Bulk (CSV Upload)",
    category: "Students & Parents",
    categoryId: "students-parents",
    subtitle:
      "Save hours by importing hundreds of student records, guardian contacts, and previous scores using our validated CSV spreadsheet template.",
    lastUpdated: "Aug 22, 2025",
    readTime: "5 min read",
    overviewText:
      "Manual single-student entry can take days for large schools. Our bulk CSV import validates fields in real time, preventing duplicate enrollment numbers.",
    beforeYouStart:
      "Prepare your student master spreadsheet with Admission Number, Full Name, Grade, Section, and Parent Contact Number.",
    setupSteps: [
      {
        number: 1,
        title: "Download the Official CSV Template",
        description: "Navigate to Students > Directory > Bulk Import and click 'Download Template'.",
      },
      {
        number: 2,
        title: "Populate Student and Guardian Fields",
        description: "Paste your existing school records into the columns without altering header names.",
      },
      {
        number: 3,
        title: "Upload to the Validation Engine",
        description: "Drop your CSV file into the importer to automatically check for format errors.",
      },
      {
        number: 4,
        title: "Confirm and Generate Student Credentials",
        description: "Click 'Finalize Import' to provision student profiles and send parent SMS invites.",
      },
    ],
    allSetMessage:
      "All students have been imported successfully and can now be enrolled in timetable periods.",
    whatsNext: [
      {
        title: "Create Classes",
        description: "Assign students to classrooms and sections.",
        iconType: "academics",
        href: "/help/create-classes-sections-and-timetables",
      },
      {
        title: "Set Up Fees",
        description: "Generate student fee ledgers.",
        iconType: "fees",
        href: "/help/configure-fee-structures-and-collect-payments",
      },
    ],
    relatedSlugs: [
      "how-to-set-up-your-school-account",
      "create-classes-sections-and-timetables",
      "mark-and-manage-student-attendance",
    ],
  },
  {
    id: "create-classes-sections-timetables",
    slug: "create-classes-sections-and-timetables",
    title: "Create Classes, Sections and Timetables",
    category: "Academics",
    categoryId: "academics",
    subtitle:
      "Structure your classes, assign class teachers, configure subjects, and generate conflict-free period schedules.",
    lastUpdated: "Aug 18, 2025",
    readTime: "6 min read",
    overviewText:
      "The academic timetable engine ensures no educator is double-booked across classes or lab sessions while balancing weekly subject workload.",
    beforeYouStart:
      "Have your academic subject list, room allocations, and faculty working hours ready.",
    setupSteps: [
      {
        number: 1,
        title: "Define Classes & Sections",
        description: "Go to Academics > Classes and add grades 1 through 12 with sections A, B, and C.",
      },
      {
        number: 2,
        title: "Map Subjects and Credits",
        description: "Assign mandatory and elective subjects with weekly period requirements.",
      },
      {
        number: 3,
        title: "Design Period Schedules",
        description: "Set school start time, bell duration (e.g. 45 min), recess, and prayer assembly.",
      },
      {
        number: 4,
        title: "Run the Conflict Detector",
        description: "Click 'Auto-Generate' to resolve any teacher room overlapping conflicts instantly.",
      },
    ],
    allSetMessage:
      "Your master school timetable is active and published to student and teacher portals.",
    whatsNext: [
      {
        title: "Mark Attendance",
        description: "Start taking daily period roll calls.",
        iconType: "reports",
        href: "/help/mark-and-manage-student-attendance",
      },
    ],
    relatedSlugs: [
      "how-to-set-up-your-school-account",
      "add-students-in-bulk-csv-upload",
      "configure-fee-structures-and-collect-payments",
    ],
  },
  {
    id: "configure-fee-structures-and-collect-payments",
    slug: "configure-fee-structures-and-collect-payments",
    title: "Configure Fee Structures and Collect Payments",
    category: "Fees & Payments",
    categoryId: "fees-payments",
    subtitle:
      "Set up tuition fees, transport charges, lab dues, discounts/concessions, and integrate online UPI/Card payment gateways.",
    lastUpdated: "Aug 15, 2025",
    readTime: "5 min read",
    overviewText:
      "Automated financial reconciliation eliminates physical cash counters and reconciliation errors. Receipts with verifiable QR codes are issued instantly.",
    beforeYouStart:
      "Have your school bank account details and active payment gateway credentials (Razorpay / Stripe) on hand.",
    setupSteps: [
      {
        number: 1,
        title: "Create Institutional Fee Plans",
        description: "Set tuition, transport, and examination fee amounts for each grade tier.",
      },
      {
        number: 2,
        title: "Schedule Payment Due Dates",
        description: "Select monthly, quarterly, or term billing with grace period dates.",
      },
      {
        number: 3,
        title: "Enable Online Parent Payments",
        description: "Connect UPI, Net Banking, and Cards so parents pay from the mobile app.",
      },
      {
        number: 4,
        title: "Set Automated WhatsApp/SMS Reminders",
        description: "Send friendly reminders 3 days before dues to minimize collection delays.",
      },
    ],
    allSetMessage:
      "Online fee collection is live! Real-time receipts will log automatically in your accountant ledger.",
    whatsNext: [
      {
        title: "Explore Reports",
        description: "View fee collection analytics and dues ledger.",
        iconType: "reports",
        href: "/help/how-to-set-up-your-school-account",
      },
    ],
    relatedSlugs: [
      "how-to-set-up-your-school-account",
      "add-students-in-bulk-csv-upload",
      "create-classes-sections-and-timetables",
    ],
  },
  {
    id: "mark-manage-student-attendance",
    slug: "mark-and-manage-student-attendance",
    title: "Mark and Manage Student Attendance",
    category: "Attendance",
    categoryId: "attendance",
    subtitle:
      "Record classroom attendance in seconds via mobile or web portal, with automatic daily absent alerts sent to parents.",
    lastUpdated: "Aug 10, 2025",
    readTime: "4 min read",
    overviewText:
      "Daily roll call takes less than 30 seconds per class. Absent student alerts are automatically dispatched to parent phones at 9:30 AM every morning.",
    beforeYouStart:
      "Ensure class teachers have active smartphone or desktop access.",
    setupSteps: [
      {
        number: 1,
        title: "Open Daily Attendance Roster",
        description: "Log in as Class Teacher and select today's class and section.",
      },
      {
        number: 2,
        title: "Toggle Absent Students",
        description: "All students start as 'Present'. Tap any absent student name to switch status.",
      },
      {
        number: 3,
        title: "Submit and Dispatch Alerts",
        description: "Click 'Submit'. Absent notices are sent to registered parent mobile numbers.",
      },
    ],
    allSetMessage:
      "Attendance records are compiled into monthly institutional reports for state compliance.",
    whatsNext: [
      {
        title: "Explore Reports",
        description: "Audit monthly attendance percentages.",
        iconType: "reports",
        href: "/help/how-to-set-up-your-school-account",
      },
    ],
    relatedSlugs: [
      "how-to-set-up-your-school-account",
      "add-students-in-bulk-csv-upload",
      "create-classes-sections-and-timetables",
    ],
  },
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Account setup, onboarding and quick start guides.",
    iconType: "rocket",
    articleCount: 12,
    articles: [
      "How to Set Up Your School Account",
      "Getting Started with ScholoNix",
      "Navigating your school dashboard",
      "School branding and crest upload",
    ],
  },
  {
    id: "admin-settings",
    title: "Admin & Settings",
    description: "School profile, users, roles and configurations.",
    iconType: "settings",
    articleCount: 18,
    articles: [
      "Managing RBAC roles and permissions",
      "Configuring academic calendar sessions",
      "SMS & Email notification gateways",
      "Data backup and security controls",
    ],
  },
  {
    id: "students-parents",
    title: "Students & Parents",
    description: "Student records, parent access and communication.",
    iconType: "users",
    articleCount: 22,
    articles: [
      "Add Students in Bulk (CSV Upload)",
      "Student digital identity cards",
      "Parent portal account activation",
      "Parent broadcast notices and circulars",
    ],
  },
  {
    id: "academics",
    title: "Academics",
    description: "Classes, subjects, lesson plans and timetables.",
    iconType: "academics",
    articleCount: 16,
    articles: [
      "Create Classes, Sections and Timetables",
      "Syllabus and lesson plan management",
      "Examination marks entry & grading",
      "Report card template customization",
    ],
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Mark, track and manage student attendance.",
    iconType: "attendance",
    articleCount: 10,
    articles: [
      "Mark and Manage Student Attendance",
      "Staff biometric attendance integration",
      "Leave application & approval workflows",
      "Monthly attendance register exports",
    ],
  },
  {
    id: "fees-payments",
    title: "Fees & Payments",
    description: "Fee setup, online payments, receipts and reports.",
    iconType: "fees",
    articleCount: 15,
    articles: [
      "Configure Fee Structures and Collect Payments",
      "Setting up student fee concessions",
      "Late fee and penalty policies",
      "Daily cash counter reconciliation",
    ],
  },
  {
    id: "reports-analytics",
    title: "Reports & Analytics",
    description: "Academic, attendance, fee and custom reports.",
    iconType: "reports",
    articleCount: 14,
    articles: [
      "Executive overview dashboard",
      "Fee collection & defaulters reports",
      "Student performance trend analytics",
      "Custom CSV / PDF report export",
    ],
  },
  {
    id: "integrations-more",
    title: "Integrations & More",
    description: "Third-party integrations, data import and other tools.",
    iconType: "integrations",
    articleCount: 9,
    articles: [
      "Payment gateway integration (Razorpay/Stripe)",
      "WhatsApp & SMS provider setup",
      "Google Classroom & LMS sync",
      "RFID & Biometric hardware connection",
    ],
  },
];

export const VIDEO_TUTORIALS = [
  {
    id: "vid-1",
    title: "Complete 10-Minute School Setup Walkthrough",
    duration: "9:42",
    views: "14.2k views",
  },
  {
    id: "vid-2",
    title: "How to Import 500+ Students via CSV in 2 Minutes",
    duration: "4:15",
    views: "8.9k views",
  },
  {
    id: "vid-3",
    title: "Setting Up Online Fee Payments & Instant Receipts",
    duration: "6:30",
    views: "11.5k views",
  },
  {
    id: "vid-4",
    title: "Generating Conflict-Free Master Class Timetables",
    duration: "7:18",
    views: "6.7k views",
  },
];

export function getDetailedHelpArticleBySlug(slug: string): DetailedHelpArticle | undefined {
  return DETAILED_HELP_ARTICLES.find(
    (a) => a.slug === slug || a.id === slug
  );
}

export function getAdjacentHelpArticles(currentSlug: string): {
  prev: DetailedHelpArticle | null;
  next: DetailedHelpArticle | null;
} {
  const index = DETAILED_HELP_ARTICLES.findIndex(
    (a) => a.slug === currentSlug || a.id === currentSlug
  );
  if (index === -1) return { prev: null, next: null };
  const prev = index > 0 ? (DETAILED_HELP_ARTICLES[index - 1] ?? null) : null;
  const next =
    index < DETAILED_HELP_ARTICLES.length - 1
      ? (DETAILED_HELP_ARTICLES[index + 1] ?? null)
      : null;
  return { prev, next };
}

export function getRelatedHelpArticles(slugs: string[]): DetailedHelpArticle[] {
  return DETAILED_HELP_ARTICLES.filter((a) => slugs.includes(a.slug));
}
