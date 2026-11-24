"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Search,
  ArrowRight,
  BookOpen,
  Headphones,
  Info,
  CheckCircle2,
  X,
  Send,
  Menu,
  Zap,
  Cloud,
  Users,
  BarChart3,
  Layers,
  Tag,
  Rocket,
  ShieldCheck,
  Check,
  Play,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  FAQ_CATEGORIES,
  type DetailedFAQArticle,
  type FAQItem,
} from "../data/faqs-data";

// 3D Dashboard Illustration matching mockup image
function FAQDashboardArtwork() {
  return (
    <div className="relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[#D5D3F8] bg-gradient-to-b from-[#F2F4FF] via-[#EEF0FE] to-[#E9EAFF] p-4 sm:p-8">
      {/* Soft ambient background glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/30 to-[#93C5FD]/30 blur-2xl filter" />

      <svg
        viewBox="0 0 620 340"
        className="relative z-10 h-auto w-full max-w-[560px] drop-shadow-xl transition-transform duration-700 hover:scale-[1.01]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laptopFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="screenBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="plantLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* ================= LEFT ACCENT: Potted Plant on Stacked Books ================= */}
        <g transform="translate(30, 110)">
          {/* Leaves of the plant */}
          <path d="M 50 80 C 20 40, 45 10, 60 25 C 75 40, 65 70, 50 80 Z" fill="url(#plantLeaf)" />
          <path d="M 60 80 C 80 35, 110 40, 100 60 C 90 80, 75 80, 60 80 Z" fill="url(#plantLeaf)" opacity="0.85" />
          <path d="M 60 80 C 50 30, 70 0, 80 20 C 90 40, 75 70, 60 80 Z" fill="#10B981" />
          <path d="M 45 80 C 30 60, 35 45, 45 55 C 55 65, 50 75, 45 80 Z" fill="#059669" opacity="0.9" />

          {/* Plant Pot */}
          <path d="M 42 80 L 78 80 L 72 110 L 48 110 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="40" y="77" width="40" height="5" rx="2" fill="#E2E8F0" />

          {/* Stack of Books */}
          {/* Bottom Book (Cyan) */}
          <rect x="15" y="130" width="95" height="18" rx="3" fill="#38BDF8" filter="url(#cardShadow)" />
          <rect x="17" y="133" width="90" height="3" rx="1.5" fill="#BAE6FD" />
          {/* Middle Book (Purple) */}
          <rect x="25" y="116" width="85" height="16" rx="3" fill="#8B5CF6" />
          <rect x="27" y="119" width="80" height="3" rx="1.5" fill="#DDD6FE" />
        </g>

        {/* ================= RIGHT ACCENT: Pen & Pencil Holder ================= */}
        <g transform="translate(510, 130)">
          {/* Colorful pencils sticking out */}
          {/* Yellow Pencil */}
          <line x1="25" y1="90" x2="15" y2="40" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          {/* Purple Pen */}
          <line x1="35" y1="90" x2="35" y2="35" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" />
          {/* Pink Pencil */}
          <line x1="45" y1="90" x2="55" y2="38" stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" />
          {/* Blue Pen */}
          <line x1="40" y1="90" x2="48" y2="48" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />

          {/* Cup / Pen Holder */}
          <rect x="15" y="80" width="50" height="60" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="20" y="85" width="40" height="50" rx="4" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* ================= CENTER: Laptop with Dashboard ================= */}
        <g transform="translate(130, 20)">
          {/* Laptop Outer Bezel */}
          <rect x="20" y="15" width="320" height="220" rx="12" fill="url(#laptopFrame)" filter="url(#cardShadow)" />

          {/* Screen Inner */}
          <rect x="30" y="25" width="300" height="200" rx="6" fill="url(#screenBg)" />

          {/* Dashboard Header Bar */}
          <rect x="30" y="25" width="300" height="24" rx="4" fill="#F8FAFC" />
          <line x1="30" y1="49" x2="330" y2="49" stroke="#E2E8F0" strokeWidth="1" />
          <text x="45" y="41" fill="#08093B" fontSize="9" fontWeight="800" fontFamily="system-ui">
            ScholoNix
          </text>
          {/* Mini Header Avatar / Bell */}
          <circle cx="312" cy="37" r="4" fill="#CBD5E1" />
          <circle cx="298" cy="37" r="4" fill="#CBD5E1" />

          {/* Dashboard Content Container */}
          <g transform="translate(42, 58)">
            {/* Stat Card 1: Students */}
            <rect x="0" y="0" width="55" height="34" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="6" y="11" fill="#64748B" fontSize="6.5" fontWeight="600">Students</text>
            <text x="6" y="25" fill="#08093B" fontSize="10" fontWeight="800">1,248</text>

            {/* Stat Card 2: Teachers */}
            <rect x="62" y="0" width="55" height="34" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="68" y="11" fill="#64748B" fontSize="6.5" fontWeight="600">Teachers</text>
            <text x="68" y="25" fill="#08093B" fontSize="10" fontWeight="800">82</text>

            {/* Stat Card 3: Classes */}
            <rect x="124" y="0" width="55" height="34" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="130" y="11" fill="#64748B" fontSize="6.5" fontWeight="600">Classes</text>
            <text x="130" y="25" fill="#08093B" fontSize="10" fontWeight="800">36</text>

            {/* Stat Card 4: Fees Collected */}
            <rect x="186" y="0" width="88" height="34" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="192" y="11" fill="#64748B" fontSize="6.5" fontWeight="600">Fees Collected</text>
            <text x="192" y="25" fill="#08093B" fontSize="10" fontWeight="800">₹24,56,000</text>

            {/* Charts Section */}
            {/* Bar Chart Container */}
            <rect x="0" y="44" width="170" height="95" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="10" y="58" fill="#08093B" fontSize="7.5" fontWeight="700">Attendance Trends</text>

            {/* Bar Chart Bars */}
            <rect x="16" y="98" width="10" height="30" rx="2" fill="url(#barGrad)" />
            <rect x="32" y="85" width="10" height="43" rx="2" fill="url(#barGrad)" />
            <rect x="48" y="92" width="10" height="36" rx="2" fill="url(#barGrad)" />
            <rect x="64" y="75" width="10" height="53" rx="2" fill="url(#barGrad)" />
            <rect x="80" y="70" width="10" height="58" rx="2" fill="url(#barGrad)" />
            <rect x="96" y="80" width="10" height="48" rx="2" fill="url(#barGrad)" />
            <rect x="112" y="66" width="10" height="62" rx="2" fill="url(#barGrad)" />
            <rect x="128" y="74" width="10" height="54" rx="2" fill="url(#barGrad)" />
            <rect x="144" y="68" width="10" height="60" rx="2" fill="url(#barGrad)" />

            {/* Donut Chart Container */}
            <rect x="180" y="44" width="94" height="95" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <text x="188" y="58" fill="#08093B" fontSize="7.5" fontWeight="700">Fee Distribution</text>

            {/* Donut Chart Ring */}
            <g transform="translate(227, 95)">
              <circle cx="0" cy="0" r="26" stroke="#EDE9FE" strokeWidth="10" fill="none" />
              <circle
                cx="0"
                cy="0"
                r="26"
                stroke="#663CF6"
                strokeWidth="10"
                fill="none"
                strokeDasharray="120 180"
                strokeDashoffset="20"
              />
              <circle
                cx="0"
                cy="0"
                r="26"
                stroke="#38BDF8"
                strokeWidth="10"
                fill="none"
                strokeDasharray="40 180"
                strokeDashoffset="-100"
              />
            </g>
          </g>

          {/* Laptop Base */}
          <path
            d="M -10 235 L 370 235 L 390 250 C 390 254, 385 256, 375 256 L -15 256 C -25 256, -30 254, -30 250 Z"
            fill="#CBD5E1"
          />
          <path d="M -3 236 L 363 236 L 378 248 L -18 248 Z" fill="#E2E8F0" />
          {/* Laptop Trackpad */}
          <rect x="150" y="240" width="60" height="8" rx="2" fill="#94A3B8" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

// Icon helper for benefits
function BenefitIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  switch (type) {
    case "zap":
      return <Zap className={className} />;
    case "cloud":
      return <Cloud className={className} />;
    case "users":
      return <Users className={className} />;
    case "chart":
      return <BarChart3 className={className} />;
    default:
      return <CheckCircle2 className={className} />;
  }
}

