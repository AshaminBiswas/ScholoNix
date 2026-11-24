"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Home,
  ChevronRight,
  Bookmark,
  Share2,
  Info,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  ListOrdered,
  Headphones,
  Check,
  X,
  Menu,
  Sparkles,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  Lightbulb,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import type { GuideItem } from "../data/guides-data";
import { BrandLogo } from "@/components/ui/brand-logo";

interface GuideDetailPageProps {
  guide: GuideItem;
  relatedGuides: GuideItem[];
  prevGuide: GuideItem | null;
  nextGuide: GuideItem | null;
}

// Hero Artwork: Laptop with Graduation Cap, Stepper, and Open Book
function GuideHeroIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-2xl items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/40 to-[#93C5FD]/30 blur-2xl filter" />

      <svg
        viewBox="0 0 620 360"
        className="relative z-10 h-auto w-full max-w-[540px] drop-shadow-2xl transition-transform duration-700 hover:scale-[1.01]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laptopShellGuide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#663CF6" />
          </linearGradient>
          <linearGradient id="displayBgGuide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="mortarCapGuide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="plantLeafGuide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Ambient shadow */}
        <ellipse cx="310" cy="325" rx="260" ry="22" fill="#1E1B4B" fillOpacity="0.12" />

        {/* ================= LEFT ACCENT: Potted Plant on Stack of Books ================= */}
        <g transform="translate(30, 110)">
          {/* Leaves of the plant */}
          <path d="M 50 80 C 20 40, 45 10, 60 25 C 75 40, 65 70, 50 80 Z" fill="url(#plantLeafGuide)" />
          <path d="M 60 80 C 80 35, 110 40, 100 60 C 90 80, 75 80, 60 80 Z" fill="url(#plantLeafGuide)" opacity="0.85" />
          <path d="M 60 80 C 50 30, 70 0, 80 20 C 90 40, 75 70, 60 80 Z" fill="#10B981" />
          <path d="M 45 80 C 30 60, 35 45, 45 55 C 55 65, 50 75, 45 80 Z" fill="#059669" opacity="0.9" />

          {/* Plant Pot */}
          <path d="M 42 80 L 78 80 L 72 110 L 48 110 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="40" y="77" width="40" height="5" rx="2" fill="#E2E8F0" />

          {/* Bottom Book (Cyan) */}
          <rect x="15" y="130" width="95" height="18" rx="3" fill="#38BDF8" />
          <rect x="17" y="133" width="90" height="3" rx="1.5" fill="#BAE6FD" />
          {/* Middle Book (Purple) */}
          <rect x="25" y="116" width="85" height="16" rx="3" fill="#8B5CF6" />
          <rect x="27" y="119" width="80" height="3" rx="1.5" fill="#DDD6FE" />
        </g>

        {/* ================= RIGHT ACCENT: Pen & Tools Holder ================= */}
        <g transform="translate(510, 130)">
          <line x1="25" y1="90" x2="15" y2="40" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <line x1="35" y1="90" x2="35" y2="35" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" />
          <line x1="45" y1="90" x2="55" y2="38" stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" />
          <line x1="40" y1="90" x2="48" y2="48" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />

          <rect x="15" y="80" width="50" height="60" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="20" y="85" width="40" height="50" rx="4" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* ================= CENTER: Laptop displaying Interactive Stepper ================= */}
        <g transform="translate(130, 20)">
          {/* Screen Outer Bezel */}
          <rect x="20" y="20" width="320" height="210" rx="14" fill="url(#laptopShellGuide)" />
          {/* Camera Dot */}
          <circle cx="180" cy="28" r="3" fill="#A5B4FC" opacity="0.8" />
          {/* Screen Display Inner */}
          <rect x="32" y="36" width="296" height="182" rx="8" fill="url(#displayBgGuide)" />

          {/* Stepper Header Bar */}
          <rect x="42" y="46" width="276" height="20" rx="4" fill="#EDE9FE" />
          <rect x="50" y="52" width="70" height="8" rx="2" fill="#7C3AED" />
          <rect x="286" y="52" width="22" height="8" rx="2" fill="#C4B5FD" />

          {/* Stepper Progress Nodes on Screen */}
          <g transform="translate(52, 78)">
            {/* Step 1: Complete */}
            <circle cx="20" cy="16" r="14" fill="#7C3AED" />
            <path d="M 15 16 L 19 20 L 26 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="4" y="36" width="32" height="6" rx="2" fill="#08093B" />

            {/* Connecting Line 1-2 */}
            <line x1="38" y1="16" x2="102" y2="16" stroke="#7C3AED" strokeWidth="3" strokeDasharray="3 3" />

            {/* Step 2: Active */}
            <circle cx="120" cy="16" r="14" fill="#663CF6" />
            <text x="120" y="21" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">2</text>
            <rect x="104" y="36" width="32" height="6" rx="2" fill="#7C3AED" />

            {/* Connecting Line 2-3 */}
            <line x1="138" y1="16" x2="202" y2="16" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="3 3" />

            {/* Step 3: Pending */}
            <circle cx="220" cy="16" r="14" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
            <text x="220" y="21" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">3</text>
            <rect x="204" y="36" width="32" height="6" rx="2" fill="#94A3B8" />
          </g>

          {/* Step Detail Card on Laptop Screen */}
          <rect x="52" y="132" width="256" height="74" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
          <rect x="62" y="142" width="130" height="9" rx="2" fill="#08093B" />
          <rect x="62" y="157" width="230" height="6" rx="2" fill="#94A3B8" />
          <rect x="62" y="167" width="200" height="6" rx="2" fill="#CBD5E1" />
          <rect x="62" y="181" width="70" height="16" rx="4" fill="#663CF6" />
          <rect x="140" y="181" width="60" height="16" rx="4" fill="#E2E8F0" />

          {/* Laptop Base & Keyboard Stand */}
          <path d="M 0 230 L 360 230 L 340 244 L 20 244 Z" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1" />
          {/* Trackpad Notch */}
          <rect x="150" y="232" width="60" height="5" rx="2.5" fill="#A5B4FC" />
        </g>

        {/* ================= GRADUATION MORTARBOARD CAP (Top Right of Screen) ================= */}
        <g transform="translate(370, 0)">
          {/* Diamond Cap */}
          <polygon points="50,15 95,35 50,55 5,35" fill="url(#mortarCapGuide)" stroke="#3730A3" strokeWidth="1.5" />
          {/* Cap Skull Base */}
          <path d="M 28 39 Q 50 56 72 39 L 68 56 Q 50 68 32 56 Z" fill="#312E81" />
          {/* Button & Golden Tassel */}
          <circle cx="50" cy="35" r="3.5" fill="#F59E0B" />
          <path d="M 50 35 Q 70 45 80 70" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="76" y="68" width="8" height="14" rx="2" fill="#D97706" />
        </g>
      </svg>
    </div>
  );
}

