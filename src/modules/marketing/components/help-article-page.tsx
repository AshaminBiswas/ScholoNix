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
  ChevronDown,
  Bookmark,
  Share2,
  Info,
  CheckCircle2,
  Users,
  IndianRupee,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Search,
  ListOrdered,
  FileText,
  Headphones,
  Play,
  X,
  Menu,
  Sparkles,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import type { DetailedHelpArticle } from "../data/help-data";
import { BrandLogo } from "@/components/ui/brand-logo";

interface HelpArticlePageProps {
  article: DetailedHelpArticle;
  relatedArticles: DetailedHelpArticle[];
  prevArticle: DetailedHelpArticle | null;
  nextArticle: DetailedHelpArticle | null;
}

// Hero Artwork: Laptop displaying Stepper UI, Potted Plant, and Mortarboard Cap
function SetupStepperIllustration() {
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
          <linearGradient id="laptopShell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#663CF6" />
          </linearGradient>
          <linearGradient id="displayBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="mortarCap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="plantPot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>

        {/* Ambient shadow */}
        <ellipse cx="310" cy="325" rx="260" ry="22" fill="#1E1B4B" fillOpacity="0.12" />

        {/* =====================================================================
            LEFT FOREGROUND: Potted Plant on Stack of Books
            ===================================================================== */}
        {/* Book 1 */}
        <rect x="50" y="275" width="115" height="20" rx="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
        <rect x="55" y="279" width="105" height="3" rx="1.5" fill="#E0F2FE" />
        {/* Book 2 */}
        <rect x="58" y="252" width="105" height="20" rx="4" fill="#A855F7" stroke="#7C3AED" strokeWidth="2" />
        <rect x="63" y="256" width="95" height="3" rx="1.5" fill="#F3E8FF" />

        {/* Plant Pot */}
        <path d="M85 252 L135 252 L128 205 L92 205 Z" fill="url(#plantPot)" stroke="#94A3B8" strokeWidth="2" />
        <rect x="88" y="202" width="44" height="6" rx="2" fill="#94A3B8" />

        {/* Leaves */}
        {/* Center Leaf */}
        <path d="M110 202 Q 110 145, 110 135 Q 125 160, 110 202 Z" fill="#10B981" />
        <path d="M110 202 Q 95 160, 110 135" stroke="#059669" strokeWidth="1.5" fill="none" />
        {/* Left Leaf */}
        <path d="M105 195 Q 65 170, 75 145 Q 98 165, 105 195 Z" fill="#34D399" />
        {/* Right Leaf */}
        <path d="M115 195 Q 155 170, 145 145 Q 122 165, 115 195 Z" fill="#34D399" />

        {/* =====================================================================
            MAIN LAPTOP
            ===================================================================== */}
        <rect x="150" y="60" width="360" height="235" rx="16" fill="url(#laptopShell)" stroke="#312E81" strokeWidth="4" />
        <rect x="164" y="74" width="332" height="207" rx="10" fill="url(#displayBg)" />

        {/* Laptop UI Screen Header */}
        <rect x="178" y="86" width="304" height="20" rx="4" fill="#EDE9FE" />
        <circle cx="192" cy="96" r="4" fill="#7C3AED" />
        <text x="204" y="99" fill="#663CF6" fontSize="9" fontWeight="bold" fontFamily="system-ui, sans-serif">
          ScholoNix
        </text>

        {/* Mini Sidebar Nav lines */}
        <rect x="178" y="116" width="34" height="150" rx="4" fill="#F1F5F9" />
        <circle cx="195" cy="130" r="4" fill="#818CF8" />
        <circle cx="195" cy="150" r="4" fill="#CBD5E1" />
        <circle cx="195" cy="170" r="4" fill="#CBD5E1" />
        <circle cx="195" cy="190" r="4" fill="#CBD5E1" />
        <circle cx="195" cy="210" r="4" fill="#CBD5E1" />

        {/* Center Card with Setup Stepper */}
        {/* Heading */}
        <circle cx="345" cy="130" r="14" fill="#7C3AED" />
        <path d="M340 130 L344 134 L351 126" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="345" y="160" textAnchor="middle" fill="#08093B" fontSize="14" fontWeight="800" fontFamily="system-ui, sans-serif">
          Set Up Your School
        </text>

        {/* Stepper Progress Line */}
        <line x1="280" y1="192" x2="410" y2="192" stroke="#E2E8F0" strokeWidth="3" />
        <line x1="280" y1="192" x2="345" y2="192" stroke="#7C3AED" strokeWidth="3" />

        {/* Step 1 Circle (Completed) */}
        <circle cx="280" cy="192" r="8" fill="#7C3AED" />
        <path d="M277 192 L279 194 L284 189" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="280" y="212" textAnchor="middle" fill="#08093B" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">
          Create Account
        </text>

        {/* Step 2 Circle (Completed) */}
        <circle cx="345" cy="192" r="8" fill="#7C3AED" />
        <path d="M342 192 L344 194 L349 189" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="345" y="212" textAnchor="middle" fill="#08093B" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">
          Add School Details
        </text>

        {/* Step 3 Circle (Pending) */}
        <circle cx="410" cy="192" r="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
        <text x="410" y="212" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="system-ui, sans-serif">
          Get Started
        </text>

        {/* Laptop Keyboard Base */}
        <path d="M110 295 L550 295 L525 318 L135 318 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <rect x="290" y="298" width="80" height="8" rx="2" fill="#94A3B8" fillOpacity="0.6" />

        {/* =====================================================================
            TOP RIGHT: Academic Graduation Cap (Mortarboard) with Tassel
            ===================================================================== */}
        {/* Skull cap */}
        <ellipse cx="485" cy="98" rx="30" ry="12" fill="#312E81" />
        {/* Diamond Top */}
        <polygon points="485,50 535,74 485,98 435,74" fill="url(#mortarCap)" stroke="#2E1065" strokeWidth="2" />
        {/* Center button */}
        <circle cx="485" cy="74" r="4" fill="#FBBF24" />
        {/* Golden Tassel */}
        <path d="M485 74 Q 520 80, 526 112" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="523" y="112" width="7" height="12" rx="1.5" fill="#D97706" />
      </svg>
    </div>
  );
}

