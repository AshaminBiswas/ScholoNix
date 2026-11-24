"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Headphones,
  Rocket,
  ShieldCheck,
  Tag,
  Layers,
  Info,
  LayoutGrid,
  ChevronUp,
  X,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Calendar,
  CheckCircle2,
  Menu,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  FAQ_CATEGORIES,
  type FAQItem,
} from "../data/faqs-data";

// 3D Hero Artwork: Laptop with Question Mark Speech Bubble, Books, and Leaves
function FaqsHeroIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      {/* Soft ambient background glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/45 to-[#93C5FD]/40 blur-2xl filter" />

      {/* Floating Sparkle / Status badges */}
      <div className="absolute -top-3 left-6 z-20 flex animate-bounce items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-white/95 px-3 py-1 shadow-md shadow-[#663CF6]/10 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
        <span className="text-xs font-bold text-[#08093B]">Instant Answers</span>
      </div>

      <div className="absolute -bottom-2 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#BAE6FD] bg-white/95 px-3 py-1 shadow-md shadow-[#0284C7]/10 backdrop-blur-md">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7]" />
        <span className="text-xs font-bold text-[#08093B]">Verified Platform Info</span>
      </div>

      <svg
        viewBox="0 0 520 380"
        className="relative z-10 h-auto w-full max-w-[460px] drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#663CF6" />
          </linearGradient>
          <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="bookPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#663CF6" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Botanical Leaves - Left */}
        <g opacity="0.85">
          <path
            d="M 60 250 C 45 200, 75 160, 95 180 C 115 200, 100 240, 60 250 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M 45 230 C 25 190, 50 150, 70 170 C 85 185, 75 220, 45 230 Z"
            fill="url(#leafGrad)"
            opacity="0.7"
          />
          <path
            d="M 75 240 C 70 210, 80 190, 90 200 C 95 210, 85 230, 75 240 Z"
            fill="#10B981"
            opacity="0.9"
          />
        </g>

        {/* Botanical Leaves - Right */}
        <g opacity="0.85">
          <path
            d="M 460 230 C 485 190, 455 150, 435 170 C 415 190, 430 230, 460 230 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M 480 250 C 505 210, 480 170, 460 190 C 445 205, 455 240, 480 250 Z"
            fill="url(#leafGrad)"
            opacity="0.7"
          />
        </g>

        {/* Stack of Books - Bottom Left */}
        <g transform="translate(45, 235)">
          {/* Bottom Book (Cyan/Blue) */}
          <rect x="0" y="30" width="120" height="22" rx="4" fill="url(#bookBlue)" filter="url(#shadowFilter)" />
          <rect x="2" y="33" width="114" height="4" rx="2" fill="#BAE6FD" opacity="0.6" />
          <path d="M 0 30 Q 12 41 0 52" stroke="#0284C7" strokeWidth="2" fill="none" />

          {/* Middle Book (Purple) */}
          <rect x="10" y="12" width="110" height="20" rx="4" fill="url(#bookPurple)" />
          <rect x="12" y="15" width="104" height="3" rx="1.5" fill="#DDD6FE" opacity="0.6" />

          {/* Top Book (Soft Blue) */}
          <rect x="18" y="-4" width="95" height="18" rx="3" fill="#60A5FA" />
          <rect x="20" y="-2" width="90" height="3" rx="1.5" fill="#DBEAFE" opacity="0.7" />
        </g>

        {/* Main Laptop Body (Center) */}
        <g transform="translate(105, 70)">
          {/* Laptop Base Stand / Shadow */}
          <ellipse cx="155" cy="245" rx="170" ry="14" fill="#08093B" opacity="0.12" />

          {/* Laptop Lid / Outer Bezel */}
          <rect
            x="30"
            y="10"
            width="250"
            height="170"
            rx="14"
            fill="url(#laptopGrad)"
            filter="url(#shadowFilter)"
          />

          {/* Screen Glass Inner */}
          <rect x="42" y="20" width="226" height="150" rx="8" fill="url(#screenGrad)" />

          {/* Screen Content: Header & Wireframe */}
          <g transform="translate(54, 30)">
            {/* Window controls */}
            <circle cx="4" cy="4" r="3" fill="#F87171" />
            <circle cx="14" cy="4" r="3" fill="#FBBF24" />
            <circle cx="24" cy="4" r="3" fill="#34D399" />

            {/* Wireframe lines & dashboard mock */}
            <rect x="40" y="2" width="70" height="5" rx="2.5" fill="#E2E8F0" />
            <rect x="160" y="2" width="40" height="5" rx="2.5" fill="#E2E8F0" />

            {/* Mock Dashboard UI cards */}
            <rect x="4" y="20" width="90" height="45" rx="6" fill="#F1F5F9" />
            <rect x="12" y="28" width="50" height="6" rx="3" fill="#663CF6" opacity="0.3" />
            <rect x="12" y="42" width="70" height="4" rx="2" fill="#CBD5E1" />
            <rect x="12" y="50" width="40" height="4" rx="2" fill="#E2E8F0" />

            <rect x="106" y="20" width="92" height="45" rx="6" fill="#F1F5F9" />
            <rect x="114" y="28" width="50" height="6" rx="3" fill="#0284C7" opacity="0.3" />
            <rect x="114" y="42" width="70" height="4" rx="2" fill="#CBD5E1" />
            <rect x="114" y="50" width="45" height="4" rx="2" fill="#E2E8F0" />

            <rect x="4" y="74" width="194" height="44" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
            <rect x="14" y="84" width="120" height="6" rx="3" fill="#94A3B8" opacity="0.4" />
            <rect x="14" y="96" width="160" height="4" rx="2" fill="#CBD5E1" />
            <rect x="14" y="104" width="90" height="4" rx="2" fill="#E2E8F0" />
          </g>

          {/* Laptop Base (Keyboard lower shell) */}
          <path
            d="M 5 180 L 305 180 L 325 198 C 325 203, 320 206, 310 206 L 0 206 C -10 206, -15 203, -15 198 Z"
            fill="#CBD5E1"
          />
          <path
            d="M 12 182 L 298 182 L 314 196 L -4 196 Z"
            fill="#E2E8F0"
          />
          {/* Laptop Trackpad */}
          <rect x="125" y="186" width="60" height="8" rx="2" fill="#94A3B8" opacity="0.6" />
          {/* Front Notch */}
          <path d="M 140 180 L 170 180 L 166 183 L 144 183 Z" fill="#94A3B8" />
        </g>

        {/* Large Prominent Floating 3D Purple Speech Bubble with White "?" */}
        <g transform="translate(230, 25)" filter="url(#shadowFilter)">
          {/* Speech Bubble Body */}
          <path
            d="M 45 0 C 70 0, 90 20, 90 45 C 90 70, 70 90, 45 90 C 35 90, 26 87, 18 81 L 4 94 C 2 96, -1 94, 0 91 L 3 76 C -1 67, -3 56, -3 45 C -3 20, 20 0, 45 0 Z"
            fill="url(#bubbleGrad)"
          />

          {/* Highlight glare */}
          <path
            d="M 25 12 C 55 12, 75 25, 75 42"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* White Bold Question Mark "?" */}
          <text
            x="44"
            y="61"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="52"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
          >
            ?
          </text>
        </g>

        {/* Floating Sparkles & Soft Particles */}
        <g opacity="0.8">
          <circle cx="210" cy="45" r="4" fill="#A78BFA" />
          <circle cx="430" cy="110" r="3.5" fill="#38BDF8" />
          <circle cx="110" cy="120" r="3" fill="#FBBF24" />
          <circle cx="390" cy="40" r="2.5" fill="#663CF6" />
        </g>
      </svg>
    </div>
  );
}