const STEP_THEMES = [
  {
    // Step 1: Violet / Indigo
    bg: "bg-gradient-to-br from-white/95 via-[#F5F2FF] to-[#EDE7FF]/80",
    border: "border-[#DDD6FE] hover:border-[#7C3AED]",
    stripe: "from-[#7C3AED] via-[#663CF6] to-[#8B5CF6]",
    badgeBg: "bg-gradient-to-br from-[#7C3AED] to-[#663CF6]",
    glow: "shadow-[0_8px_24px_rgba(124,58,237,0.08)] hover:shadow-[0_12px_28px_rgba(124,58,237,0.16)]",
  },
  {
    // Step 2: Sky / Cyan
    bg: "bg-gradient-to-br from-white/95 via-[#F0F9FF] to-[#E0F2FE]/80",
    border: "border-[#BAE6FD] hover:border-[#0284C7]",
    stripe: "from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]",
    badgeBg: "bg-gradient-to-br from-[#0284C7] to-[#0EA5E9]",
    glow: "shadow-[0_8px_24px_rgba(2,132,199,0.08)] hover:shadow-[0_12px_28px_rgba(2,132,199,0.16)]",
  },
  {
    // Step 3: Emerald / Teal
    bg: "bg-gradient-to-br from-white/95 via-[#F0FDF4] to-[#DCFCE7]/80",
    border: "border-[#BBF7D0] hover:border-[#16A34A]",
    stripe: "from-[#16A34A] via-[#10B981] to-[#34D399]",
    badgeBg: "bg-gradient-to-br from-[#16A34A] to-[#10B981]",
    glow: "shadow-[0_8px_24px_rgba(22,163,74,0.08)] hover:shadow-[0_12px_28px_rgba(22,163,74,0.16)]",
  },
  {
    // Step 4: Amber / Warm Gold
    bg: "bg-gradient-to-br from-white/95 via-[#FFFBEB] to-[#FEF3C7]/80",
    border: "border-[#FDE68A] hover:border-[#D97706]",
    stripe: "from-[#D97706] via-[#F59E0B] to-[#FBBF24]",
    badgeBg: "bg-gradient-to-br from-[#D97706] to-[#F59E0B]",
    glow: "shadow-[0_8px_24px_rgba(217,119,6,0.08)] hover:shadow-[0_12px_28px_rgba(217,119,6,0.16)]",
  },
  {
    // Step 5: Rose / Coral
    bg: "bg-gradient-to-br from-white/95 via-[#FFF1F2] to-[#FFE4E6]/80",
    border: "border-[#FECDD3] hover:border-[#E11D48]",
    stripe: "from-[#E11D48] via-[#F43F5E] to-[#FB7185]",
    badgeBg: "bg-gradient-to-br from-[#E11D48] to-[#F43F5E]",
    glow: "shadow-[0_8px_24px_rgba(225,29,72,0.08)] hover:shadow-[0_12px_28px_rgba(225,29,72,0.16)]",
  },
  {
    // Step 6: Purple / Fuchsia
    bg: "bg-gradient-to-br from-white/95 via-[#FAF5FF] to-[#F3E8FF]/80",
    border: "border-[#E9D5FF] hover:border-[#9333EA]",
    stripe: "from-[#9333EA] via-[#A855F7] to-[#C084FC]",
    badgeBg: "bg-gradient-to-br from-[#9333EA] to-[#A855F7]",
    glow: "shadow-[0_8px_24px_rgba(147,51,234,0.08)] hover:shadow-[0_12px_28px_rgba(147,51,234,0.16)]",
  },
];