export function HelpArticlePage({
  article,
  relatedArticles,
  prevArticle,
  nextArticle,
}: HelpArticlePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [helpfulFeedback, setHelpfulFeedback] = useState<"yes" | "no" | null>("yes");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => {
      const next = !prev;
      showToast(next ? "Article saved to your bookmarks!" : "Article removed from bookmarks");
      return next;
    });
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: article.title,
            text: article.subtitle,
            url: window.location.href,
          });
          return;
        } catch {
          // Fallback to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!");
      } catch {
        showToast("Link copied!");
      }
    }
  };

  // Scrollspy observer for "In This Article"
  useEffect(() => {
    const sectionIds = ["overview", "before-you-start", "step-by-step-guide", "whats-next"];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]!);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]!);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      {/* Luminous Atmospheric Aurora & Wave Background with rich contrast */}
      <AtmosphericBackground />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#7C3AED]/40 bg-white/98 px-4 py-3 text-sm font-semibold text-[#08093B] shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="h-4 w-4 text-[#7C3AED]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER / NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Navigation Menu */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4D5072] md:flex">
            <Link href="/features" className="transition-colors hover:text-[#663CF6]">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6]">
              Pricing
            </Link>
            <Link href="/#for-schools" className="transition-colors hover:text-[#663CF6]">
              For Schools
            </Link>
            {/* Active Resources Dropdown */}
            <ResourcesDropdown active={true} />
          </nav>

          {/* Right Action CTAs & Mobile Hamburger */}
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
              Get Started Free
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D6DBF0] bg-white text-[#08093B] shadow-sm transition hover:bg-[#F2EEFD] hover:text-[#663CF6] md:hidden"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D6DBF0] bg-white/98 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg md:hidden">
            <nav className="flex flex-col space-y-3.5 text-sm font-semibold text-[#1B1D45]">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
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
                href="/#for-schools"
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
                Get Started Free &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =========================================================================
            2. BREADCRUMBS
            ========================================================================= */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6B7280] pb-6"
        >
          <Link
            href="/"
            className="flex items-center gap-1 text-[#4D5072] transition hover:text-[#663CF6]"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0]" />
          <Link href="/help" className="transition hover:text-[#663CF6]">
            Help Center
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0]" />
          <Link
            href={`/help?category=${article.categoryId}`}
            className="transition hover:text-[#663CF6]"
          >
            {article.category}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0]" />
          <span className="text-[#08093B] font-bold truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </nav>

        {/* =========================================================================
            3. MAIN CONTENT: 2 COLUMNS (Left: 8 cols, Right: 4 cols)
            ========================================================================= */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* =======================================================================
              LEFT CONTENT (Article Header, Artwork, Guide, Next Steps, Feedback)
              ======================================================================= */}
          <article ref={articleRef} className="space-y-8 lg:col-span-8">
            {/* Category Tag */}
            <div>
              <span className="inline-block rounded-full bg-[#EDE7FF] px-3.5 py-1 text-xs font-extrabold text-[#663CF6] shadow-xs">
                {article.category}
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl lg:text-5xl lg:leading-[1.18]">
                {article.title}
              </h1>
              <p className="text-sm font-medium leading-relaxed text-[#4D5072] sm:text-base">
                {article.subtitle}
              </p>
            </div>

            {/* Metadata & Save/Share Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#EAEFF8] py-4">
              <div className="flex items-center gap-4 text-xs font-semibold text-[#5A5E7A]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#7C3AED]" />
                  <span>Last updated: {article.lastUpdated}</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#7C3AED]" />
                  <span>Reading time: {article.readTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    isSaved
                      ? "border-[#7C3AED] bg-[#EDE7FF] text-[#663CF6]"
                      : "border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6]"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isSaved ? "fill-[#663CF6] text-[#663CF6]" : ""}`}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] bg-white px-3.5 py-2 text-xs font-bold text-[#4D5072] transition-all hover:border-[#663CF6] hover:text-[#663CF6]"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Hero Cover Artwork (Laptop Stepper + Plant + Mortarboard) */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0]/80 bg-gradient-to-br from-[#E0F2FE] via-[#EDE7FF] to-[#F5F3FF] p-6 sm:p-10 shadow-[0_16px_40px_rgba(24,18,77,0.06)]">
              <SetupStepperIllustration />
            </div>

            {/* Mobile Table of Contents (Inline, Collapsible, Static) */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-4 shadow-sm lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTocOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={mobileTocOpen}
              >
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-[#7C3AED]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                    In This Article
                  </span>
                  <span className="rounded-full bg-[#EDE7FF] px-2 py-0.5 text-[10px] font-bold text-[#663CF6]">
                    4 sections
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#7C3AED] transition-transform duration-200 ${
                    mobileTocOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileTocOpen && (
                <nav className="mt-3 space-y-1.5 border-t border-[#EDE7FF] pt-3">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "before-you-start", label: "Before You Start" },
                    { id: "step-by-step-guide", label: "Step-by-Step Setup Guide" },
                    { id: "whats-next", label: "What's Next?" },
                  ].map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#EDE7FF] font-bold text-[#663CF6]"
                            : "text-[#4D5072] hover:bg-[#F8FAFC] hover:text-[#663CF6]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-[#663CF6]" : "bg-[#CBD5E1]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Overview Section */}
            <section id="overview" className="space-y-3 pt-2">
              <h2 className="text-2xl font-extrabold text-[#08093B]">Overview</h2>
              <p className="text-sm font-medium leading-relaxed text-[#4D5072] sm:text-base">
                {article.overviewText}
              </p>
            </section>

            {/* Before You Start Callout Box */}
            <section
              id="before-you-start"
              className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF] to-[#EDE7FF]/70 p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#08093B]">
                    Before You Start
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-[#5A5E7A]">
                    {article.beforeYouStart}
                  </p>
                </div>
              </div>
            </section>

            {/* Step-by-Step Setup Guide */}
            <section id="step-by-step-guide" className="space-y-5 pt-2">
              <h2 className="text-2xl font-extrabold text-[#08093B]">
                Step-by-Step Setup Guide
              </h2>

              <div className="space-y-4">
                {article.setupSteps.map((step) => (
                  <div
                    key={step.number}
                    className="flex items-start gap-4 rounded-xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-sm font-extrabold text-[#663CF6] ring-1 ring-[#D4C4FE]/60">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#08093B] leading-tight">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-[#5A5E7A]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* You're All Set! Banner */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-[#ECFDF5] p-5 shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    You&apos;re All Set!
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-emerald-800">
                    {article.allSetMessage}
                  </p>
                </div>
              </div>
            </section>

            {/* What's Next? (4 Action Cards Grid) */}
            <section id="whats-next" className="space-y-4 pt-2">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08093B]">What&apos;s Next?</h2>
                <p className="mt-1 text-xs sm:text-sm font-medium text-[#5A5E7A]">
                  Once your account is set up, here are a few things you can do next:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {article.whatsNext.map((item, idx) => {
                  const Icon =
                    item.iconType === "users"
                      ? Users
                      : item.iconType === "academics"
                      ? GraduationCap
                      : item.iconType === "fees"
                      ? IndianRupee
                      : BarChart3;

                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4EFFE] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                    >
                      <div className="space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60 transition-transform group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-medium text-[#7C829E] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Was this article helpful? */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4EFFE] p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm">
              <span className="text-xs sm:text-sm font-bold text-[#08093B]">
                Was this article helpful?
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHelpfulFeedback("yes");
                    showToast("Thank you for your feedback! 👍");
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                    helpfulFeedback === "yes"
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-xs"
                      : "border-[#D6DBF0] bg-white text-[#4D5072] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Yes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHelpfulFeedback("no");
                    showToast("Thanks! We will improve this guide.");
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                    helpfulFeedback === "no"
                      ? "border-rose-300 bg-rose-50 text-rose-700 shadow-xs"
                      : "border-[#D6DBF0] bg-white text-[#4D5072] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* Previous & Next Navigation Cards */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {prevArticle ? (
                <Link
                  href={`/help/${prevArticle.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#663CF6]">
                    <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                    <span>Previous Article</span>
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition line-clamp-2">
                    {prevArticle.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextArticle ? (
                <Link
                  href={`/help/${nextArticle.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-4 text-right shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#663CF6]">
                    <span>Next Article</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition line-clamp-2">
                    {nextArticle.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>

          {/* =======================================================================
              RIGHT SIDEBAR (Search, In This Article, Related, Support, Video)
              ======================================================================= */}
          <aside ref={sidebarRef} className="space-y-6 lg:col-span-4 lg:self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Widget 1: Search Help Center */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#08093B]">
                <Search className="h-4 w-4 text-[#7C3AED]" />
                <span>Search Help Center</span>
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (sidebarSearch.trim()) {
                    window.location.href = `/help?q=${encodeURIComponent(sidebarSearch.trim())}`;
                  }
                }}
                className="mt-3 relative flex items-center rounded-xl border border-[#D6DBF0] p-1 shadow-xs transition-all focus-within:border-[#7C3AED]"
              >
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search for help articles..."
                  className="w-full bg-transparent px-2.5 text-xs font-medium text-[#08093B] placeholder-[#8E92BC] outline-none"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#663CF6] text-white shadow-xs transition hover:scale-105 active:scale-95"
                  aria-label="Search"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Widget 2: In This Article (Table of Contents) */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#08093B]">
                <ListOrdered className="h-4 w-4 text-[#7C3AED]" />
                <span>In This Article</span>
              </h3>

              <nav className="mt-4 space-y-2">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "before-you-start", label: "Before You Start" },
                  { id: "step-by-step-guide", label: "Step-by-Step Setup Guide" },
                  { id: "whats-next", label: "What's Next?" },
                ].map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#EDE7FF] font-bold text-[#663CF6]"
                          : "text-[#4D5072] hover:bg-[#F8FAFC] hover:text-[#663CF6]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          isActive ? "bg-[#663CF6] scale-125" : "bg-[#CBD5E1]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Widget 3: Related Articles */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#08093B]">
                <FileText className="h-4 w-4 text-[#7C3AED]" />
                <span>Related Articles</span>
              </h3>

              <div className="mt-4 space-y-3">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/help/${rel.slug}`}
                    className="group flex items-center justify-between rounded-xl p-2 transition hover:bg-[#F6F5FD]"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[#7C3AED] shrink-0" />
                      <span className="text-xs font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors line-clamp-1">
                        {rel.title}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8E92BC] shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-[#663CF6]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget 4: Still Need Help? */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F2ECFE] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6]">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#08093B]">Still Need Help?</h4>
                  <p className="text-[11px] font-medium text-[#7C829E]">
                    Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-[1.02] active:scale-95"
              >
                <span>Contact Support</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Widget 5: Video Tutorial */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF] to-[#EDE7FF]/80 p-6 text-center shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h4 className="text-sm font-extrabold text-[#08093B]">Video Tutorial</h4>
              <p className="mt-1 text-xs text-[#5A5E7A]">
                Watch a step-by-step video on setting up your school account.
              </p>

              {/* Video Monitor graphic */}
              <div className="mt-4 flex justify-center">
                <div
                  onClick={() => setVideoModalOpen(true)}
                  className="group/vid relative aspect-video w-full max-w-[220px] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#4338CA] flex items-center justify-center text-white shadow-md transition hover:scale-105"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition group-hover/vid:scale-110">
                    <Play className="h-5 w-5 fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
                >
                  <span>Watch Video</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* =========================================================================
            7. EXPLORE MORE GUIDES RIBBON BANNER
            ========================================================================= */}
        <section className="mt-16 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] p-6 sm:p-8 text-white shadow-xl shadow-[#663CF6]/20">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold">
                  Explore More Guides
                </h3>
                <p className="text-xs sm:text-sm text-white/90 max-w-xl">
                  Browse step-by-step articles to set up and manage your school with ease.
                </p>
              </div>
            </div>

            <Link
              href="/help"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#663CF6] shadow-md transition-all hover:bg-[#F7F4FF] hover:scale-105 active:scale-95"
            >
              <span>View All Articles</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Video Modal */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] transition hover:bg-[#F1F3FB] hover:text-[#08093B]"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-extrabold text-[#08093B]">
              Video: How to Set Up Your School Account
            </h2>

            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#312E81] flex flex-col items-center justify-center text-white p-6 shadow-inner">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:scale-110 cursor-pointer">
                <Play className="h-8 w-8 fill-white translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-center">Interactive Onboarding (6:40)</h3>
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {contactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#CDC2F7] bg-gradient-to-b from-white via-[#FAF8FF] to-[#F5F2FE] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] transition hover:bg-[#F1F3FB] hover:text-[#08093B]"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-[#663CF6]" />
              <h2 className="text-xl font-extrabold text-[#08093B]">Contact Support</h2>
            </div>
            <p className="mt-1 text-xs text-[#5A5E7A]">
              Our technical engineering team is ready to assist your institution.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactModalOpen(false);
                showToast("🎉 Support ticket submitted! We will respond promptly.");
              }}
              className="mt-5 space-y-3.5"
            >
              <div>
                <label className="text-xs font-bold text-[#08093B]">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourschool.edu"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] p-2.5 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#08093B]">Question or Issue</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what you need help with..."
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] p-2.5 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-[1.02] active:scale-95"
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. FOOTER (Matching Site Standards)
          ========================================================================= */}
      <footer className="mt-20 border-t border-[#D6DBF0] bg-white pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12">
            {/* Logo & Description */}
            <div className="space-y-4 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-xs text-xs font-medium leading-relaxed text-[#4D5072]">
                A comprehensive, cloud-based school management platform to simplify and streamline your school operations.
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] text-[#4D5072] transition hover:border-[#663CF6] hover:text-[#663CF6]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] text-[#4D5072] transition hover:border-[#663CF6] hover:text-[#663CF6]"
                  aria-label="YouTube"
                >
                  <Youtube className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] text-[#4D5072] transition hover:border-[#663CF6] hover:text-[#663CF6]"
                  aria-label="Facebook"
                >
                  <Facebook className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] text-[#4D5072] transition hover:border-[#663CF6] hover:text-[#663CF6]"
                  aria-label="Instagram"
                >
                  <Instagram className="h-3.5 w-3.5" />
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
                  <Link href="/features#integrations" className="hover:text-[#663CF6]">
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
                  <Link href="/help" className="text-[#663CF6] font-bold">
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
