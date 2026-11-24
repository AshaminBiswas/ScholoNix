export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategoryGroup {
  id: string;
  name: string;
  iconType: "info" | "features" | "pricing" | "onboarding" | "security" | "support";
  count: number;
  items: FAQItem[];
}

export const FAQ_CATEGORIES: FAQCategoryGroup[] = [
  {
    id: "general",
    name: "General",
    iconType: "info",
    count: 6,
    items: [
      {
        id: "what-is-school-management-saas",
        question: "What is ScholoNix?",
        answer:
          "ScholoNix is a cloud-based platform that helps schools manage their entire operations, including admissions, academics, attendance, fees, staff, communication and reports — all in one place.",
      },
      {
        id: "who-can-use-this-platform",
        question: "Who can use this platform?",
        answer:
          "The platform is designed for school administrators, principals, accountants, teachers, parents, and students. Each user role has customized permissions and a dedicated dashboard tailored to their specific daily workflows.",
      },
      {
        id: "is-it-suitable-for-all-types-of-schools",
        question: "Is it suitable for all types of schools?",
        answer:
          "Yes. Our platform natively supports K-12 private institutions, CBSE/ICSE schools, State Board academies, international curriculum schools (IB/Cambridge), and multi-branch educational trusts of any size.",
      },
      {
        id: "do-i-need-to-install-any-software",
        question: "Do I need to install any software?",
        answer:
          "No installation is required. ScholoNix runs 100% in modern web browsers (Chrome, Edge, Safari, Firefox) on laptops, desktops, tablets, and smartphones with automatic cloud updates.",
      },
      {
        id: "can-i-access-it-from-mobile",
        question: "Can teachers and parents access the system from their smartphones?",
        answer:
          "Absolutely. Our responsive mobile interface and dedicated mobile app allow teachers to mark attendance during morning roll call and parents to view notices, check attendance, and pay fees from anywhere.",
      },
      {
        id: "how-does-multi-branch-management-work",
        question: "How does multi-branch management work?",
        answer:
          "School trusts can manage multiple campuses from a single super-admin dashboard with consolidated financial ledgers while keeping campus-level student and staff data completely isolated.",
      },
    ],
  },
  {
    id: "features",
    name: "Features",
    iconType: "features",
    count: 8,
    items: [
      {
        id: "what-are-key-features",
        question: "What are the key features of the platform?",
        answer:
          "Key features include online admissions & enquiry CRM, student directory, class timetable generator, daily attendance tracking, fee collection with instant digital receipts, examination grading & report cards, parent communication, and operational analytics.",
      },
      {
        id: "manage-admissions-attendance-fees-one-system",
        question: "Can I manage admissions, attendance and fees in one system?",
        answer:
          "Yes. Everything is interconnected. An admitted student's record immediately generates their tuition fee structure, assigns them to an academic section, and links their attendance logs seamlessly.",
      },
      {
        id: "does-it-support-parent-teacher-communication",
        question: "Does it support parent and teacher communication?",
        answer:
          "Yes. You can broadcast school-wide announcements, emergency weather alerts, homework circulars, and event calendar invites via instant push notifications, SMS, and email.",
      },
      {
        id: "can-i-generate-reports-and-analytics",
        question: "Can I generate reports and analytics?",
        answer:
          "Yes. Generate real-time visual reports on fee dues, collection aging, student attendance trends, academic grade distribution, and staff leave utilization with single-click PDF and CSV export.",
      },
      {
        id: "is-there-a-digital-report-card-system",
        question: "Can we customize report cards according to our board's grading system?",
        answer:
          "Yes. The examination module supports CBSE 8-point and 9-point grading, ICSE transcripts, percentage systems, and customizable scholastic and co-scholastic remark templates.",
      },
      {
        id: "does-it-support-biometric-attendance",
        question: "Does the platform integrate with biometric or RFID hardware?",
        answer:
          "Yes. We support API integration with standard biometric fingerprint devices and RFID turnstiles for automated campus entry and bus boarding logging.",
      },
      {
        id: "can-we-manage-school-transport",
        question: "Is there a transport and bus route tracking feature?",
        answer:
          "Yes. You can configure school buses, driver profiles, pickup stop timings, student bus allocations, and transport fee calculations.",
      },
      {
        id: "is-library-management-included",
        question: "Can we track library books and student borrowings?",
        answer:
          "Yes. The library module includes ISBN book cataloging, barcode scanning, issue and return logs, and automated overdue penalty tracking.",
      },
    ],
  },
  {
    id: "pricing-plans",
    name: "Pricing & Plans",
    iconType: "pricing",
    count: 5,
    items: [
      {
        id: "what-pricing-plans-do-you-offer",
        question: "What pricing plans do you offer?",
        answer:
          "We offer transparent tier-based plans: Starter (up to 300 students), Professional (up to 1,000 students), and Enterprise (unlimited students with multi-branch management). Custom annual discounts are available for non-profit and government-aided schools.",
      },
      {
        id: "is-there-a-free-trial-available",
        question: "Is there a free trial available?",
        answer:
          "Yes! We offer a full-featured 14-day free trial with no credit card required. Our team can also pre-load sample demo student data so you can test all features immediately.",
      },
      {
        id: "can-i-upgrade-or-downgrade-my-plan-later",
        question: "Can I upgrade or downgrade my plan later?",
        answer:
          "Yes. You can upgrade your student capacity tier anytime from your institutional billing portal as your student enrollment grows. Upgrades take effect immediately with prorated billing.",
      },
      {
        id: "are-there-any-hidden-setup-fees",
        question: "Are there any hidden setup or data migration fees?",
        answer:
          "No hidden fees. All core modules, cloud storage, standard updates, and server maintenance are covered in your transparent subscription plan.",
      },
      {
        id: "what-payment-methods-are-accepted",
        question: "What payment methods are accepted for platform subscription?",
        answer:
          "We accept institutional NEFT/RTGS bank transfers, UPI, corporate credit/debit cards, and automated quarterly/annual invoicing.",
      },
    ],
  },
  {
    id: "setup-onboarding",
    name: "Setup & Onboarding",
    iconType: "onboarding",
    count: 5,
    items: [
      {
        id: "how-long-does-it-take-to-get-started",
        question: "How long does it take to get started?",
        answer:
          "Most schools are completely live within 2 to 5 business days. With our bulk CSV spreadsheet importer, you can upload your existing student roster and staff records in minutes.",
      },
      {
        id: "do-you-provide-support-during-onboarding",
        question: "Do you provide support during onboarding?",
        answer:
          "Yes. Every school is assigned a dedicated Onboarding Specialist who provides interactive live video training sessions for your administrators, accountants, and teaching staff.",
      },
      {
        id: "can-we-import-data-from-our-old-software",
        question: "Can we migrate data from our previous school software or Excel sheets?",
        answer:
          "Yes. Our migration specialists help export, sanitize, and validate your historical student files, fee ledgers, and academic archives into the new system with zero data loss.",
      },
      {
        id: "is-staff-training-included",
        question: "Do you provide training for teachers and staff who are not tech-savvy?",
        answer:
          "Yes. We conduct tailored virtual hands-on workshops and provide bilingual video guides to ensure every teacher is comfortable marking attendance and entering marks.",
      },
      {
        id: "what-happens-when-the-academic-year-ends",
        question: "How does the academic year promotion workflow work?",
        answer:
          "Our single-click Year Promotion wizard automatically promotes passing students to the next grade (e.g. Grade 5 to Grade 6), archives previous academic records, and sets up fresh fee structures.",
      },
    ],
  },
  {
    id: "security-data",
    name: "Security & Data",
    iconType: "security",
    count: 4,
    items: [
      {
        id: "is-my-schools-data-safe-and-secure",
        question: "Is my school's data safe and secure?",
        answer:
          "Yes. We employ bank-grade AES-256 encryption at rest and TLS 1.3 in transit. Every school operates within an isolated tenant partition enforced by strict PostgreSQL Row-Level Security (RLS).",
      },
      {
        id: "do-you-follow-data-privacy-and-compliance-standards",
        question: "Do you follow data privacy and compliance standards?",
        answer:
          "Yes. We strictly adhere to student data protection guidelines, ISO 27001 security standards, and local education board compliance. Student and guardian data is never monetized or shared with third parties.",
      },
      {
        id: "how-often-are-backups-taken",
        question: "How often are automated data backups taken?",
        answer:
          "Automated point-in-time backups are created every 6 hours and replicated across geographically redundant data centers, ensuring a 99.99% recovery point objective.",
      },
      {
        id: "who-owns-our-institutional-data",
        question: "Who owns our school's data if we decide to leave?",
        answer:
          "Your institution retains 100% ownership of all student, staff, and financial data. You can export complete relational backups in standard CSV, Excel, or JSON formats at any time.",
      },
    ],
  },
  {
    id: "support",
    name: "Support",
    iconType: "support",
    count: 4,
    items: [
      {
        id: "how-can-i-get-help-if-i-have-an-issue",
        question: "How can I get help if I have an issue?",
        answer:
          "You can reach our dedicated support desk via live in-app chat, official WhatsApp support, email ticketing, and phone assistance. All tickets are tracked with transparent SLAs.",
      },
      {
        id: "what-are-your-support-hours",
        question: "What are your support hours?",
        answer:
          "Our standard support is available Monday through Saturday from 8:00 AM to 8:00 PM IST. Enterprise accounts receive 24/7 emergency incident coverage for critical events like online fee deadlines and board exam publication.",
      },
      {
        id: "is-there-a-self-service-knowledge-base",
        question: "Are there step-by-step guides and video tutorials available?",
        answer:
          "Yes! Visit our official Help Center (/help) to browse searchable documentation, video tutorials, and interactive troubleshooting guides anytime.",
      },
      {
        id: "how-fast-are-critical-bugs-resolved",
        question: "How quickly are critical bugs or urgent issues addressed?",
        answer:
          "Critical severity issues (affecting payments or school logins) have a guaranteed first-response time of under 15 minutes and dedicated engineering escalation.",
      },
    ],
  },
];