// Icon helper for sidebar categories
function CategoryIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  switch (type) {
    case "info":
      return <Info className={className} />;
    case "features":
      return <Layers className={className} />;
    case "pricing":
      return <Tag className={className} />;
    case "onboarding":
      return <Rocket className={className} />;
    case "security":
      return <ShieldCheck className={className} />;
    case "support":
      return <Headphones className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

interface FaqDetailPageProps {
  article: DetailedFAQArticle;
}

export function FaqDetailPage({ article }: FaqDetailPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpfulFeedback, setHelpfulFeedback] = useState<"yes" | "no" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accordion for related FAQs
  const [openRelated, setOpenRelated] = useState<Record<string, boolean>>({});

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  // Demo form state
  const [demoName, setDemoName] = useState("");
  const [demoSchool, setDemoSchool] = useState("");
  const [demoEmail, setDemoEmail] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      showToast("Article link copied to clipboard!");
    }
  };

  const handleFeedback = (val: "yes" | "no") => {
    setHelpfulFeedback(val);
    showToast(val === "yes" ? "Thanks for your feedback!" : "Thank you. We will improve this answer!");
  };

  const toggleRelated = (id: string) => {
    setOpenRelated((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      <AtmosphericBackground />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] flex animate-fade-in items-center gap-2 rounded-xl border border-[#D4C4FE] bg-white px-4 py-3 text-xs font-bold text-[#08093B] shadow-2xl shadow-[#663CF6]/20">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#7C829E] hover:text-[#08093B]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          1. HEADER / NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#E6EAF5]/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 text-xs font-bold text-[#4D5072] md:flex">
            <Link href="/features" className="transition-colors hover:text-[#663CF6]">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6]">
              Pricing
            </Link>
            <Link href="/#for-schools" className="transition-colors hover:text-[#663CF6]">
              For Schools
            </Link>
            <ResourcesDropdown active={true} />
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl border border-[#D6DBF0] bg-white px-4 py-2 text-xs font-bold text-[#08093B] shadow-sm transition-all hover:border-[#663CF6]/60 hover:text-[#663CF6]"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#663CF6]/25 transition-all hover:opacity-95"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DBF0] bg-white text-[#08093B] md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#E6EAF5] bg-white px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3 text-sm font-bold text-[#4D5072]">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#663CF6]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#663CF6]"
              >
                Pricing
              </Link>
              <Link
                href="/#for-schools"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 transition-colors hover:text-[#663CF6]"
              >
                For Schools
              </Link>

              <div className="border-t border-[#F0F2FA] pt-2">
                <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
              </div>

              <div className="mt-2 flex flex-col gap-2 border-t border-[#F0F2FA] pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl border border-[#D6DBF0] py-2.5 text-center text-xs font-bold text-[#08093B]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] py-2.5 text-center text-xs font-bold text-white shadow-md"
                >
                  Get Started Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =========================================================================
            2. BREADCRUMBS BAR
            ========================================================================= */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#5A5E7A] pb-6">
          <Link href="/" className="hover:text-[#663CF6] flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A5BD]" />
          <Link href="/faqs" className="hover:text-[#663CF6]">
            FAQs
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A5BD]" />
          <Link href={`/faqs#${article.categoryId}`} className="hover:text-[#663CF6]">
            {article.category}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A5BD]" />
          <span className="text-[#08093B] font-bold truncate max-w-[280px] sm:max-w-md">
            {article.question}
          </span>
        </nav>

        {/* =========================================================================
            3. TWO-COLUMN LAYOUT: Main FAQ Detail & Right Sidebar
            ========================================================================= */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ==========================================
              LEFT MAIN COLUMN (8 Cols)
              ========================================== */}
          <article className="space-y-8 lg:col-span-8">
            {/* Header: Badge, Question Title, Subtitle & Metadata */}
            <header className="space-y-3">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6]">
                <span>{article.category}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl lg:text-[38px] lg:leading-[1.2]">
                {article.question}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base font-medium text-[#5A5E7A] leading-relaxed">
                {article.subtitle}
              </p>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EAF5] pb-5 pt-2 text-xs font-medium text-[#7C829E]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#663CF6]" />
                    <span>Last updated: {article.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#663CF6]" />
                    <span>Reading time: {article.readingTime}</span>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] bg-white px-3.5 py-1.5 text-xs font-bold text-[#08093B] shadow-xs hover:border-[#663CF6]/60 hover:text-[#663CF6] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </header>

            {/* Overview Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-[#08093B]">Overview</h2>
              <p className="text-xs sm:text-sm font-normal leading-relaxed text-[#5A5E7A]">
                {article.overview}
              </p>

              {/* Center Dashboard Illustration Artwork */}
              <div className="pt-2">
                <FAQDashboardArtwork />
              </div>
            </section>

            {/* How It Works Section */}
            <section className="space-y-3 pt-2">
              <h2 className="text-lg font-extrabold text-[#08093B]">How It Works</h2>
              <p className="text-xs sm:text-sm font-normal leading-relaxed text-[#5A5E7A]">
                {article.howItWorks}
              </p>
            </section>

            {/* Key Benefits Grid (4 Cards) */}
            <section className="space-y-4 pt-2">
              <h2 className="text-lg font-extrabold text-[#08093B]">Key Benefits</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {article.keyBenefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-4 text-center shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60">
                      <BenefitIcon type={benefit.iconType} className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-xs font-bold text-[#08093B] leading-snug">
                      {benefit.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium text-[#7C829E] leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Getting Started in 3 Steps Flow */}
            <section className="space-y-4 pt-2">
              <h2 className="text-lg font-extrabold text-[#08093B]">
                Getting Started in 3 Steps
              </h2>
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F3EEFF]/80 p-5 sm:flex-row shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm">
                {article.steps.map((step, idx) => (
                  <React.Fragment key={step.stepNumber}>
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-extrabold text-[#663CF6]">
                        {step.stepNumber}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#08093B]">
                          {step.title}
                        </h4>
                        <p className="mt-0.5 text-[11px] font-medium text-[#7C829E] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {idx < article.steps.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#C4B5FD] sm:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* Info Callout Box */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#CDC2F7] bg-gradient-to-r from-white/95 via-[#FAF8FF] to-[#EDE7FF]/70 p-4 text-xs font-medium text-[#5A5E7A] leading-relaxed shadow-xs backdrop-blur-sm">
              <Info className="h-4 w-4 shrink-0 text-[#663CF6] mt-0.5" />
              <span>{article.callout}</span>
            </div>

            {/* Helpfulness Feedback Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4EFFE] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm">
              <span className="text-xs font-bold text-[#08093B]">
                Was this answer helpful?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback("yes")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    helpfulFeedback === "yes"
                      ? "bg-[#663CF6] text-white shadow-md shadow-[#663CF6]/25"
                      : "bg-[#663CF6] text-white hover:bg-[#5228E0]"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback("no")}
                  className={`flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] bg-white px-4 py-1.5 text-xs font-bold transition-all ${
                    helpfulFeedback === "no"
                      ? "bg-rose-50 border-rose-300 text-rose-600"
                      : "text-[#5A5E7A] hover:bg-slate-50"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* Related FAQs Accordion */}
            {article.relatedFaqs.length > 0 && (
              <section className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EDE7FF] text-[#663CF6]">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#08093B]">
                    Related FAQs
                  </h3>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F8F6FE] shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm divide-y divide-[#F0F2FA]">
                  {article.relatedFaqs.map((rel: FAQItem) => {
                    const isOpen = !!openRelated[rel.id];
                    return (
                      <div key={rel.id} className="transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleRelated(rel.id)}
                          className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50/70"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[#08093B]">
                            {rel.question}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#8E92BC] transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-[#663CF6]" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="border-t border-[#F0F2FA] bg-[#FAFBFD]/60 p-4 text-xs font-normal leading-relaxed text-[#5A5E7A] animate-in fade-in duration-150">
                            <p>{rel.answer}</p>
                            <div className="mt-3">
                              <Link
                                href={`/faqs/${rel.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#663CF6] hover:underline"
                              >
                                <span>Read full answer guide</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </article>

          {/* ==========================================
              RIGHT SIDEBAR (4 Cols)
              ========================================== */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            {/* Card 1: Search FAQs */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#663CF6]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                  Search FAQs
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (sidebarSearch.trim() && typeof window !== "undefined") {
                    window.location.href = `/faqs?q=${encodeURIComponent(sidebarSearch.trim())}`;
                  }
                }}
                className="relative mt-3 flex items-center"
              >
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search for a question..."
                  className="w-full rounded-full border border-[#D6DBF0] bg-white py-2.5 pr-11 pl-4 text-xs text-[#08093B] placeholder-[#8E92BC] outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#663CF6] text-white hover:bg-[#5228E0] transition-colors"
                  aria-label="Search FAQs"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Card 2: FAQ Categories */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                FAQ Categories
              </h3>

              <div className="mt-3 space-y-1.5">
                {FAQ_CATEGORIES.map((cat) => {
                  const isActive = article.categoryId === cat.id;
                  return (
                    <Link
                      key={cat.id}
                      href={`/faqs#${cat.id}`}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#EDE7FF] text-[#663CF6]"
                          : "text-[#5A5E7A] hover:bg-slate-50 hover:text-[#08093B]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon type={cat.iconType} className="h-4 w-4" />
                        <span>{cat.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-[#663CF6] text-white"
                            : "bg-[#F1F3F9] text-[#7C829E]"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Still Need Help? */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F2ECFE] p-6 text-center shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6]">
                <Headphones className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-base font-extrabold text-[#08093B]">
                Still Need Help?
              </h3>

              <p className="mt-2 text-xs font-medium text-[#5A5E7A] leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
              </p>

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-[#663CF6]/20 transition-all hover:opacity-95"
              >
                <span>Contact Support</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Card 4: Book a Demo (Purple Gradient Card with Laptop) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#663CF6] to-[#4F46E5] p-6 text-white shadow-lg shadow-[#663CF6]/25">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-200" />
                <h3 className="text-sm font-extrabold text-white">Book a Demo</h3>
              </div>

              <p className="mt-2 text-xs text-purple-100 leading-relaxed">
                See the platform in action and explore how it can work for your school.
              </p>

              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 px-4 text-xs font-bold text-[#08093B] shadow-md transition-all hover:bg-slate-50"
              >
                <span>Book a Demo</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#663CF6]" />
              </button>

              {/* Mini Laptop graphic with play button inside the card */}
              <div className="mt-5 flex justify-center">
                <div className="relative flex h-28 w-44 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#663CF6] shadow-md transition-transform hover:scale-110">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* =========================================================================
            4. BOTTOM BANNER: Have More Questions?
            ========================================================================= */}
        <section className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#4F46E5] p-6 text-white shadow-xl shadow-[#663CF6]/20 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold sm:text-xl text-white">
                  Have More Questions?
                </h3>
                <p className="mt-0.5 text-xs text-purple-100 sm:text-sm">
                  Explore all FAQs or get in touch with our support team for personalized assistance.
                </p>
              </div>
            </div>

            <Link
              href="/faqs"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#08093B] shadow-md transition-all hover:bg-slate-50"
            >
              <span>View All FAQs</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#663CF6]" />
            </Link>
          </div>
        </section>
      </main>

      {/* =========================================================================
          5. CONTACT SUPPORT MODAL
          ========================================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6]">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#08093B]">
                  Contact Support
                </h3>
                <p className="text-xs text-[#5A5E7A]">
                  Ask about &ldquo;{article.question}&rdquo; or any school topic.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactModalOpen(false);
                showToast("Ticket submitted! Our support team will reply within 15 minutes.");
                setContactName("");
                setContactEmail("");
                setContactMsg("");
              }}
              className="mt-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-[#08093B]">Your Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Principal Anita Sharma"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. principal@greenvalley.edu"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Message / Inquiry *</label>
                <textarea
                  required
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Tell us what you'd like more clarification on..."
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold text-[#5A5E7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. BOOK A DEMO MODAL
          ========================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#08093B]">
                  Schedule a Live Demo
                </h3>
                <p className="text-xs text-[#5A5E7A]">
                  Experience a 20-minute tailored walkthrough of ScholoNix.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDemoModalOpen(false);
                showToast("Demo scheduled! Our education consultant will contact you shortly.");
                setDemoName("");
                setDemoSchool("");
                setDemoEmail("");
              }}
              className="mt-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-[#08093B]">Your Name *</label>
                <input
                  type="text"
                  required
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="e.g. Principal Rajesh Mehta"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">School / Institution *</label>
                <input
                  type="text"
                  required
                  value={demoSchool}
                  onChange={(e) => setDemoSchool(e.target.value)}
                  placeholder="e.g. Greenfield Academy"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Official Email *</label>
                <input
                  type="email"
                  required
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="e.g. admin@greenfield.edu"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(false)}
                  className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold text-[#5A5E7A] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm Demo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER
          ========================================================================= */}
      <footer className="mt-20 border-t border-[#E6EAF5] bg-white pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-10">
            {/* Brand Column */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs text-[#5A5E7A] leading-relaxed">
                A comprehensive, cloud-based school management platform to simplify and streamline your school operations.
              </p>
              <div className="flex items-center gap-2.5 pt-1 text-[#663CF6]">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] hover:bg-[#EDE7FF]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] hover:bg-[#EDE7FF]"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] hover:bg-[#EDE7FF]"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] hover:bg-[#EDE7FF]"
                  aria-label="Instagram"
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
                  <Link href="/features" className="hover:text-[#663CF6]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#663CF6]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#for-schools" className="hover:text-[#663CF6]">
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
                  <Link href="/blog" className="hover:text-[#663CF6]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-[#663CF6]">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="text-[#663CF6] font-bold">
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
                  <Link href="/#contact" className="hover:text-[#663CF6]">
                    Contact Us
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

            {/* Stay Updated Newsletter */}
            <div className="space-y-3 sm:col-span-2 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Stay Updated
              </h4>
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

          {/* Bottom Copyright */}
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
