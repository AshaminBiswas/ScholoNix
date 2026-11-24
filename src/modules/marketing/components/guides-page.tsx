"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  BookOpen,
  Headphones,
  Rocket,
  Settings,
  GraduationCap,
  IndianRupee,
  BarChart3,
  Link2,
  LayoutGrid,
  FileText,
  Calendar,
  X,
  Sparkles,
  CheckCircle2,
  Menu,
  ClipboardList,
  Users,
  Star,
  Send,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  Check,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  GUIDE_CATEGORIES,
  FEATURED_GUIDE,
  POPULAR_GUIDES,
  ALL_GUIDES,
  GUIDE_JOURNEYS,
  type GuideCategory,
  type GuideJourney,
} from "../data/guides-data";

// 3D Vector Hero Artwork: Laptop with Graduation Cap, Books, and Checklist
function GuidesHeroIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      {/* Ambient background glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/45 to-[#93C5FD]/40 blur-2xl filter" />

      {/* Floating Status Badges */}
      <div className="absolute -top-3 left-6 z-20 flex animate-bounce items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-white/95 px-3 py-1 shadow-md shadow-[#663CF6]/10 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
        <span className="text-xs font-bold text-[#08093B]">28 Comprehensive Guides</span>
      </div>

      <div className="absolute -bottom-2 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#BAE6FD] bg-white/95 px-3 py-1 shadow-md shadow-[#0284C7]/10 backdrop-blur-md">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7]" />
        <span className="text-xs font-bold text-[#08093B]">Step-by-Step Walkthroughs</span>
      </div>

      <svg
        viewBox="0 0 520 380"
        className="relative z-10 h-auto w-full max-w-[460px] drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laptopBezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="screenGradGuides" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="bookPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="bookCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="leavesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#663CF6" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Botanical Leaves - Left */}
        <g opacity="0.85">
          <path d="M 60 250 C 40 195, 75 160, 95 180 C 115 200, 100 240, 60 250 Z" fill="url(#leavesGrad)" />
          <path d="M 45 230 C 25 190, 50 150, 70 170 C 85 185, 75 220, 45 230 Z" fill="url(#leavesGrad)" opacity="0.7" />
          <path d="M 75 240 C 70 210, 80 190, 90 200 C 95 210, 85 230, 75 240 Z" fill="#10B981" opacity="0.9" />
        </g>

        {/* Botanical Leaves - Right */}
        <g opacity="0.85">
          <path d="M 460 230 C 485 190, 455 150, 435 170 C 415 190, 430 230, 460 230 Z" fill="url(#leavesGrad)" />
          <path d="M 480 250 C 505 210, 480 170, 460 190 C 445 205, 455 240, 480 250 Z" fill="url(#leavesGrad)" opacity="0.7" />
        </g>

        {/* Stack of Books - Bottom Left */}
        <g transform="translate(45, 235)">
          <rect x="0" y="30" width="120" height="22" rx="4" fill="url(#bookCyanGrad)" filter="url(#heroShadow)" />
          <rect x="2" y="33" width="114" height="4" rx="2" fill="#BAE6FD" opacity="0.6" />
          <rect x="10" y="12" width="110" height="20" rx="4" fill="url(#bookPurpleGrad)" />
          <rect x="12" y="15" width="104" height="3" rx="1.5" fill="#DDD6FE" opacity="0.6" />
          <rect x="18" y="-4" width="95" height="18" rx="3" fill="#60A5FA" />
          <rect x="20" y="-2" width="90" height="3" rx="1.5" fill="#DBEAFE" opacity="0.7" />
        </g>

        {/* Main Laptop Body (Center) */}
        <g transform="translate(105, 70)">
          <ellipse cx="155" cy="245" rx="170" ry="14" fill="#08093B" opacity="0.12" />

          {/* Lid Bezel */}
          <rect x="30" y="10" width="250" height="170" rx="14" fill="url(#laptopBezel)" filter="url(#heroShadow)" />

          {/* Screen Inner */}
          <rect x="42" y="20" width="226" height="150" rx="8" fill="url(#screenGradGuides)" />

          {/* Screen Content: Guide Book Icon & Checklist Items */}
          <g transform="translate(54, 30)">
            {/* Top Book Graphic inside screen */}
            <g transform="translate(75, 10)">
              <rect x="0" y="0" width="44" height="30" rx="4" fill="#EDE7FF" stroke="#663CF6" strokeWidth="1.5" />
              <line x1="22" y1="0" x2="22" y2="30" stroke="#663CF6" strokeWidth="1.5" />
              <line x1="6" y1="8" x2="16" y2="8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="15" x2="16" y2="15" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="22" x2="14" y2="22" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="28" y1="8" x2="38" y2="8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
              <line x1="28" y1="15" x2="38" y2="15" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="28" y1="22" x2="36" y2="22" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Checklist item 1 */}
            <g transform="translate(20, 52)">
              <circle cx="6" cy="6" r="6" fill="#EDE7FF" />
              <path d="M 3 6 L 5 8 L 9 4" stroke="#663CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="3" width="130" height="6" rx="3" fill="#64748B" opacity="0.3" />
            </g>

            {/* Checklist item 2 */}
            <g transform="translate(20, 72)">
              <circle cx="6" cy="6" r="6" fill="#EDE7FF" />
              <path d="M 3 6 L 5 8 L 9 4" stroke="#663CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="3" width="110" height="6" rx="3" fill="#64748B" opacity="0.3" />
            </g>

            {/* Checklist item 3 */}
            <g transform="translate(20, 92)">
              <circle cx="6" cy="6" r="6" fill="#EDE7FF" />
              <path d="M 3 6 L 5 8 L 9 4" stroke="#663CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="3" width="140" height="6" rx="3" fill="#64748B" opacity="0.3" />
            </g>

            {/* Progress bar at bottom of screen */}
            <rect x="20" y="116" width="154" height="6" rx="3" fill="#E2E8F0" />
            <rect x="20" y="116" width="110" height="6" rx="3" fill="#663CF6" />
          </g>

          {/* Laptop Base (Keyboard shell) */}
          <path d="M 5 180 L 305 180 L 325 198 C 325 203, 320 206, 310 206 L 0 206 C -10 206, -15 203, -15 198 Z" fill="#CBD5E1" />
          <path d="M 12 182 L 298 182 L 314 196 L -4 196 Z" fill="#E2E8F0" />
          <rect x="125" y="186" width="60" height="8" rx="2" fill="#94A3B8" opacity="0.6" />
        </g>

        {/* Graduation Cap / Mortarboard resting on top-right of screen */}
        <g transform="translate(285, 38)" filter="url(#heroShadow)">
          {/* Diamond Cap */}
          <polygon points="50,0 100,16 50,32 0,16" fill="url(#capGrad)" />
          {/* Skull Cap underside */}
          <path d="M 22 23 C 22 40, 78 40, 78 23" fill="#3730A3" />
          {/* Golden Button & Tassel */}
          <circle cx="50" cy="16" r="3.5" fill="#FBBF24" />
          <path d="M 50 16 Q 80 25 82 45" stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="80" y="45" width="4" height="12" rx="2" fill="#F59E0B" />
        </g>

        {/* Floating sparkles */}
        <circle cx="210" cy="45" r="4" fill="#A78BFA" opacity="0.8" />
        <circle cx="430" cy="110" r="3.5" fill="#38BDF8" opacity="0.8" />
        <circle cx="110" cy="120" r="3" fill="#FBBF24" opacity="0.8" />
      </svg>
    </div>
  );
}