export interface FAQBenefit {
  title: string;
  description: string;
  iconType: "zap" | "cloud" | "users" | "chart" | "shield" | "check";
}

export interface FAQStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface DetailedFAQArticle {
  id: string;
  question: string;
  subtitle: string;
  category: string;
  categoryId: string;
  lastUpdated: string;
  readingTime: string;
  overview: string;
  howItWorks: string;
  keyBenefits: FAQBenefit[];
  steps: FAQStep[];
  callout: string;
  relatedFaqs: FAQItem[];
}

export const DETAILED_FAQ_ARTICLES: Record<string, Partial<DetailedFAQArticle>> = {
  "what-is-school-management-saas": {
    id: "what-is-school-management-saas",
    question: "What is ScholoNix?",
    subtitle:
      "Learn what ScholoNix is, how it works and how it helps schools manage their operations efficiently.",
    category: "General",
    categoryId: "general",
    lastUpdated: "Aug 28, 2025",
    readingTime: "4 min",
    overview:
      "ScholoNix is a cloud-based school management platform (SaaS) that helps schools manage their entire operations in one place. It brings together academics, admissions, attendance, fees, communication and reporting — so schools can work more efficiently, stay organized and deliver a better experience for students, parents and staff.",
    howItWorks:
      "Being a cloud-based solution, ScholoNix doesn't require any complex installation. You can access it securely from any device with an internet connection, set up your school, add your data and start managing day-to-day operations in just a few steps.",
    keyBenefits: [
      {
        title: "All-in-One Platform",
        description: "Manage academics, fees, attendance and more.",
        iconType: "zap",
      },
      {
        title: "Cloud-Based & Secure",
        description: "Access anywhere, anytime with enterprise-grade security.",
        iconType: "cloud",
      },
      {
        title: "Better Collaboration",
        description: "Keep teachers, students and parents connected.",
        iconType: "users",
      },
      {
        title: "Data-Driven Decisions",
        description: "Get real-time reports and insights to improve performance.",
        iconType: "chart",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Create Your School",
        description: "Sign up and set up your school profile.",
      },
      {
        stepNumber: 2,
        title: "Add Your Data",
        description: "Add students, staff, classes and more.",
      },
      {
        stepNumber: 3,
        title: "Start Managing",
        description: "Use the platform to run your school operations.",
      },
    ],
    callout:
      "In short, ScholoNix simplifies school operations, saves time, reduces manual work and helps schools focus on what matters most — student success.",
  },
};

