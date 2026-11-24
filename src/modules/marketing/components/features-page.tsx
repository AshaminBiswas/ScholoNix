"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Calendar,
  Coins,
  UserCheck,
  MessageSquare,
  Clock,
  FileText,
  BarChart3,
  BookOpen,
  Bus,
  Laptop,
  Settings,
  Cloud,
  Smartphone,
  Building2,
  Sparkles,
  Check,
  ArrowRight,
  Menu,
  X,
  Send,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Button } from "@/components/ui/button";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";

interface FeatureModule {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  badge?: string;
  href: string;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
  topStripe: string;
  titleHover: string;
  blobColor: string;
}

const FEATURE_MODULES: FeatureModule[] = [
  {
    id: "admissions",
    title: "Admissions",
    desc: "Manage enquiries, applications, document verification and student admissions end-to-end.",
    icon: Users,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
    iconRing: "ring-[#DDD6FE]",
    href: "/register?step=1&feature=admissions",
    borderColor: "border-[#DDD6FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/90 to-[#EDE7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(102,60,246,0.06)]",
    hoverBorder: "hover:border-[#7C3AED]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(102,60,246,0.18)]",
    topStripe: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    titleHover: "group-hover:text-[#663CF6]",
    blobColor: "bg-[#8B5CF6]/15",
  },
  {
    id: "academics",
    title: "Academics",
    desc: "Set up classes, sections, subjects, syllabus, lesson plans and assessments.",
    icon: GraduationCap,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
    iconRing: "ring-[#BAE6FD]",
    href: "/register?step=1&feature=academics",
    borderColor: "border-[#BAE6FD]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0F8FF]/90 to-[#E0F2FE]/80",
    shadow: "shadow-[0_8px_24px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(2,132,199,0.18)]",
    topStripe: "from-[#0284C7] via-[#38BDF8] to-[#7DD3FC]",
    titleHover: "group-hover:text-[#0284C7]",
    blobColor: "bg-[#0284C7]/15",
  },
  {
    id: "attendance",
    title: "Attendance",
    desc: "Mark and track daily attendance for students and staff with detailed reports.",
    icon: Calendar,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
    iconRing: "ring-[#BBF7D0]",
    href: "/register?step=1&feature=attendance",
    borderColor: "border-[#BBF7D0]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDF4]/90 to-[#DCFCE7]/80",
    shadow: "shadow-[0_8px_24px_rgba(21,128,61,0.06)]",
    hoverBorder: "hover:border-[#15803D]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(21,128,61,0.18)]",
    topStripe: "from-[#15803D] via-[#22C55E] to-[#86EFAC]",
    titleHover: "group-hover:text-[#15803D]",
    blobColor: "bg-[#15803D]/15",
  },
  {
    id: "fees",
    title: "Fees & Payments",
    desc: "Collect fees online, manage fee structures, track dues and generate receipts.",
    icon: Coins,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
    iconRing: "ring-[#FDE68A]",
    href: "/register?step=1&feature=fees",
    borderColor: "border-[#FDE68A]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFFBEB]/90 to-[#FEF3C7]/80",
    shadow: "shadow-[0_8px_24px_rgba(217,119,6,0.06)]",
    hoverBorder: "hover:border-[#D97706]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(217,119,6,0.18)]",
    topStripe: "from-[#D97706] via-[#F59E0B] to-[#FCD34D]",
    titleHover: "group-hover:text-[#D97706]",
    blobColor: "bg-[#D97706]/15",
  },
  {
    id: "staff",
    title: "Staff Management",
    desc: "Maintain staff profiles, roles, leaves, attendance and responsibilities.",
    icon: UserCheck,
    iconBg: "bg-[#FFE4E6]",
    iconColor: "text-[#E11D48]",
    iconRing: "ring-[#FECDD3]",
    href: "/register?step=1&feature=staff",
    borderColor: "border-[#FECDD3]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFF1F2]/90 to-[#FFE4E6]/80",
    shadow: "shadow-[0_8px_24px_rgba(225,29,72,0.06)]",
    hoverBorder: "hover:border-[#E11D48]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(225,29,72,0.18)]",
    topStripe: "from-[#E11D48] via-[#F43F5E] to-[#FDA4AF]",
    titleHover: "group-hover:text-[#E11D48]",
    blobColor: "bg-[#E11D48]/15",
  },
  {
    id: "students",
    title: "Students",
    desc: "Manage complete student records, academic progress and documents.",
    icon: Users,
    iconBg: "bg-[#E0E7FF]",
    iconColor: "text-[#4338CA]",
    iconRing: "ring-[#C7D2FE]",
    href: "/register?step=1&feature=students",
    borderColor: "border-[#C7D2FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#EEF2FF]/90 to-[#E0E7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(67,56,202,0.06)]",
    hoverBorder: "hover:border-[#4338CA]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(67,56,202,0.18)]",
    topStripe: "from-[#4338CA] via-[#6366F1] to-[#A5B4FC]",
    titleHover: "group-hover:text-[#4338CA]",
    blobColor: "bg-[#4338CA]/15",
  },
  {
    id: "communication",
    title: "Parents & Communication",
    desc: "Keep parents informed with notices, circulars, alerts and real-time updates.",
    icon: MessageSquare,
    iconBg: "bg-[#CFFAFE]",
    iconColor: "text-[#0891B2]",
    iconRing: "ring-[#A5F3FC]",
    href: "/register?step=1&feature=communication",
    borderColor: "border-[#A5F3FC]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#ECFEFF]/90 to-[#CFFAFE]/80",
    shadow: "shadow-[0_8px_24px_rgba(8,145,178,0.06)]",
    hoverBorder: "hover:border-[#0891B2]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(8,145,178,0.18)]",
    topStripe: "from-[#0891B2] via-[#06B6D4] to-[#67E8F9]",
    titleHover: "group-hover:text-[#0891B2]",
    blobColor: "bg-[#0891B2]/15",
  },
  {
    id: "timetable",
    title: "Timetable",
    desc: "Create and manage class, teacher and exam timetables with ease.",
    icon: Clock,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#9333EA]",
    iconRing: "ring-[#E9D5FF]",
    href: "/register?step=1&feature=timetable",
    borderColor: "border-[#E9D5FF]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FAF5FF]/90 to-[#F3E8FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(147,51,234,0.06)]",
    hoverBorder: "hover:border-[#9333EA]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(147,51,234,0.18)]",
    topStripe: "from-[#9333EA] via-[#A855F7] to-[#D8B4FE]",
    titleHover: "group-hover:text-[#9333EA]",
    blobColor: "bg-[#9333EA]/15",
  },
  {
    id: "examinations",
    title: "Examinations",
    desc: "Conduct exams, enter marks and generate result cards and performance reports.",
    icon: FileText,
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
    iconRing: "ring-[#BFDBFE]",
    href: "/register?step=1&feature=examinations",
    borderColor: "border-[#BFDBFE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#EFF6FF]/90 to-[#DBEAFE]/80",
    shadow: "shadow-[0_8px_24px_rgba(37,99,235,0.06)]",
    hoverBorder: "hover:border-[#2563EB]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(37,99,235,0.18)]",
    topStripe: "from-[#2563EB] via-[#3B82F6] to-[#93C5FD]",
    titleHover: "group-hover:text-[#2563EB]",
    blobColor: "bg-[#2563EB]/15",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    desc: "Get insightful reports on academics, attendance, fees and overall school performance.",
    icon: BarChart3,
    iconBg: "bg-[#FAE8FF]",
    iconColor: "text-[#C026D3]",
    iconRing: "ring-[#F5D0FE]",
    href: "/register?step=1&feature=reports",
    borderColor: "border-[#F5D0FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FDF4FF]/90 to-[#FAE8FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(192,38,211,0.06)]",
    hoverBorder: "hover:border-[#C026D3]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(192,38,211,0.18)]",
    topStripe: "from-[#C026D3] via-[#D946EF] to-[#F0ABFC]",
    titleHover: "group-hover:text-[#C026D3]",
    blobColor: "bg-[#C026D3]/15",
  },
  {
    id: "library",
    title: "Library Management",
    desc: "Manage books, issue/return, track inventory and maintain digital records.",
    icon: BookOpen,
    iconBg: "bg-[#FCE7F3]",
    iconColor: "text-[#DB2777]",
    iconRing: "ring-[#FBCFE8]",
    href: "/register?step=1&feature=library",
    borderColor: "border-[#FBCFE8]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFF1F5]/90 to-[#FCE7F3]/80",
    shadow: "shadow-[0_8px_24px_rgba(219,39,119,0.06)]",
    hoverBorder: "hover:border-[#DB2777]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(219,39,119,0.18)]",
    topStripe: "from-[#DB2777] via-[#EC4899] to-[#F472B6]",
    titleHover: "group-hover:text-[#DB2777]",
    blobColor: "bg-[#DB2777]/15",
  },
  {
    id: "transport",
    title: "Transport (Optional)",
    desc: "Manage routes, vehicles, drivers and student transport with real-time tracking.",
    icon: Bus,
    iconBg: "bg-[#CCFBF1]",
    iconColor: "text-[#0D9488]",
    iconRing: "ring-[#99F6E4]",
    href: "/register?step=1&feature=transport",
    borderColor: "border-[#99F6E4]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDFA]/90 to-[#CCFBF1]/80",
    shadow: "shadow-[0_8px_24px_rgba(13,148,136,0.06)]",
    hoverBorder: "hover:border-[#0D9488]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(13,148,136,0.18)]",
    topStripe: "from-[#0D9488] via-[#14B8A6] to-[#5EEAD4]",
    titleHover: "group-hover:text-[#0D9488]",
    blobColor: "bg-[#0D9488]/15",
  },
];