export function GuideDetailPage({
  guide,
  relatedGuides,
  prevGuide,
  nextGuide,
}: GuideDetailPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [helpfulFeedback, setHelpfulFeedback] = useState<"yes" | "no" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoName, setDemoName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoSchool, setDemoSchool] = useState("");
  const [demoRole, setDemoRole] = useState("Principal");
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Auto-generate steps if guide does not have custom ones
  const steps = guide.steps && guide.steps.length > 0
    ? guide.steps
    : [
        {
          stepNumber: 1,
          title: `Access ${guide.category} Module`,
          description: `Navigate to your school admin dashboard, locate the navigation drawer on the left sidebar, and select the ${guide.category} section to begin configuration.`,
          tip: "Ensure your account has Admin or Academic Coordinator privileges before modifying institutional records.",
        },
        {
          stepNumber: 2,
          title: "Configure Master Settings & Parameters",
          description: `Review the default settings for ${guide.title.toLowerCase()}. Adjust validation rules, naming conventions, and notification defaults to match your school's operating procedures.`,
          tip: "You can download our sample spreadsheet template if you are preparing bulk records for import.",
        },
        {
          stepNumber: 3,
          title: "Input Data & Review Validations",
          description: "Enter required information into the intuitive form fields or upload your formatted spreadsheet. The system performs automatic syntax and duplicate checks.",
          tip: "Review error highlights immediately; rows with warnings will indicate missing compulsory fields in red.",
        },
        {
          stepNumber: 4,
          title: "Publish Changes & Notify Stakeholders",
          description: "Save and deploy the updated configuration. The cloud system securely updates all teacher, student, and parent apps in real time.",
          tip: "Trigger automated SMS or mobile app push notifications to inform relevant staff members of the change.",
        },
      ];

  const overviewText = guide.overview ||
    `This official step-by-step walkthrough guides school administrators, faculty, and operators through ${guide.title.toLowerCase()}. Follow our proven process to set up your workflow smoothly, prevent operational mistakes, and ensure compliance with institutional standards.`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved ? "Guide saved to your bookmarks!" : "Guide removed from bookmarks.");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Guide link copied to clipboard!");
    }
  };

  const toggleStepCompletion = (stepNum: number) => {
    setCompletedSteps((prev) => {
      const nextState = { ...prev, [stepNum]: !prev[stepNum] };
      const completedCount = Object.values(nextState).filter(Boolean).length;
      if (nextState[stepNum] && completedCount === steps.length) {
        showToast("🎉 Awesome! You completed all steps in this guide!");
      }
      return nextState;
    });
  };

  const handleFeedback = (type: "yes" | "no") => {
    setHelpfulFeedback(type);
    showToast(type === "yes" ? "Thanks for your feedback! Glad it helped." : "Thank you for the feedback. We'll improve this guide.");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactModalOpen(false);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      showToast("Support ticket created! We'll reply within 2 business hours.");
    }, 1500);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoEmail || !demoSchool) return;
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setDemoModalOpen(false);
      setDemoName("");
      setDemoEmail("");
      setDemoSchool("");
      showToast("Demo request confirmed! Our specialist will reach out shortly.");
    }, 1500);
  };

  const articleRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-scroll the right sidebar in sync with page/article scrolling without a visible scrollbar
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const article = articleRef.current;
    if (!sidebar || !article) return;

    let ticking = false;

    const syncSidebarScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const maxSidebarScroll = sidebar.scrollHeight - sidebar.clientHeight;
          if (maxSidebarScroll > 0) {
            const articleRect = article.getBoundingClientRect();
            const articleTop = articleRect.top + window.scrollY;
            const articleHeight = articleRect.height;
            const windowHeight = window.innerHeight;

            const startY = articleTop - 100;
            const endY = articleTop + articleHeight - windowHeight;
            const totalDistance = endY - startY;

            if (totalDistance > 0) {
              const currentY = window.scrollY - startY;
              const progress = Math.max(0, Math.min(1, currentY / totalDistance));
              sidebar.scrollTop = progress * maxSidebarScroll;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", syncSidebarScroll, { passive: true });
    window.addEventListener("resize", syncSidebarScroll, { passive: true });
    syncSidebarScroll();

    return () => {
      window.removeEventListener("scroll", syncSidebarScroll);
      window.removeEventListener("resize", syncSidebarScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      {/* Background Ambience */}
      <AtmosphericBackground />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#08093B] px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all duration-300">
          <Sparkles className="h-4 w-4 text-[#C4B5FD]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#E6E0F8] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/features"
              className="text-sm font-medium text-[#5A5E7A] transition-colors hover:text-[#08093B]"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[#5A5E7A] transition-colors hover:text-[#08093B]"
            >
              Pricing
            </Link>
            <Link
              href="/for-schools"
              className="text-sm font-medium text-[#5A5E7A] transition-colors hover:text-[#08093B]"
            >
              For Schools
            </Link>

            {/* Resources Dropdown with active purple pill indicator */}
            <ResourcesDropdown active={true} />
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl border border-[#D6DBF0] bg-white px-4 py-2 text-sm font-medium text-[#08093B] transition-colors hover:border-[#663CF6] hover:bg-[#F8F6FF]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#663CF6] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#663CF6]/20 transition-all hover:opacity-95"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DBF0] bg-white text-[#08093B] md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#E6E0F8] bg-white px-4 pt-2 pb-6 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5A5E7A] hover:bg-[#F8F6FF] hover:text-[#08093B]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5A5E7A] hover:bg-[#F8F6FF] hover:text-[#08093B]"
              >
                Pricing
              </Link>
              <Link
                href="/for-schools"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5A5E7A] hover:bg-[#F8F6FF] hover:text-[#08093B]"
              >
                For Schools
              </Link>

              {/* Mobile Resources Menu */}
              <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />

              <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#F0EDFF]">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl border border-[#D6DBF0] py-2.5 text-center text-sm font-medium text-[#08093B]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#7C3AED] py-2.5 text-center text-sm font-medium text-white"
                >
                  Get Started Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation - hidden on small devices as requested */}
        <nav className="mb-6 hidden sm:flex items-center gap-2 text-xs text-[#5A5E7A]">
          <Link href="/" className="flex items-center gap-1 hover:text-[#663CF6]">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#B0B4D0]" />
          <Link href="/guides" className="hover:text-[#663CF6]">
            Guides
          </Link>
          <ChevronRight className="h-3 w-3 text-[#B0B4D0]" />
          <Link
            href={`/guides?category=${guide.categoryId}`}
            className="hover:text-[#663CF6]"
          >
            {guide.category}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#B0B4D0]" />
          <span className="font-semibold text-[#08093B] truncate max-w-[200px] sm:max-w-none">
            {guide.title}
          </span>
        </nav>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Article Content (8 Cols on Desktop) */}
          <article ref={articleRef} className="lg:col-span-8">
            {/* Top Meta Header */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#663CF6]">
                <BookOpen className="h-3.5 w-3.5" />
                {guide.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5A5E7A] shadow-sm">
                <Clock className="h-3.5 w-3.5 text-[#8E92BC]" />
                {guide.readingTime}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5A5E7A] shadow-sm">
                <ListOrdered className="h-3.5 w-3.5 text-[#8E92BC]" />
                {steps.length} Steps
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl font-black tracking-tight text-[#08093B] sm:text-3xl md:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-3 text-base text-[#5A5E7A] sm:text-lg">
              {guide.description}
            </p>

            {/* Interactive Action Bar (Save & Share) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-[#E6E0F8] py-4">
              <div className="flex items-center gap-2 text-xs text-[#5A5E7A]">
                <Calendar className="h-4 w-4 text-[#8E92BC]" />
                <span>Last updated: Academic Session 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    isSaved
                      ? "border-[#663CF6] bg-[#663CF6] text-white"
                      : "border-[#D6DBF0] bg-white text-[#5A5E7A] hover:border-[#663CF6] hover:text-[#663CF6]"
                  }`}
                  aria-label="Save guide"
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-white" : ""}`} />
                  <span>{isSaved ? "Saved" : "Save Guide"}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5E7A] transition-colors hover:border-[#663CF6] hover:text-[#663CF6]"
                  aria-label="Share guide"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Hero Artwork Box */}
            <div className="my-8 overflow-hidden rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F2FE] shadow-[0_8px_24px_rgba(24,18,77,0.06)] backdrop-blur-sm">
              <GuideHeroIllustration />
            </div>

            {/* Overview Section */}
            <section className="mb-8 rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F3EEFF]/80 p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#08093B]">
                <Info className="h-5 w-5 text-[#663CF6]" />
                Guide Overview
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5A5E7A]">
                {overviewText}
              </p>

              {/* Prerequisites Card */}
              <div className="mt-6 rounded-xl border border-[#CDC2F7] bg-white/70 p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#663CF6]">
                  Prerequisites & Key Requirements
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-[#5A5E7A]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Active School Administrator account or authorized coordinator credentials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Updated browser (Google Chrome, Edge, Safari, or Firefox)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Institutional curriculum documents or master fee schedules ready</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Step-by-Step Walkthrough */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-[#08093B]">
                  Step-by-Step Walkthrough
                </h2>
                <span className="text-xs font-medium text-[#7C3AED]">
                  {Object.values(completedSteps).filter(Boolean).length} of {steps.length} completed
                </span>
              </div>

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isDone = !!completedSteps[step.stepNumber];
                  const theme = STEP_THEMES[idx % STEP_THEMES.length]!;
                  return (
                    <div
                      key={step.stepNumber}
                      id={`step-${step.stepNumber}`}
                      className={`group relative w-full max-w-[92%] sm:max-w-none mx-auto sm:mx-0 overflow-hidden rounded-2xl border p-4 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm ${
                        isDone
                          ? "border-emerald-300 bg-gradient-to-br from-white/98 via-[#F0FDF4] to-[#DCFCE7]/70 shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
                          : `${theme.bg} ${theme.border} ${theme.glow}`
                      }`}
                    >
                      {/* Top decorative gradient accent line */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          isDone ? "from-emerald-500 via-teal-400 to-emerald-400" : theme.stripe
                        }`}
                      />

                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Step Number Badge */}
                          <div
                            className={`flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                              isDone
                                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/30"
                                : `${theme.badgeBg} text-white`
                            }`}
                          >
                            {isDone ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : step.stepNumber}
                          </div>

                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#08093B] sm:text-lg">
                              {step.title}
                            </h3>
                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-[#5A5E7A]">
                              {step.description}
                            </p>

                            {/* Pro Tip Box if available */}
                            {step.tip && (
                              <div className="mt-2.5 sm:mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 sm:p-3 text-[11px] sm:text-xs text-amber-900">
                                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Pro Tip: </span>
                                  {step.tip}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Completion Button */}
                        <button
                          onClick={() => toggleStepCompletion(step.stepNumber)}
                          className={`flex-shrink-0 rounded-xl p-1.5 sm:p-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
                            isDone
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm"
                              : "border border-[#D6DBF0] bg-white/80 text-[#8E92BC] hover:border-[#663CF6] hover:text-[#663CF6] shadow-2xs"
                          }`}
                          aria-label={`Mark Step ${step.stepNumber} as ${isDone ? "incomplete" : "complete"}`}
                          title={`Mark Step ${step.stepNumber} as ${isDone ? "incomplete" : "complete"}`}
                        >
                          <CheckCircle2 className={`h-5 w-5 ${isDone ? "fill-emerald-600 text-white" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Helpful Feedback Box */}
            <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4EFFE] p-6 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm sm:flex-row">
              <p className="text-sm font-medium text-[#08093B]">
                Was this step-by-step guide helpful?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFeedback("yes")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                    helpfulFeedback === "yes"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-[#D6DBF0] bg-white text-[#5A5E7A] hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Yes, it helped!</span>
                </button>
                <button
                  onClick={() => handleFeedback("no")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                    helpfulFeedback === "no"
                      ? "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-[#D6DBF0] bg-white text-[#5A5E7A] hover:border-rose-400 hover:text-rose-700"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>Not quite</span>
                </button>
              </div>
            </div>

            {/* Prev / Next Navigation Controls */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prevGuide ? (
                <Link
                  href={`/guides/${prevGuide.slug}`}
                  className="group flex flex-col rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    Previous Guide
                  </span>
                  <span className="mt-2 text-sm font-bold text-[#08093B] group-hover:text-[#663CF6]">
                    {prevGuide.title}
                  </span>
                  <span className="mt-1 line-clamp-1 text-xs text-[#5A5E7A]">
                    {prevGuide.description}
                  </span>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextGuide ? (
                <Link
                  href={`/guides/${nextGuide.slug}`}
                  className="group flex flex-col text-right rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                    Next Guide
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="mt-2 text-sm font-bold text-[#08093B] group-hover:text-[#663CF6]">
                    {nextGuide.title}
                  </span>
                  <span className="mt-1 line-clamp-1 text-xs text-[#5A5E7A]">
                    {nextGuide.description}
                  </span>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>
          </article>

          {/* Sticky Sidebar (4 Cols on Desktop) */}
          <aside ref={sidebarRef} className="space-y-6 lg:col-span-4 lg:self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Table of Contents Card */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                In This Guide
              </h3>
              <ul className="mt-4 space-y-2 text-xs">
                <li>
                  <a
                    href="#step-1"
                    className="flex items-center gap-2 text-[#5A5E7A] hover:text-[#663CF6] transition-colors"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE7FF] text-[10px] font-bold text-[#663CF6]">
                      1
                    </span>
                    <span className="truncate">{steps[0]?.title}</span>
                  </a>
                </li>
                {steps.slice(1).map((s) => (
                  <li key={s.stepNumber}>
                    <a
                      href={`#step-${s.stepNumber}`}
                      className="flex items-center gap-2 text-[#5A5E7A] hover:text-[#663CF6] transition-colors"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE7FF] text-[10px] font-bold text-[#663CF6]">
                        {s.stepNumber}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Related Guides in this category */}
              {relatedGuides.length > 0 && (
                <div className="mt-6 border-t border-[#F0F2FA] pt-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                    Related Guides
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    {relatedGuides.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/guides/${rel.slug}`}
                        className="group block rounded-xl border border-[#F0F2FA] p-3 transition-colors hover:border-[#663CF6] hover:bg-[#F8F6FF]"
                      >
                        <h5 className="text-xs font-bold text-[#08093B] group-hover:text-[#663CF6]">
                          {rel.title}
                        </h5>
                        <p className="mt-1 text-[11px] text-[#5A5E7A] line-clamp-1">
                          {rel.readingTime} • {rel.category}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Still Need Help? Card */}
              <div className="mt-6 rounded-xl border border-[#EDE7FF] bg-gradient-to-br from-[#FAF8FF] to-[#F3EEFF] p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#663CF6] shadow-sm">
                  <Headphones className="h-5 w-5" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-[#08093B]">Need Custom Guidance?</h4>
                <p className="mt-1 text-[11px] text-[#5A5E7A]">
                  Our support specialists are available 24/7 to walk you through setup.
                </p>
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#7C3AED] py-2 text-xs font-bold text-white shadow-md shadow-[#663CF6]/20 transition-all hover:opacity-95"
                >
                  Contact Support <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Book a Demo Button */}
              <div className="mt-4">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full rounded-xl border border-[#D6DBF0] bg-white py-2 text-xs font-bold text-[#08093B] transition-colors hover:border-[#663CF6] hover:bg-[#F8F6FF]"
                >
                  Book a Personalized Demo
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom CTA Banner */}
      <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#4F27E8] p-8 text-white shadow-xl sm:p-10">
          <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                  Ready to Digitize Your School?
                </h3>
                <p className="mt-1 text-sm text-[#DDD6FE]">
                  Join 1,000+ leading schools modernizing admissions, attendance, fees, and exams.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                Book a Demo
              </button>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#663CF6] shadow-lg transition-all hover:bg-[#FAF8FF]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 shadow-2xl">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 text-[#8E92BC] hover:text-[#08093B]"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Headphones className="h-6 w-6 text-[#663CF6]" />
              <h3 className="text-lg font-bold text-[#08093B]">Contact School Support</h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5E7A]">
              Have questions regarding {guide.title}? Send our product specialists a note.
            </p>

            {contactSubmitted ? (
              <div className="my-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-pulse" />
                <h4 className="mt-3 text-base font-bold text-[#08093B]">Message Received!</h4>
                <p className="text-xs text-[#5A5E7A]">We will follow up shortly via email.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">School Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="principal@school.edu"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">Message or Question</label>
                  <textarea
                    required
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we assist with your setup?"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#7C3AED] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Book a Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 shadow-2xl">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 text-[#8E92BC] hover:text-[#08093B]"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-[#663CF6]" />
              <h3 className="text-lg font-bold text-[#08093B]">Book a 1-on-1 Platform Demo</h3>
            </div>
            <p className="mt-1 text-xs text-[#5A5E7A]">
              See how ScholoNix adapts to your institution&apos;s specific workflows.
            </p>

            {demoSubmitted ? (
              <div className="my-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-pulse" />
                <h4 className="mt-3 text-base font-bold text-[#08093B]">Demo Requested!</h4>
                <p className="text-xs text-[#5A5E7A]">Our education consultant will schedule a call.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="e.g. Mrs. Anjali Roy"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">Work Email</label>
                  <input
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="director@greenvalley.edu"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">School / Institution Name</label>
                  <input
                    type="text"
                    required
                    value={demoSchool}
                    onChange={(e) => setDemoSchool(e.target.value)}
                    placeholder="Green Valley International Academy"
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#08093B]">Your Role</label>
                  <select
                    value={demoRole}
                    onChange={(e) => setDemoRole(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Principal">Principal / Head of School</option>
                    <option value="Director">School Director / Trustee</option>
                    <option value="Administrator">School Administrator / Registrar</option>
                    <option value="IT">IT / Systems Manager</option>
                    <option value="Teacher">Senior Teacher / Department Head</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#7C3AED] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
                >
                  Schedule Demo
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E6E0F8] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-6">
            {/* Brand column */}
            <div className="space-y-4 sm:col-span-2 md:col-span-2">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="text-xs leading-relaxed text-[#5A5E7A]">
                A comprehensive, cloud-based school management platform to simplify and streamline your school operations.
              </p>
              <div className="flex items-center gap-3 text-[#5A5E7A]">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#663CF6]" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#663CF6]" aria-label="YouTube">
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#663CF6]" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#663CF6]" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">Product</h4>
              <ul className="space-y-2 text-xs text-[#5A5E7A]">
                <li><Link href="/features" className="hover:text-[#663CF6]">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[#663CF6]">Pricing</Link></li>
                <li><Link href="/for-schools" className="hover:text-[#663CF6]">For Schools</Link></li>
                <li><Link href="/integrations" className="hover:text-[#663CF6]">Integrations</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">Resources</h4>
              <ul className="space-y-2 text-xs text-[#5A5E7A]">
                <li><Link href="/blog" className="hover:text-[#663CF6]">Blog</Link></li>
                <li><Link href="/help" className="hover:text-[#663CF6]">Help Center</Link></li>
                <li><Link href="/faqs" className="hover:text-[#663CF6]">FAQs</Link></li>
                <li><Link href="/guides" className="hover:text-[#663CF6] font-semibold text-[#663CF6]">Guides</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">Company</h4>
              <ul className="space-y-2 text-xs text-[#5A5E7A]">
                <li><Link href="/about" className="hover:text-[#663CF6]">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#663CF6]">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-[#663CF6]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#663CF6]">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Stay Updated Newsletter */}
            <div className="space-y-3 sm:col-span-2 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">Stay Updated</h4>
              <p className="text-xs text-[#5A5E7A]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Thank you for subscribing!");
                }}
                className="relative flex items-center"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-[#D6DBF0] bg-white py-2 pr-10 pl-3 text-xs text-[#08093B] placeholder-[#8E92BC] outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="submit"
                  className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#663CF6] text-white hover:bg-[#4F27E8]"
                  aria-label="Submit newsletter"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between border-t border-[#F0F2FA] pt-6 text-xs text-[#5A5E7A] sm:flex-row">
            <p>&copy; 2026 ScholoNix. All rights reserved.</p>
            <p className="mt-2 flex items-center gap-1 sm:mt-0">
              <span className="text-rose-500">&hearts;</span> Made for Schools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