// Icon helper function based on iconType
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
      return <HelpCircle className={className} />;
  }
}

export function FaqsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // By default, open the first item of general: "what-is-school-management-saas"
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "what-is-school-management-saas": true,
  });
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no">>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCategory, setContactCategory] = useState("General Inquiry");
  const [contactMessage, setContactMessage] = useState("");

  const [demoName, setDemoName] = useState("");
  const [demoSchool, setDemoSchool] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoStudents, setDemoStudents] = useState("300-800");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const toggleAccordion = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyLink = (id: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/faqs#${id}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedId(id);
      showToast("Direct question link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleFeedback = (id: string, response: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [id]: response }));
    showToast(response === "yes" ? "Thanks for your feedback!" : "Thank you. We'll improve this answer!");
  };

  // Filtered Categories & Questions based on search & selected category
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return FAQ_CATEGORIES.map((cat) => {
      // If a specific category tab is selected and doesn't match this category
      if (selectedCategory !== "all" && cat.id !== selectedCategory) {
        return { ...cat, items: [] };
      }

      if (!q) {
        return cat;
      }

      const matchingItems = cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      );

      return {
        ...cat,
        items: matchingItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery, selectedCategory]);

  const totalFaqCount = useMemo(() => {
    return FAQ_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  }, []);

  const totalFilteredCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

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

        {/* Mobile Dropdown Menu Drawer */}
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

              {/* Mobile Resources Menu */}
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
              {/* Badge: (?) FAQs */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6]">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>FAQs</span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
                Frequently Asked <br className="hidden sm:inline" />
                Questions
              </h1>

              {/* Subtitle */}
              <p className="mt-3 max-w-xl text-sm font-medium text-[#5A5E7A] sm:text-base leading-relaxed">
                Find quick answers to common questions about ScholoNix, features, pricing and more.
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
                    placeholder="Search FAQs..."
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
                      Found <strong>{totalFilteredCount}</strong> matching question{totalFilteredCount !== 1 ? "s" : ""}
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

            {/* Right Column: 3D Laptop Hero Illustration */}
            <div className="flex items-center justify-center lg:col-span-5">
              <FaqsHeroIllustration />
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. HORIZONTAL CATEGORY FILTER TABS BAR (7 Tabs)
            ========================================================================= */}
        <section className="mt-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:gap-3">
            {/* Tab: All FAQs */}
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-[#663CF6] text-white shadow-md shadow-[#663CF6]/25"
                  : "border border-[#D6DBF0]/80 bg-white text-[#5A5E7A] hover:border-[#663CF6]/40 hover:text-[#08093B]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>All FAQs</span>
            </button>

            {/* Category Tabs */}
            {FAQ_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#663CF6] text-white shadow-md shadow-[#663CF6]/25"
                      : "border border-[#D6DBF0]/80 bg-white text-[#5A5E7A] hover:border-[#663CF6]/40 hover:text-[#08093B]"
                  }`}
                >
                  <CategoryIcon type={cat.iconType} className="h-3.5 w-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. MAIN 2-COLUMN CONTENT: Left Sidebar & Right FAQ Accordions
            ========================================================================= */}
        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ==========================================
              LEFT SIDEBAR (4 Cols)
              ========================================== */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            {/* Card 1: FAQ Categories List */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F4F0FE] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <h2 className="text-sm font-extrabold text-[#08093B] tracking-tight">
                FAQ Categories
              </h2>

              <div className="mt-4 space-y-1.5">
                {/* All FAQs Option */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    selectedCategory === "all"
                      ? "bg-[#EDE7FF] text-[#663CF6]"
                      : "text-[#5A5E7A] hover:bg-slate-50 hover:text-[#08093B]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span>All FAQs</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      selectedCategory === "all"
                        ? "bg-[#663CF6] text-white"
                        : "bg-[#F1F3F9] text-[#7C829E]"
                    }`}
                  >
                    {totalFaqCount}
                  </span>
                </button>

                {/* Individual Categories */}
                {FAQ_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Still Have a Question? */}
            <div className="rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F2ECFE] p-6 text-center shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] shadow-sm">
                <Headphones className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-base font-extrabold text-[#08093B]">
                Still Have a Question?
              </h3>

              <p className="mt-2 text-xs font-medium text-[#5A5E7A] leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
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
              RIGHT MAIN FAQ ACCORDIONS (8 Cols)
              ========================================== */}
          <div className="space-y-8 lg:col-span-8">
            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D6DBF0] bg-white p-12 text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-[#8E92BC]" />
                <h3 className="mt-4 text-base font-bold text-[#08093B]">
                  No matching questions found
                </h3>
                <p className="mt-1 text-xs text-[#5A5E7A]">
                  We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try another term or contact support.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-xl border border-[#D6DBF0] px-4 py-2 text-xs font-bold text-[#08093B] hover:bg-slate-50"
                  >
                    Clear Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="rounded-xl bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#5228E0]"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            ) : (
              filteredCategories.map((catGroup) => (
                <div key={catGroup.id} id={catGroup.id} className="scroll-mt-24 space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2.5 px-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDE7FF] text-[#663CF6]">
                      <CategoryIcon type={catGroup.iconType} className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#08093B]">
                      {catGroup.name}
                    </h3>
                    <span className="text-xs font-medium text-[#7C829E]">
                      ({catGroup.items.length})
                    </span>
                  </div>

                  {/* Accordion Card Container */}
                  <div className="overflow-hidden rounded-2xl border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F8F6FE] shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm divide-y divide-[#EDE9FE]/70 hover:border-[#663CF6]/60 transition-colors">
                    {catGroup.items.map((item: FAQItem) => {
                      const isOpen = !!openItems[item.id];
                      return (
                        <div key={item.id} id={item.id} className="group scroll-mt-28 transition-colors">
                          {/* Accordion Trigger Button */}
                          <button
                            type="button"
                            onClick={() => toggleAccordion(item.id)}
                            className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-[#F8F9FE]"
                            aria-expanded={isOpen}
                          >
                            <span className="text-xs sm:text-sm font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors leading-snug">
                              {item.question}
                            </span>
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
                                isOpen
                                  ? "bg-[#EDE7FF] text-[#663CF6] rotate-0"
                                  : "text-[#8E92BC] hover:bg-slate-100"
                              }`}
                            >
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                            </div>
                          </button>

                          {/* Accordion Answer Content */}
                          {isOpen && (
                            <div className="border-t border-[#F0F2FA] bg-[#FAFBFD]/60 px-4 pt-3 pb-4 sm:px-5 animate-in fade-in duration-200">
                              <p className="text-xs sm:text-[13px] font-normal leading-relaxed text-[#5A5E7A]">
                                {item.answer}
                              </p>

                              {/* Action Bar: Was this helpful? & Copy link */}
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFF8] pt-3 text-[11px] text-[#7C829E]">
                                <div className="flex items-center gap-2">
                                  <span>Was this answer helpful?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(item.id, "yes")}
                                    className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-colors ${
                                      helpfulFeedback[item.id] === "yes"
                                        ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                        : "hover:bg-slate-100 text-[#5A5E7A]"
                                    }`}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>Yes</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(item.id, "no")}
                                    className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-colors ${
                                      helpfulFeedback[item.id] === "no"
                                        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                                        : "hover:bg-slate-100 text-[#5A5E7A]"
                                    }`}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                    <span>No</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Link
                                    href={`/faqs/${item.id}`}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[#663CF6] hover:bg-[#EDE7FF] font-bold transition-colors"
                                  >
                                    <span>Full Guide</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyLink(item.id)}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[#663CF6] hover:bg-[#EDE7FF] transition-colors"
                                  >
                                    {copiedId === item.id ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span className="text-emerald-600 font-bold">Link Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* =========================================================================
            5. BOTTOM BANNER: Ready to Get Started?
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
                  Ready to Get Started?
                </h3>
                <p className="mt-0.5 text-xs text-purple-100 sm:text-sm">
                  Explore the platform, try the features and see how it can work for your school.
                </p>
              </div>
            </div>

            {/* Right: Action Buttons */}
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
          6. CONTACT SUPPORT MODAL
          ========================================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#D6DBF0] bg-white p-6 shadow-2xl">
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
                  Contact Support Team
                </h3>
                <p className="text-xs text-[#5A5E7A]">
                  We typically respond within 15 minutes during school hours.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactModalOpen(false);
                showToast("Support ticket created! We'll reply via email shortly.");
                setContactName("");
                setContactEmail("");
                setContactMessage("");
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
                <label className="block text-xs font-bold text-[#08093B]">Inquiry Category</label>
                <select
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] bg-white px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                >
                  <option>General Inquiry</option>
                  <option>Pricing & School Plans</option>
                  <option>Data Migration & Setup</option>
                  <option>Technical Help / Bug Report</option>
                  <option>Billing & Receipts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Your Question / Details *</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Please describe what you need assistance with..."
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
                  <span>Send Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. BOOK A DEMO MODAL
          ========================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#D6DBF0] bg-white p-6 shadow-2xl">
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
                showToast("Demo booked! Our education consultant will reach out shortly.");
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
                <label className="block text-xs font-bold text-[#08093B]">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  value={demoSchool}
                  onChange={(e) => setDemoSchool(e.target.value)}
                  placeholder="e.g. Sunrise Public School"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="e.g. principal@sunriseschool.org"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08093B]">Approximate Student Count</label>
                <select
                  value={demoStudents}
                  onChange={(e) => setDemoStudents(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] bg-white px-3 py-2 text-xs text-[#08093B] outline-none focus:border-[#7C3AED]"
                >
                  <option>Under 300 Students (Starter)</option>
                  <option>300 - 800 Students</option>
                  <option>800 - 2,000 Students (Professional)</option>
                  <option>2,000+ Students (Enterprise / Multi-Branch)</option>
                </select>
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
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Confirm Demo Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. FOOTER (Exact standard marketing footer)
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
                  showToast("Thank you for subscribing to updates!");
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