// Icon helper function based on iconType
function GuideIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  switch (type) {
    case "rocket":
      return <Rocket className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "academics":
      return <GraduationCap className={className} />;
    case "fees":
      return <IndianRupee className={className} />;
    case "reports":
      return <BarChart3 className={className} />;
    case "integrations":
      return <Link2 className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

// Journey Icon helper
function JourneyIcon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  switch (type) {
    case "clipboard":
      return <ClipboardList className={className} />;
    case "users":
      return <Users className={className} />;
    case "chart":
      return <BarChart3 className={className} />;
    case "star":
      return <Star className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

export function GuidesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeJourney, setActiveJourney] = useState<GuideJourney | null>(null);

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCategory, setContactCategory] = useState("Guides & Tutorials");
  const [contactMsg, setContactMsg] = useState("");

  const [demoName, setDemoName] = useState("");
  const [demoSchool, setDemoSchool] = useState("");
  const [demoEmail, setDemoEmail] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  // Filtered guides based on search, selectedCategory, and activeJourney
  const filteredGuides = useMemo(() => {
    let result = ALL_GUIDES;

    if (activeJourney) {
      result = result.filter((g) => activeJourney.guideSlugs.includes(g.slug));
    } else if (selectedCategory !== "all") {
      result = result.filter((g) => g.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [selectedCategory, searchQuery, activeJourney]);

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
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6]">
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
                href="/for-schools"
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =========================================================================
            2. HERO SECTION: Title, Subtitle, Search & 3D Laptop Art
            ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#EDE7FF]/80 p-6 shadow-[0_12px_36px_rgba(24,18,77,0.07)] backdrop-blur-md sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Badge, Title, Subtitle, Search */}
            <div className="lg:col-span-7">
              {/* Badge: [Book] Guides */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6]">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Guides</span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
                Step-by-Step Guides
              </h1>

              {/* Subtitle */}
              <p className="mt-3 max-w-xl text-sm font-medium text-[#5A5E7A] sm:text-base leading-relaxed">
                Learn how to set up, use and get the most out of ScholoNix with our detailed guides.
              </p>

              {/* Interactive Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="relative mt-6 max-w-lg"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-4 w-4 text-[#8E92BC]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guides..."
                    className="w-full rounded-full border border-[#D6DBF0] bg-white py-3.5 pr-14 pl-11 text-xs sm:text-sm text-[#08093B] placeholder-[#8E92BC] shadow-[0_4px_16px_rgba(24,18,77,0.05)] transition-all outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#663CF6] text-white shadow-sm hover:bg-[#5228E0] transition-colors"
                      title="Search"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <div className="mt-2 flex items-center justify-between px-2 text-xs text-[#5A5E7A]">
                    <span>
                      Found <strong>{filteredGuides.length}</strong> matching guide{filteredGuides.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-[#663CF6] font-semibold hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: 3D Laptop with Mortarboard Illustration */}
            <div className="flex items-center justify-center lg:col-span-5">
              <GuidesHeroIllustration />
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. HORIZONTAL CATEGORY FILTER TABS BAR (7 Tabs)
            ========================================================================= */}
        <section className="mt-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:gap-3">
            {/* Tab: All Guides */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setActiveJourney(null);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === "all" && !activeJourney
                  ? "bg-[#663CF6] text-white shadow-md shadow-[#663CF6]/25"
                  : "border border-[#D6DBF0]/80 bg-white text-[#5A5E7A] hover:border-[#663CF6]/40 hover:text-[#08093B]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>All Guides</span>
            </button>

            {/* Individual Category Tabs */}
            {GUIDE_CATEGORIES.map((cat: GuideCategory) => {
              const isActive = selectedCategory === cat.id && !activeJourney;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveJourney(null);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#663CF6] text-white shadow-md shadow-[#663CF6]/25"
                      : "border border-[#D6DBF0]/80 bg-white text-[#5A5E7A] hover:border-[#663CF6]/40 hover:text-[#08093B]"
                  }`}
                >
                  <GuideIcon type={cat.iconType} className="h-3.5 w-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {activeJourney && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#EDE7FF] px-4 py-2 text-xs text-[#663CF6] font-bold">
              <span>Filtering by Journey: &ldquo;{activeJourney.title}&rdquo; ({filteredGuides.length} guides)</span>
              <button
                type="button"
                onClick={() => setActiveJourney(null)}
                className="hover:underline flex items-center gap-1"
              >
                <span>Clear filter</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* =========================================================================
            4. MAIN 2-COLUMN SECTION: Left Sidebar & Right Guides Content
            ========================================================================= */}
        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ==========================================
              LEFT SIDEBAR (4 Cols)
              ========================================== */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            {/* Card 1: Guide Categories */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h2 className="text-sm font-extrabold text-[#08093B] tracking-tight">
                Guide Categories
              </h2>

              <div className="mt-4 space-y-1.5">
                {/* All Guides */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setActiveJourney(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    selectedCategory === "all" && !activeJourney
                      ? "bg-[#EDE7FF] text-[#663CF6]"
                      : "text-[#5A5E7A] hover:bg-slate-50 hover:text-[#08093B]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span>All Guides</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      selectedCategory === "all" && !activeJourney
                        ? "bg-[#663CF6] text-white"
                        : "bg-[#F1F3F9] text-[#7C829E]"
                    }`}
                  >
                    28
                  </span>
                </button>

                {/* Individual Categories */}
                {GUIDE_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id && !activeJourney;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveJourney(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#EDE7FF] text-[#663CF6]"
                          : "text-[#5A5E7A] hover:bg-slate-50 hover:text-[#08093B]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GuideIcon type={cat.iconType} className="h-4 w-4" />
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Need More Help? */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F2ECFE] p-6 text-center shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] shadow-sm">
                <Headphones className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-base font-extrabold text-[#08093B]">
                Need More Help?
              </h3>

              <p className="mt-2 text-xs font-medium text-[#5A5E7A] leading-relaxed">
                Can&apos;t find the right guide? Our support team is here to help you.
              </p>

              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#8B5CF6] py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-[#663CF6]/25 transition-all hover:opacity-95"
              >
                <span>Contact Support</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </aside>

          {/* ==========================================
              RIGHT MAIN SECTION (8 Cols)
              ========================================== */}
          <div className="space-y-8 lg:col-span-8">
            {/* If searching or filtering to specific items */}
            {searchQuery.trim() || selectedCategory !== "all" || activeJourney ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-base font-extrabold text-[#08093B]">
                    Guides ({filteredGuides.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                      setActiveJourney(null);
                    }}
                    className="text-xs font-bold text-[#663CF6] hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>

                {filteredGuides.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#CDC2F7] bg-white/80 backdrop-blur-sm p-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-[#8E92BC]" />
                    <h3 className="mt-4 text-base font-bold text-[#08093B]">
                      No matching guides found
                    </h3>
                    <p className="mt-1 text-xs text-[#5A5E7A]">
                      Try searching with a different keyword or browsing by category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredGuides.map((guide) => (
                      <Link
                        key={guide.id}
                        href={`/guides/${guide.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_14px_32px_rgba(102,60,246,0.14)]"
                      >
                        <div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60 transition-transform group-hover:scale-110">
                            <GuideIcon type={guide.iconType} className="h-5 w-5" />
                          </div>
                          <h4 className="mt-3.5 text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors leading-snug">
                            {guide.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-[#5A5E7A] line-clamp-2 leading-relaxed">
                            {guide.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2FA] pt-3 text-[11px] text-[#7C829E]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <FileText className="h-3 w-3 text-[#663CF6]" />
                            <span>{guide.badgeType} • {guide.readingTime}</span>
                          </div>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[#08093B] group-hover:bg-[#663CF6] group-hover:text-white transition-colors">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. Featured Guide Card */}
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#663CF6]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Featured Guide</span>
                  </div>

                  <Link
                    href={`/guides/${FEATURED_GUIDE.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F2ECFE] shadow-[0_10px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_18px_40px_rgba(102,60,246,0.16)] sm:flex-row"
                  >
                    {/* Left: Dashboard Mockup Artwork */}
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-[#EDE9FE] via-[#EEF2FF] to-[#E0E7FF] p-6 sm:w-1/2">
                      <div className="relative w-full max-w-[260px] drop-shadow-md transition-transform duration-500 group-hover:scale-105">
                        {/* Realistic Mockup Laptop */}
                        <div className="rounded-xl border-4 border-[#312E81] bg-white p-3 shadow-lg">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-[9px] font-extrabold text-[#08093B]">
                              ScholoNix
                            </span>
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <div className="rounded bg-slate-50 p-1.5">
                              <span className="block text-[7px] text-slate-400">Students</span>
                              <span className="text-[10px] font-extrabold text-[#08093B]">1,248</span>
                            </div>
                            <div className="rounded bg-slate-50 p-1.5">
                              <span className="block text-[7px] text-slate-400">Teachers</span>
                              <span className="text-[10px] font-extrabold text-[#08093B]">82</span>
                            </div>
                          </div>
                          {/* Mini Bar Chart */}
                          <div className="mt-2 flex h-8 items-end gap-1 rounded bg-[#F8FAFC] px-2 py-1">
                            <div className="h-3 w-2 rounded-t bg-[#818CF8]" />
                            <div className="h-5 w-2 rounded-t bg-[#6366F1]" />
                            <div className="h-4 w-2 rounded-t bg-[#4F46E5]" />
                            <div className="h-7 w-2 rounded-t bg-[#4338CA]" />
                            <div className="h-6 w-2 rounded-t bg-[#6366F1]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                      <div>
                        <span className="inline-block rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[11px] font-bold text-[#663CF6]">
                          {FEATURED_GUIDE.category}
                        </span>
                        <h3 className="mt-2 text-xl font-extrabold text-[#08093B] group-hover:text-[#663CF6] transition-colors sm:text-2xl">
                          {FEATURED_GUIDE.title}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm font-normal text-[#5A5E7A] leading-relaxed">
                          {FEATURED_GUIDE.description}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-[#F0F2FA] pt-4 text-xs font-semibold text-[#7C829E]">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-[#663CF6]" />
                          <span>{FEATURED_GUIDE.badgeType} • {FEATURED_GUIDE.readingTime}</span>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#08093B] group-hover:bg-[#663CF6] group-hover:text-white transition-colors">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* 2. Popular Guides Grid (6 Cards) */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-extrabold text-[#08093B]">
                    Popular Guides
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {POPULAR_GUIDES.map((guide) => (
                      <Link
                        key={guide.id}
                        href={`/guides/${guide.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE] p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_14px_32px_rgba(102,60,246,0.14)]"
                      >
                        <div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60 transition-transform group-hover:scale-110">
                            <GuideIcon type={guide.iconType} className="h-5 w-5" />
                          </div>
                          <h4 className="mt-3.5 text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors leading-snug">
                            {guide.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-[#5A5E7A] line-clamp-2 leading-relaxed">
                            {guide.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2FA] pt-3 text-[11px] text-[#7C829E]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <FileText className="h-3 w-3 text-[#663CF6]" />
                            <span>{guide.badgeType} • {guide.readingTime}</span>
                          </div>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[#08093B] group-hover:bg-[#663CF6] group-hover:text-white transition-colors">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* =========================================================================
            5. GUIDES BY JOURNEY (4 Full-Width Cards)
            ========================================================================= */}
        <section className="mt-16 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#08093B]">
              Guides by Journey
            </h2>
            <p className="mt-1 text-xs text-[#5A5E7A]">
              Follow curated guide collections based on what you want to achieve.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDE_JOURNEYS.map((journey) => (
              <button
                key={journey.id}
                type="button"
                onClick={() => {
                  setActiveJourney(journey);
                  setSelectedCategory("all");
                  window.scrollTo({ top: 380, behavior: "smooth" });
                  showToast(`Filtering by ${journey.title}`);
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4EFFE] p-5 text-left shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_14px_32px_rgba(102,60,246,0.14)]"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60 transition-transform group-hover:scale-105">
                    <JourneyIcon type={journey.iconType} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold text-[#08093B] group-hover:text-[#663CF6] transition-colors leading-snug">
                    {journey.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5A5E7A] leading-relaxed">
                    {journey.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#663CF6] group-hover:translate-x-0.5 transition-transform">
                  <span>View Guide Collection</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* =========================================================================
            6. BOTTOM CTA RIBBON BANNER: New to ScholoNix?
            ========================================================================= */}
        <section className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#4F46E5] p-6 text-white shadow-xl shadow-[#663CF6]/20 sm:p-8 lg:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            {/* Left: Icon & Text */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold sm:text-xl text-white">
                  New to ScholoNix?
                </h3>
                <p className="mt-0.5 text-xs text-purple-100 sm:text-sm">
                  Explore our step-by-step guides and become a pro in no time.
                </p>
              </div>
            </div>

            {/* Right: Buttons */}
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#08093B] shadow-md transition-all hover:bg-slate-50"
              >
                <Calendar className="h-3.5 w-3.5 text-[#663CF6]" />
                <span>Book a Demo</span>
              </button>
              <Link
                href="/register"
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          7. CONTACT SUPPORT MODAL
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
                  Contact Guide Specialists
                </h3>
                <p className="text-xs text-[#5A5E7A]">
                  We provide personalized setup assistance for your institution.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactModalOpen(false);
                showToast("Request received! A guide specialist will contact you shortly.");
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
                <label className="block text-xs font-bold text-[#08093B]">Topic</label>
                <select
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] bg-white px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                >
                  <option>Guides & Tutorials</option>
                  <option>School Setup Assistance</option>
                  <option>Timetable Configuration</option>
                  <option>Fees & Accounting Structure</option>
                  <option>Exam & Report Card Format</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Your Question / Need *</label>
                <textarea
                  required
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Describe which module or step you need guidance with..."
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
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. BOOK A DEMO MODAL
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
                showToast("Demo booked! Our consultant will reach out shortly.");
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
                <label className="block text-xs font-bold text-[#08093B]">School Name *</label>
                <input
                  type="text"
                  required
                  value={demoSchool}
                  onChange={(e) => setDemoSchool(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="e.g. principal@dps.edu"
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
                  <span>Confirm Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. FOOTER
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
                  <Link href="/faqs" className="hover:text-[#663CF6]">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="text-[#663CF6] font-bold">
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