interface CapabilityItem {
  title: string;
  desc: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
  topStripe: string;
  titleHover: string;
  blobColor: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    title: "Role-based Access",
    desc: "Granular permissions & secure login for admins, teachers, staff, and accountants.",
    tag: "Security & RBAC",
    icon: Users,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
    iconRing: "ring-[#DDD6FE]",
    borderColor: "border-[#DDD6FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/90 to-[#EDE7FF]/75",
    shadow: "shadow-[0_4px_20px_rgba(102,60,246,0.06)]",
    hoverBorder: "hover:border-[#7C3AED]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(102,60,246,0.16)]",
    topStripe: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    titleHover: "group-hover:text-[#663CF6]",
    blobColor: "bg-[#8B5CF6]/15",
  },
  {
    title: "Cloud & Secure",
    desc: "Enterprise 256-bit encryption, automated backups, and 99.9% uptime reliability.",
    tag: "Enterprise Cloud",
    icon: Cloud,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
    iconRing: "ring-[#BAE6FD]",
    borderColor: "border-[#BAE6FD]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0F8FF]/90 to-[#E0F2FE]/75",
    shadow: "shadow-[0_4px_20px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(2,132,199,0.16)]",
    topStripe: "from-[#0284C7] via-[#38BDF8] to-[#7DD3FC]",
    titleHover: "group-hover:text-[#0284C7]",
    blobColor: "bg-[#0284C7]/15",
  },
  {
    title: "Multi-Device Access",
    desc: "Seamless responsive experience on laptop, tablet, or smartphone on any browser.",
    tag: "Mobile & Tablet",
    icon: Smartphone,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#9333EA]",
    iconRing: "ring-[#E9D5FF]",
    borderColor: "border-[#E9D5FF]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FAF5FF]/90 to-[#F3E8FF]/75",
    shadow: "shadow-[0_4px_20px_rgba(147,51,234,0.06)]",
    hoverBorder: "hover:border-[#9333EA]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(147,51,234,0.16)]",
    topStripe: "from-[#9333EA] via-[#A855F7] to-[#D8B4FE]",
    titleHover: "group-hover:text-[#9333EA]",
    blobColor: "bg-[#9333EA]/15",
  },
  {
    title: "Scalable for Growth",
    desc: "Engineered to effortlessly scale from single-branch schools to large multi-campus trusts.",
    tag: "Auto-Scalable",
    icon: Building2,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
    iconRing: "ring-[#FDE68A]",
    borderColor: "border-[#FDE68A]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFFBEB]/90 to-[#FEF3C7]/75",
    shadow: "shadow-[0_4px_20px_rgba(217,119,6,0.06)]",
    hoverBorder: "hover:border-[#D97706]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(217,119,6,0.16)]",
    topStripe: "from-[#D97706] via-[#F59E0B] to-[#FCD34D]",
    titleHover: "group-hover:text-[#D97706]",
    blobColor: "bg-[#D97706]/15",
  },
];