/**
 * Returns all FAQ slugs for SSG static param generation
 */
export function getAllFaqSlugs(): string[] {
  const slugs: string[] = [];
  for (const group of FAQ_CATEGORIES) {
    for (const item of group.items) {
      slugs.push(item.id);
    }
  }
  return slugs;
}

/**
 * Resolves a dynamic FAQ article by slug with rich details
 */
export function getFaqBySlug(slug: string): DetailedFAQArticle | null {
  // Find matching FAQ and its parent category
  let foundItem: FAQItem | null = null;
  let foundCategory: FAQCategoryGroup | null = null;

  for (const group of FAQ_CATEGORIES) {
    const item = group.items.find((i) => i.id === slug);
    if (item) {
      foundItem = item;
      foundCategory = group;
      break;
    }
  }

  if (!foundItem || !foundCategory) {
    return null;
  }

  // Get related FAQs from the same category (excluding current)
  const relatedFaqs = foundCategory.items
    .filter((i) => i.id !== foundItem.id)
    .slice(0, 4);

  // If we have custom detailed content defined, merge it
  const custom = DETAILED_FAQ_ARTICLES[slug];
  if (custom) {
    return {
      id: foundItem.id,
      question: custom.question || foundItem.question,
      subtitle:
        custom.subtitle ||
        `Learn about ${foundItem.question.toLowerCase()} and how ScholoNix streamlines operations.`,
      category: custom.category || foundCategory.name,
      categoryId: custom.categoryId || foundCategory.id,
      lastUpdated: custom.lastUpdated || "Aug 28, 2025",
      readingTime: custom.readingTime || "4 min",
      overview: custom.overview || foundItem.answer,
      howItWorks:
        custom.howItWorks ||
        "Being a modern cloud-based solution, ScholoNix operates seamlessly without any server installation. Access your school portal securely across all desktop, tablet, and smartphone devices.",
      keyBenefits: custom.keyBenefits || [
        {
          title: "All-in-One Platform",
          description: "Manage academics, fees, attendance and more.",
          iconType: "zap",
        },
        {
          title: "Cloud-Based & Secure",
          description: "Access anywhere, anytime with enterprise-grade security.",
          iconType: "cloud",
        },
        {
          title: "Better Collaboration",
          description: "Keep teachers, students and parents connected.",
          iconType: "users",
        },
        {
          title: "Data-Driven Decisions",
          description: "Get real-time reports and insights to improve performance.",
          iconType: "chart",
        },
      ],
      steps: custom.steps || [
        {
          stepNumber: 1,
          title: "Create Your School",
          description: "Sign up and set up your school profile.",
        },
        {
          stepNumber: 2,
          title: "Add Your Data",
          description: "Add students, staff, classes and more.",
        },
        {
          stepNumber: 3,
          title: "Start Managing",
          description: "Use the platform to run your school operations.",
        },
      ],
      callout:
        custom.callout ||
        `In short, ScholoNix simplifies school operations, saves time, reduces manual work and helps schools focus on what matters most — student success.`,
      relatedFaqs: custom.relatedFaqs || relatedFaqs,
    };
  }

  // Dynamic fallback for any other FAQ item
  return {
    id: foundItem.id,
    question: foundItem.question,
    subtitle: `Detailed guidance and answers regarding ${foundItem.question.toLowerCase().replace(/\?$/, "")}.`,
    category: foundCategory.name,
    categoryId: foundCategory.id,
    lastUpdated: "Aug 28, 2025",
    readingTime: "3 min",
    overview: foundItem.answer,
    howItWorks:
      "All modules in ScholoNix are natively integrated with zero latency. Every action taken by your administrative staff, teachers, or accountants updates relevant records across the school system instantly.",
    keyBenefits: [
      {
        title: "All-in-One Platform",
        description: "Manage admissions, attendance, fees and examinations in one unified portal.",
        iconType: "zap",
      },
      {
        title: "Cloud-Based & Secure",
        description: "PostgreSQL Row-Level Security ensures tenant isolation and 99.99% cloud uptime.",
        iconType: "cloud",
      },
      {
        title: "Better Collaboration",
        description: "Keep principals, teachers, accountants, and parents continuously in sync.",
        iconType: "users",
      },
      {
        title: "Data-Driven Decisions",
        description: "Generate instant PDF ledgers, demographic reports, and academic insights.",
        iconType: "chart",
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Configure Feature Settings",
        description: "Navigate to administrative settings to customize preferences for your school.",
      },
      {
        stepNumber: 2,
        title: "Assign Roles & Data",
        description: "Invite staff members and assign secure role-based access permissions.",
      },
      {
        stepNumber: 3,
        title: "Track Live Progress",
        description: "Monitor daily operations through real-time dashboards and notifications.",
      },
    ],
    callout:
      "ScholoNix provides end-to-end operational visibility, ensuring transparent communication, timely fee collections, and elevated student outcomes.",
    relatedFaqs,
  };
}