export function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    schoolName: "",
    email: "",
    phone: "",
  });
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Scroll animations for All Features section & cards
  const [visibleFeatureCards, setVisibleFeatureCards] = useState<boolean[]>(
    Array(FEATURE_MODULES.length).fill(false)
  );
  const [sectionHeaderInView, setSectionHeaderInView] = useState(false);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleFeatureCards(Array(FEATURE_MODULES.length).fill(true));
      setSectionHeaderInView(true);
      return;
    }

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSectionHeaderInView(true);
        } else if (entry && entry.boundingClientRect.top > 0) {
          setSectionHeaderInView(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (sectionHeaderRef.current) {
      headerObserver.observe(sectionHeaderRef.current);
    }

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute("data-card-index");
          if (indexAttr === null) return;
          const idx = parseInt(indexAttr, 10);
          if (isNaN(idx)) return;

          if (entry.isIntersecting) {
            setVisibleFeatureCards((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          } else if (entry.boundingClientRect.top > 0) {
            setVisibleFeatureCards((prev) => {
              if (!prev[idx]) return prev;
              const next = [...prev];
              next[idx] = false;
              return next;
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    featureCardRefs.current.forEach((el) => {
      if (el) cardObserver.observe(el);
    });

    return () => {
      headerObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setDemoModalOpen(false);
      setDemoForm({ name: "", schoolName: "", email: "", phone: "" });
    }, 2500);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      {/* Background Ambience */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR (Features active pill)
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4D5072] md:flex">
            {/* Active Features Pill matching design */}
            <Link
              href="/features"
              className="rounded-full bg-[#8B5CF6] px-4 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED]"
            >
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6]">
              Pricing
            </Link>
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6]">
              For Schools
            </Link>
            <ResourcesDropdown />
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4F27E8] shadow-xs transition hover:border-[#4F27E8] hover:bg-[#F7F4FF]"
            >
              Sign In
            </Link>
            <Link
              href="/register?step=1"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-[#6D28D9] hover:to-[#3730A3]"
            >
              Register Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D6DBF0] bg-white text-[#08093B] shadow-sm transition hover:bg-[#F2EEFD] hover:text-[#663CF6] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D6DBF0] bg-white/98 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg md:hidden">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#1B1D45]">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] bg-[#EDE7FF] px-3 py-2 font-bold text-[#663CF6]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                Pricing
              </Link>
              <Link
                href="/for-schools"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                For Schools
              </Link>
              <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-[#DFE3F5] pt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white py-2.5 text-xs font-bold text-[#4F27E8] shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register?step=1"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md"
              >
                Register Now &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION: 2-COLUMN WITH REFINED DASHBOARD PREVIEW & CLEAN FLOW
          ========================================================================= */}
      <section className="relative pt-10 pb-10 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-16 overflow-hidden">
        {/* Subtle ambient backdrop light glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-[#EDE7FF]/40 via-[#E0F2FE]/30 to-transparent blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Content Column */}
            <div className="text-center lg:col-span-6 lg:text-left">
              {/* Refined Pill Badge with Live Pulse Indicator */}
              <div className="animate-hero-badge inline-flex items-center gap-2 rounded-full border border-[#D4C4FE]/80 bg-white/90 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#663CF6] shadow-[0_2px_12px_rgba(102,60,246,0.08)]">
                <span className="flex h-2 w-2 rounded-full bg-[#663CF6] animate-pulse" />
                <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>Platform Features</span>
              </div>

              {/* Main Headline with Animated Gradient Flow */}
              <h1 className="animate-hero-headline mt-5 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl md:text-5xl lg:text-[50px] lg:leading-[1.14]">
                Powerful Features for{" "}
                <span className="inline-block bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#0284C7] bg-clip-text text-transparent animate-gradient-flow">
                  Complete School Management
                </span>
              </h1>

              {/* Subheading */}
              <p className="animate-hero-subtitle mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#4D5072] sm:text-base md:text-lg">
                Everything you need to manage your school&apos;s admissions, academics, fees, communication and more — all in one easy-to-use platform.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link href="/register?step=1" className="w-full sm:w-auto">
                  <Button
                    variant="gradient"
                    className="animate-hero-btn-primary group relative overflow-hidden w-full sm:w-auto rounded-[14px] px-6 py-3.5 text-xs font-bold shadow-[0_4px_16px_rgba(102,60,246,0.28)] hover:shadow-[0_8px_24px_rgba(102,60,246,0.36)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <span>Register Now</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>

                <Button
                  id="book-demo-hero-btn"
                  type="button"
                  variant="secondary"
                  onClick={() => setDemoModalOpen(true)}
                  className="animate-hero-btn-secondary group w-full sm:w-auto rounded-[14px] border-[1.5px] border-[#8B5CF6]/80 bg-white/95 px-5 py-3.5 text-xs font-bold text-[#663CF6] shadow-xs hover:border-[#663CF6] hover:bg-[#F8F6FF] hover:shadow-[0_4px_16px_rgba(102,60,246,0.12)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calendar className="mr-2 h-4 w-4 text-[#663CF6] transition-transform duration-300 group-hover:rotate-12" />
                  <span>Book a Demo</span>
                </Button>
              </div>

              {/* 3 Core Value Checks as Clean Frosted Badges */}
              <div className="animate-hero-checklist mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 text-xs font-semibold text-[#08093B]">
                <div className="flex items-center gap-2 rounded-full border border-[#D6DBF0]/80 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>All-in-One Platform</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#D6DBF0]/80 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Easy to Use</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#D6DBF0]/80 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Secure &amp; Reliable</span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean & Smooth Dashboard UI Simulation */}
            <div className="relative mx-auto w-full max-w-lg lg:col-span-6 lg:max-w-none">
              {/* Ambient backlight glow */}
              <div className="pointer-events-none absolute -inset-3 rounded-[36px] bg-gradient-to-tr from-[#663CF6]/15 via-[#38BDF8]/15 to-[#A855F7]/10 blur-2xl" />

              {/* Floating Contextual Badge 1: Top-Right Live Session */}
              <div className="animate-float-chip-2 absolute -top-5 right-2 sm:right-6 z-20 flex items-center gap-2.5 rounded-[18px] border border-white/80 bg-white/95 px-3.5 py-2 shadow-[0_12px_28px_rgba(24,18,77,0.12)] backdrop-blur-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#DDD6FE]">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-[#08093B]">Live School Session</div>
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#15803D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    <span>Academic Year 2026-27</span>
                  </div>
                </div>
              </div>

              {/* Floating Contextual Badge 2: Bottom-Left Reconciled Collections */}
              <div className="animate-float-chip-1 absolute -bottom-5 left-2 sm:left-4 z-20 hidden xs:flex items-center gap-2.5 rounded-[18px] border border-white/80 bg-white/95 px-3.5 py-2 shadow-[0_12px_28px_rgba(24,18,77,0.12)] backdrop-blur-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#BBF7D0]">
                  <Coins className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-[#08093B]">Online Collections</div>
                  <div className="text-[9px] font-extrabold text-[#15803D]">98.6% Reconciliation</div>
                </div>
              </div>

              {/* Clean Glass Window Container */}
              <div className="animate-card-float relative z-10 overflow-hidden rounded-[26px] border border-white/80 bg-white/95 p-3.5 sm:p-5 shadow-[0_24px_56px_rgba(24,18,77,0.14)] backdrop-blur-xl ring-1 ring-[#D6DBF0]/70">
                {/* Browser/Window Header */}
                <div className="flex items-center justify-between border-b border-[#F0F2FA] pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56] border border-black/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E] border border-black/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F] border border-black/10" />
                    <span className="ml-2 text-[11px] font-extrabold text-[#08093B]">
                      ScholoNix
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[9px] font-bold text-[#15803D] border border-[#BBF7D0]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      Active Session
                    </span>
                  </div>
                </div>

                {/* Dashboard Body */}
                <div className="mt-3.5 grid grid-cols-12 gap-3.5">
                  {/* Miniature Sidebar */}
                  <div className="hidden sm:block col-span-3 space-y-1.5 border-r border-[#F0F2FA] pr-2.5 text-[10px] font-semibold text-[#4D5072]">
                    <div className="flex items-center gap-1.5 rounded-lg bg-[#663CF6] px-2.5 py-1.5 text-white shadow-xs font-bold">
                      <Laptop className="h-3 w-3" />
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F5F2FE] hover:text-[#663CF6] transition-colors">
                      <Users className="h-3 w-3" />
                      <span>Admissions</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F5F2FE] hover:text-[#663CF6] transition-colors">
                      <GraduationCap className="h-3 w-3" />
                      <span>Academics</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F5F2FE] hover:text-[#663CF6] transition-colors">
                      <Calendar className="h-3 w-3" />
                      <span>Attendance</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F5F2FE] hover:text-[#663CF6] transition-colors">
                      <Coins className="h-3 w-3" />
                      <span>Fees</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F5F2FE] hover:text-[#663CF6] transition-colors">
                      <BarChart3 className="h-3 w-3" />
                      <span>Reports</span>
                    </div>
                  </div>

                  {/* Main Miniature Content */}
                  <div className="col-span-12 sm:col-span-9 space-y-3">
                    {/* 4 KPI Cards Row */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {/* Students */}
                      <div className="rounded-xl border border-[#EDE7FF] bg-gradient-to-br from-[#FAF8FF] to-[#EDE7FF]/60 p-2 text-center transition-transform hover:scale-[1.03]">
                        <span className="text-[9px] font-bold text-[#4D5072]">Students</span>
                        <div className="text-sm font-extrabold text-[#663CF6]">1,248</div>
                      </div>
                      {/* Staff */}
                      <div className="rounded-xl border border-[#E0F2FE] bg-gradient-to-br from-[#F5FAFF] to-[#E0F2FE]/60 p-2 text-center transition-transform hover:scale-[1.03]">
                        <span className="text-[9px] font-bold text-[#4D5072]">Staff</span>
                        <div className="text-sm font-extrabold text-[#0284C7]">86</div>
                      </div>
                      {/* Pending */}
                      <div className="rounded-xl border border-[#FFE4E6] bg-gradient-to-br from-[#FFF8F8] to-[#FFE4E6]/60 p-2 text-center transition-transform hover:scale-[1.03]">
                        <span className="text-[9px] font-bold text-[#4D5072]">Pending</span>
                        <div className="text-sm font-extrabold text-[#E11D48]">37</div>
                      </div>
                      {/* Fee Dues */}
                      <div className="rounded-xl border border-[#FEF3C7] bg-gradient-to-br from-[#FFFDF5] to-[#FEF3C7]/60 p-2 text-center transition-transform hover:scale-[1.03]">
                        <span className="text-[9px] font-bold text-[#4D5072]">Fee Dues</span>
                        <div className="text-xs sm:text-sm font-extrabold text-[#D97706]">₹5.48L</div>
                      </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-12 gap-2.5 items-center rounded-xl border border-[#F0F2FA] bg-[#FAFBFD] p-3 shadow-2xs">
                      {/* Donut Attendance Chart */}
                      <div className="col-span-4 flex flex-col items-center justify-center text-center">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#15803D] bg-white shadow-xs ring-4 ring-[#DCFCE7]/70">
                          <span className="text-[10px] font-black text-[#08093B]">96.4%</span>
                        </div>
                        <span className="mt-1 text-[9px] font-bold text-[#15803D]">Present</span>
                      </div>

                      {/* Bar Trend Simulation */}
                      <div className="col-span-8 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-[#4D5072]">
                            Monthly Academic Performance
                          </span>
                          <span className="text-[8px] font-bold text-[#663CF6]">+14.2%</span>
                        </div>
                        <div className="flex items-end justify-between gap-1 h-12 pt-2">
                          {[42, 65, 55, 82, 70, 92, 85, 96].map((h, i) => (
                            <div
                              key={i}
                              className="w-full rounded-t-sm bg-gradient-to-t from-[#663CF6] to-[#A78BFA] transition-all duration-300 hover:from-[#4F27E8] hover:to-[#663CF6]"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. "EVERYTHING YOUR SCHOOL NEEDS" (12 FEATURE CARDS)
          ========================================================================= */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div
            ref={sectionHeaderRef}
            className={`text-center transition-all duration-700 ease-out ${
              sectionHeaderInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <div className="inline-flex items-center rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-4 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
              <span>All Features</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl">
              Everything Your School Needs
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-[#4D5072] sm:text-sm">
              A comprehensive set of modules to run your school efficiently and grow effortlessly.
            </p>
          </div>

          {/* 12 Cards Grid (1 col on mobile, 2 on tablet, 4 on desktop) */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_MODULES.map((module, index) => {
              const IconComp = module.icon;
              const isVisible = visibleFeatureCards[index];
              const staggerDelay = (index % 4) * 80 + Math.floor(index / 4) * 40;

              return (
                <div
                  key={module.id}
                  ref={(el) => {
                    featureCardRefs.current[index] = el;
                  }}
                  data-card-index={index}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border ${module.borderColor} ${module.bgGradient} backdrop-blur-md p-5 ${module.shadow} ${module.hoverBorder} ${module.hoverShadow} transition-all duration-700 ease-out hover:-translate-y-2 hover:scale-[1.02] cursor-pointer will-change-transform ${
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-12 scale-[0.94]"
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    transitionDelay: `${staggerDelay}ms`,
                  }}
                >
                  {/* Top Accent Gradient Stripe that reveals on hover */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${module.topStripe} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  {/* Ambient subtle glow blob in card corner */}
                  <div
                    className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full ${module.blobColor} blur-2xl transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-125`}
                  />

                  {/* Shimmer sweep effect on hover */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

                  <div className="relative z-10">
                    {/* Icon Circle with micro-interaction */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${module.iconBg} ${module.iconColor} ring-1 ${module.iconRing} shadow-xs transition-all duration-500 group-hover:scale-110 ${
                          index % 2 === 0 ? "group-hover:rotate-6" : "group-hover:-rotate-6"
                        } ${
                          isVisible
                            ? "scale-100 rotate-0 opacity-100"
                            : "scale-75 -rotate-6 opacity-70"
                        }`}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className={`mt-3 text-[17px] font-extrabold tracking-tight text-[#08093B] ${module.titleHover} transition-colors`}
                    >
                      {module.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#4D5072]">
                      {module.desc}
                    </p>
                  </div>

                  {/* Bottom Action Link - compact, without unnecessary padding gap */}
                  <div className="relative z-10 mt-3.5 pt-2.5 border-t border-black/[0.06]">
                    <Link
                      href={module.href}
                      className="inline-flex items-center text-xs font-bold text-[#663CF6] group-hover:text-[#4F27E8] transition-colors focus:outline-hidden"
                    >
                      <span>Explore Module</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "MORE POWERFUL CAPABILITIES" SECTION
          ========================================================================= */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-[#D6DBF0] bg-gradient-to-br from-white/95 via-[#F8F9FE]/90 to-[#F0EBFE]/60 p-6 sm:p-8 lg:p-10 shadow-[0_16px_40px_rgba(24,18,77,0.08)] backdrop-blur-md">
            {/* Ambient decorative glow behind container */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#663CF6]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#0284C7]/10 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left Column: Vector Laptop Graphic */}
              <div className="flex items-center justify-center lg:col-span-4">
                <div className="relative w-full max-w-xs transition-transform duration-500 hover:scale-105">
                  {/* Laptop Base & Screen Graphic */}
                  <div className="relative mx-auto h-40 w-64 rounded-t-xl border-4 border-[#08093B] bg-slate-900 p-2 shadow-2xl">
                    <div className="relative h-full w-full overflow-hidden rounded bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-3">
                      {/* Simulated Checklist & Cog */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-[#15803D]" strokeWidth={3} />
                          <div className="h-1.5 w-20 rounded bg-slate-300" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-[#15803D]" strokeWidth={3} />
                          <div className="h-1.5 w-24 rounded bg-slate-300" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-[#15803D]" strokeWidth={3} />
                          <div className="h-1.5 w-16 rounded bg-slate-300" />
                        </div>
                      </div>

                      {/* Cog Floating Badge */}
                      <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#663CF6] text-white shadow-md animate-spin-slow">
                        <Settings className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  {/* Laptop Base Stand */}
                  <div className="mx-auto h-3 w-72 rounded-b-xl bg-[#08093B] shadow-md" />
                </div>
              </div>

              {/* Right Column: More Capabilities 4-Grid */}
              <div className="lg:col-span-8">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Enterprise Infrastructure</span>
                  </div>
                  <h2 className="mt-2.5 text-xl font-extrabold tracking-tight text-[#08093B] sm:text-2xl">
                    More Powerful Capabilities
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#4D5072]">
                    Engineered with enterprise security, cross-device agility, and effortless scalability.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {CAPABILITIES.map((cap, idx) => {
                    const CapIcon = cap.icon;
                    return (
                      <div
                        key={idx}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border ${cap.borderColor} ${cap.bgGradient} p-5 ${cap.shadow} ${cap.hoverBorder} ${cap.hoverShadow} backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer`}
                      >
                        {/* Top Accent Stripe on hover */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cap.topStripe} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                        />

                        {/* Ambient corner glow */}
                        <div
                          className={`pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full ${cap.blobColor} blur-xl transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-125`}
                        />

                        {/* Shimmer sweep */}
                        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

                        <div className="relative z-10">
                          {/* Top Row: Icon + Mini Tag */}
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${cap.iconBg} ${cap.iconColor} ring-1 ${cap.iconRing} shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                            >
                              <CapIcon className="h-5 w-5" />
                            </div>
                            <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[10px] font-bold text-[#4D5072] border border-black/[0.04] shadow-2xs backdrop-blur-xs">
                              {cap.tag}
                            </span>
                          </div>

                          {/* Title */}
                          <h3
                            className={`mt-4 text-sm font-extrabold text-[#08093B] ${cap.titleHover} transition-colors`}
                          >
                            {cap.title}
                          </h3>

                          {/* Description */}
                          <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#4D5072]">
                            {cap.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BOTTOM CTA BANNER: READY TO EXPLORE ALL FEATURES?
          ========================================================================= */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[20px] bg-gradient-to-r from-[#663CF6] via-[#5B30E8] to-[#4F27E8] p-7 sm:p-10 shadow-xl shadow-[#663CF6]/20">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row text-center lg:text-left">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Ready to Explore All Features?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/90">
                  See how ScholoNix can simplify your school operations with a personalized demo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  id="book-demo-banner-btn"
                  type="button"
                  variant="secondary"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto rounded-[12px] bg-white px-5 py-3.5 text-xs font-bold text-[#663CF6] shadow-md hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  <Calendar className="mr-2 h-4 w-4 text-[#663CF6]" />
                  Book a Demo
                </Button>

                <Link href="/register?step=1" className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto rounded-[12px] border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-bold text-white shadow-md backdrop-blur-sm hover:bg-white/20 transition active:scale-[0.98]"
                  >
                    Register Now &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOOTER
          ========================================================================= */}
      <footer className="border-t border-[#D6DBF0] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12">
            {/* Brand and Description (4 cols on desktop) */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs font-medium leading-relaxed text-[#4D5072]">
                A comprehensive, cloud-based school management platform to simplify and
                streamline your school operations.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#linkedin"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#youtube"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Product
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="/features" className="text-[#663CF6]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#663CF6]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/for-schools" className="hover:text-[#663CF6]">
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="/#integrations" className="hover:text-[#663CF6]">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Resources
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="/#blog" className="hover:text-[#663CF6]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-[#663CF6]">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="hover:text-[#663CF6]">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="hover:text-[#663CF6]">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Company
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="/#about" className="hover:text-[#663CF6]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#663CF6]">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="hover:text-[#663CF6]">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="/#privacy" className="hover:text-[#663CF6]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/#terms" className="hover:text-[#663CF6]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Stay Updated
              </h4>
              <p className="text-xs font-medium text-[#4D5072]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-1.5 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] shadow-xs placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                />
                <button
                  type="submit"
                  aria-label="Submit newsletter"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#663CF6] text-white shadow-sm transition hover:bg-[#4F27E8]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              {subscribed && (
                <p className="text-[10px] font-bold text-[#15803D]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DFE3F5] pt-6 text-xs text-[#4D5072] sm:flex-row">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} ScholoNix. All rights
              reserved.
            </p>
            <p className="flex items-center gap-1 font-semibold text-[#08093B]">
              <span className="text-red-500">❤️</span> Made for Schools
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          7. INTERACTIVE "BOOK A DEMO" MODAL DIALOG
          ========================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#4D5072] hover:bg-slate-200"
              aria-label="Close demo modal"
            >
              <X className="h-4 w-4" />
            </button>

            {demoSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#08093B]">Demo Requested!</h3>
                <p className="text-xs text-[#4D5072]">
                  Thank you! Our school operations specialist will contact you within 2 business hours to schedule your personalized walkthrough.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#08093B]">Book a Free Demo</h3>
                    <p className="text-[11px] text-[#4D5072]">Experience the full platform with a live guide.</p>
                  </div>
                </div>

                <form onSubmit={handleDemoSubmit} className="mt-5 space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-[#08093B]">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Principal Sharma"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      className="mt-1 w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-[#08093B] focus:border-[#663CF6] focus:outline-none focus:ring-1 focus:ring-[#663CF6]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#08093B]">School / Institution Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Delhi Public Academy"
                      value={demoForm.schoolName}
                      onChange={(e) => setDemoForm({ ...demoForm, schoolName: e.target.value })}
                      className="mt-1 w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-[#08093B] focus:border-[#663CF6] focus:outline-none focus:ring-1 focus:ring-[#663CF6]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#08093B]">Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="principal@school.edu.in"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="mt-1 w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-[#08093B] focus:border-[#663CF6] focus:outline-none focus:ring-1 focus:ring-[#663CF6]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#08093B]">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      className="mt-1 w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-[#08093B] focus:border-[#663CF6] focus:outline-none focus:ring-1 focus:ring-[#663CF6]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full rounded-[12px] py-2.5 font-bold shadow-md"
                    >
                      Schedule My Demo &rarr;
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
