"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Settings,
  Users,
  BarChart3,
  IndianRupee,
  FileText,
  Play,
  Video,
  Headphones,
  Rocket,
  Calendar,
  Cloud,
  X,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle2,
  Menu,
  ChevronRight,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DETAILED_HELP_ARTICLES,
  HELP_TOPICS,
  VIDEO_TUTORIALS,
  type DetailedHelpArticle,
  type HelpTopic,
} from "../data/help-data";

// 3D Hero Artwork: Laptop with Question Mark, Support Headphones, and Stacked Books
function HelpHeroIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      {/* Soft background glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/40 dark:from-[#663CF6]/25 to-[#93C5FD]/35 dark:to-[#0284C7]/20 blur-2xl filter" />

      {/* Floating Sparkle / Status badges */}
      <div className="absolute -top-3 left-6 z-20 flex animate-bounce items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 dark:border-[#42357D]/90 bg-white/95 dark:bg-[#141731]/95 px-3 py-1 shadow-md shadow-[#663CF6]/10 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[#7C3AED] dark:text-[#B99BFF]" />
        <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">24/7 Knowledge Base</span>
      </div>

      <div className="absolute -bottom-2 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#BAE6FD] dark:border-[#1E4670] bg-white/95 dark:bg-[#141731]/95 px-3 py-1 shadow-md shadow-[#0284C7]/10 backdrop-blur-md">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7] dark:text-[#56C2FF]" />
        <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Verified Solutions</span>
      </div>

      <svg
        viewBox="0 0 520 380"
        className="relative z-10 h-auto w-full max-w-[460px] drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="laptopBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="headphoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="bookPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* Ambient shadow */}
        <ellipse cx="260" cy="340" rx="200" ry="24" fill="#1E1B4B" fillOpacity="0.12" />

        {/* Botanical leaf accents */}
        <path d="M110 210 Q 80 180, 75 140 Q 105 160, 110 210 Z" fill="#38BDF8" fillOpacity="0.75" />
        <path d="M90 230 Q 55 200, 50 170 Q 85 190, 90 230 Z" fill="#0EA5E9" fillOpacity="0.5" />
        <path d="M420 230 Q 460 190, 480 160 Q 450 180, 420 230 Z" fill="#38BDF8" fillOpacity="0.75" />
        <path d="M435 260 Q 470 230, 490 210 Q 450 225, 435 260 Z" fill="#0EA5E9" fillOpacity="0.5" />

        {/* Laptop Screen */}
        <rect x="150" y="70" width="280" height="190" rx="16" fill="url(#laptopBody)" stroke="#4338CA" strokeWidth="4" />
        <rect x="162" y="82" width="256" height="166" rx="10" fill="url(#screenGrad)" />

        {/* Question Mark Badge in Screen */}
        <circle cx="290" cy="130" r="26" fill="#EDE9FE" />
        <text
          x="290"
          y="140"
          textAnchor="middle"
          fill="#7C3AED"
          fontSize="30"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          ?
        </text>

        {/* Checklist lines inside laptop */}
        <circle cx="210" cy="180" r="5" fill="#38BDF8" />
        <rect x="225" y="177" width="130" height="6" rx="3" fill="#94A3B8" />

        <circle cx="210" cy="198" r="5" fill="#38BDF8" />
        <rect x="225" y="195" width="115" height="6" rx="3" fill="#CBD5E1" />

        <circle cx="210" cy="216" r="5" fill="#38BDF8" />
        <rect x="225" y="213" width="95" height="6" rx="3" fill="#CBD5E1" />

        {/* Laptop Base */}
        <path d="M110 260 L470 260 L445 285 L135 285 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <rect x="245" y="263" width="90" height="10" rx="3" fill="#94A3B8" fillOpacity="0.6" />

        {/* Stacked Textbooks in Foreground / Left */}
        <rect x="90" y="280" width="160" height="24" rx="4" fill="url(#bookBlue)" stroke="#0369A1" strokeWidth="2" />
        <rect x="94" y="284" width="150" height="4" rx="2" fill="#E0F2FE" />
        <rect x="98" y="254" width="150" height="22" rx="4" fill="url(#bookPurple)" stroke="#6D28D9" strokeWidth="2" />
        <rect x="102" y="258" width="140" height="4" rx="2" fill="#F3E8FF" />

        {/* Customer Support Audio Headphones Over the Laptop */}
        {/* Headband Arch */}
        <path
          d="M170 140 C170 50, 410 50, 410 140"
          stroke="url(#headphoneGrad)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        {/* Left Ear Cushion */}
        <rect x="155" y="125" width="20" height="38" rx="8" fill="#4F46E5" stroke="#312E81" strokeWidth="2" />
        {/* Right Ear Cushion */}
        <rect x="405" y="125" width="20" height="38" rx="8" fill="#4F46E5" stroke="#312E81" strokeWidth="2" />
        {/* Microphone Stem */}
        <path d="M415 155 Q 430 195, 370 205" stroke="#6366F1" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="370" cy="205" r="6" fill="#F59E0B" />
      </svg>
    </div>
  );
}

export function HelpPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState<DetailedHelpArticle | null>(null);
  const [activeTopic, setActiveTopic] = useState<HelpTopic | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<(typeof VIDEO_TUTORIALS)[number]>(
    VIDEO_TUTORIALS[0]!
  );
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [gettingStartedModalOpen, setGettingStartedModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  // Support ticket form state
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Filter popular articles
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return DETAILED_HELP_ARTICLES;
    const q = searchQuery.toLowerCase();
    return DETAILED_HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.overviewText.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return HELP_TOPICS;
    const q = searchQuery.toLowerCase();
    return HELP_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.articles.some((art) => art.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Handle article feedback
  const handleArticleFeedback = (articleId: string, helpful: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [articleId]: helpful }));
    showToast(helpful === "yes" ? "Thanks for your feedback! 👍" : "Thank you! We will improve this guide.");
  };

  // Submit Support Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail || !ticketMessage) {
      showToast("Please fill in your email and message.");
      return;
    }
    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setContactModalOpen(false);
      setTicketName("");
      setTicketEmail("");
      setTicketSubject("");
      setTicketMessage("");
      showToast("🎉 Support ticket submitted! We will respond within 2 business hours.");
    }, 850);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45] dark:text-[#F3F5FF]">
      {/* Luminous Atmospheric Aurora & Wave Background with rich contrast */}
      <AtmosphericBackground />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#7C3AED]/40 bg-white/98 dark:bg-[#141731]/98 px-4 py-3 text-sm font-semibold text-[#08093B] dark:text-[#F3F5FF] shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="h-4 w-4 text-[#7C3AED] dark:text-[#B99BFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER / NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] dark:border-[#2C3159] bg-white/95 dark:bg-[#141731]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Navigation Menu */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#4D5072] dark:text-[#B4B9DA] md:flex">
            <Link href="/features" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Pricing
            </Link>
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              For Schools
            </Link>
            <ResourcesDropdown active={true} />
          </nav>

          {/* Right Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] dark:border-[#8B5CF6] bg-white dark:bg-[#141731] px-3.5 py-1.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs transition hover:border-[#4F27E8] dark:hover:border-[#9D7CFE] hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A]"
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
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] text-[#08093B] dark:text-[#F3F5FF] shadow-sm transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD] md:hidden"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D6DBF0] dark:border-[#2C3159] bg-white/98 dark:bg-[#141731]/98 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg md:hidden">
            <nav className="flex flex-col space-y-3.5 text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
              >
                Pricing
              </Link>
              <Link
                href="/for-schools"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
              >
                For Schools
              </Link>
              <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-[#DFE3F5] dark:border-[#2C3159] pt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] dark:border-[#8B5CF6] bg-white dark:bg-[#141731] py-2.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs"
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* =========================================================================
            2. HERO SECTION (Help Center Badge, Title, Subtitle, Search, Illustration)
            ========================================================================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F8F6FE]/90 dark:via-[#191C3B]/90 to-[#EDE7FF]/80 dark:to-[#251D4A]/85 p-6 sm:p-10 lg:p-12 shadow-[0_16px_40px_rgba(24,18,77,0.08)] backdrop-blur-md">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Content */}
            <div className="space-y-5 lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4C4FE]/80 dark:border-[#42357D]/90 bg-[#EDE7FF] dark:bg-[#251D4A] px-3.5 py-1 text-xs font-extrabold text-[#663CF6] dark:text-[#B59CFF] shadow-xs">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Help Center</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-4xl lg:text-5xl lg:leading-[1.15]">
                Help Center
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
                Find answers, learn how to use the platform, and get the most out of ScholoNix.
              </p>

              {/* Search Bar with Micro-interactions */}
              <div className="relative max-w-lg pt-2">
                <div className="relative flex items-center rounded-2xl border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-1.5 shadow-[0_8px_25px_rgba(24,18,77,0.06)] transition-all focus-within:border-[#7C3AED] dark:focus-within:border-[#9D7CFE] focus-within:ring-3 focus-within:ring-[#7C3AED]/15">
                  <div className="pl-3 pr-2 text-[#8E92BC] dark:text-[#888EB5]">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for help articles, guides, or topics..."
                    className="w-full bg-transparent text-sm font-semibold text-[#08093B] dark:text-[#F3F5FF] placeholder-[#8E92BC] dark:placeholder-[#7A81AC] outline-none"
                    aria-label="Search for help articles"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mr-1 p-1 text-[#8E92BC] dark:text-[#888EB5] hover:text-[#08093B] dark:hover:text-white"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        showToast(`Filtered for: "${searchQuery}"`);
                      }
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#663CF6] text-white shadow-md transition-all hover:scale-105 active:scale-95"
                    aria-label="Submit Search"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {searchQuery && (
                  <p className="mt-2 text-xs font-semibold text-[#663CF6] dark:text-[#B59CFF]">
                    Found {filteredArticles.length} matching article(s) and {filteredTopics.length} topic(s)
                  </p>
                )}
              </div>
            </div>

            {/* Right Artwork (Laptop with Headphones & Question Mark) */}
            <div className="lg:col-span-5">
              <HelpHeroIllustration />
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. QUICK ACCESS CATEGORY CARDS (6-column horizontal row)
            ========================================================================= */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {[
            {
              id: "getting-started",
              title: "Getting Started",
              desc: "Set up your school and get going",
              icon: BookOpen,
            },
            {
              id: "admin-settings",
              title: "Admin & Settings",
              desc: "Manage school configuration",
              icon: Settings,
            },
            {
              id: "students-parents",
              title: "Students & Parents",
              desc: "Add and manage students and parents",
              icon: Users,
            },
            {
              id: "academics",
              title: "Academics",
              desc: "Classes, subjects, timetables and more",
              icon: GraduationCap,
            },
            {
              id: "fees-payments",
              title: "Fees & Payments",
              desc: "Set up fees, collect payments and reports",
              icon: IndianRupee,
            },
            {
              id: "reports-analytics",
              title: "Reports & Analytics",
              desc: "Track performance and generate reports",
              icon: BarChart3,
            },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const topic = HELP_TOPICS.find((t) => t.id === cat.id);
                  if (topic) {
                    setActiveTopic(topic);
                  }
                }}
                className="group flex flex-col items-center rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F3EEFF]/80 dark:to-[#221C4A]/80 p-4 text-center shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_14px_30px_rgba(102,60,246,0.14)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60 transition-transform group-hover:scale-110 group-hover:bg-[#E4DAFF] dark:group-hover:bg-[#332766]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-3 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition-colors leading-tight">
                  {cat.title}
                </span>
                <span className="mt-1 text-[11px] font-medium text-[#7C829E] dark:text-[#969CC2] leading-tight line-clamp-2">
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </section>

        {/* =========================================================================
            4. POPULAR ARTICLES & SIDEBAR (2 Columns)
            ========================================================================= */}
        <section className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Popular Help Articles */}
          <div className="space-y-4 lg:col-span-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
              Popular Help Articles
            </h2>

            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/${article.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-r from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F2FE]/70 dark:to-[#201C45]/70 px-5 py-4 shadow-[0_4px_16px_rgba(24,18,77,0.05)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:bg-[#FAF9FF] dark:hover:bg-[#201C42] hover:shadow-[0_10px_26px_rgba(102,60,246,0.12)]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60 transition-transform group-hover:scale-105">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF] transition-colors group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD]">
                        {article.title}
                      </span>
                      <div className="mt-0.5 text-[11px] font-medium text-[#7C829E] dark:text-[#969CC2]">
                        {article.category} &bull; {article.readTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[#7C829E] dark:text-[#969CC2] transition-transform group-hover:translate-x-1 group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Video Tutorials & Still Need Help */}
          <div className="space-y-6 lg:col-span-4">
            {/* Card 1: Video Tutorials */}
            <div className="rounded-[24px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F2FE]/90 dark:to-[#201C45]/90 p-6 text-center shadow-[0_12px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              {/* Video Monitor graphic */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] shadow-xs">
                <Video className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Video Tutorials
              </h3>

              <p className="mt-1 text-xs font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA]">
                Step-by-step videos to help you set up and use the platform.
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#CDC2F7] dark:border-[#40347A] bg-white dark:bg-[#141731] px-5 py-2.5 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] shadow-xs transition-all hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A] hover:text-[#663CF6] dark:hover:text-[#C4B5FD] hover:scale-105"
                >
                  <span>Watch Tutorials</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Still Need Help? */}
            <div className="rounded-[24px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F3EEFF] dark:to-[#221C4A] p-6 shadow-[0_12px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    Still Need Help?
                  </h3>
                  <p className="text-[11px] font-medium text-[#7C829E] dark:text-[#969CC2]">
                    Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Contact Support</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. BROWSE BY TOPIC (8 Cards Grid)
            ========================================================================= */}
        <section className="mt-16 space-y-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Browse by Topic
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {filteredTopics.map((topic) => {
              const Icon =
                topic.iconType === "rocket"
                  ? Rocket
                  : topic.iconType === "settings"
                  ? Settings
                  : topic.iconType === "users"
                  ? Users
                  : topic.iconType === "academics"
                  ? GraduationCap
                  : topic.iconType === "attendance"
                  ? Calendar
                  : topic.iconType === "fees"
                  ? IndianRupee
                  : topic.iconType === "reports"
                  ? BarChart3
                  : Cloud;

              return (
                <div
                  key={topic.id}
                  className="group relative flex flex-col justify-between rounded-[22px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F3EEFF]/80 dark:to-[#221C4A]/80 p-6 shadow-[0_8px_24px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_16px_36px_rgba(102,60,246,0.14)]"
                >
                  <div className="space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60 transition-transform group-hover:scale-105 group-hover:bg-[#E4DAFF] dark:group-hover:bg-[#332766]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition-colors">
                      {topic.title}
                    </h3>

                    <p className="text-xs font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA]">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#F0F2FA] dark:border-[#23284A]">
                    <button
                      type="button"
                      onClick={() => setActiveTopic(topic)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] transition-colors group-hover:text-[#4F27E8] dark:group-hover:text-[#C4B5FD]"
                    >
                      <span>View Articles</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            6. CALL TO ACTION RIBBON BANNER
            ========================================================================= */}
        <section className="mt-16 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] p-6 sm:p-8 text-white shadow-xl shadow-[#663CF6]/20">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold">
                  New to ScholoNix?
                </h3>
                <p className="text-xs sm:text-sm text-white/90 max-w-xl">
                  Follow our step-by-step guide to set up your school, add users, and start
                  managing your operations with ease.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGettingStartedModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white dark:bg-[#141731] px-5 py-3 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] shadow-md transition-all hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A] hover:scale-105 active:scale-95"
            >
              <span>View Getting Started Guide</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* =========================================================================
          INTERACTIVE MODALS
          ========================================================================= */}

      {/* 1. Article Step-by-Step Reader Modal */}
      {activeArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 sm:p-8 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] dark:text-[#888EB5] transition hover:bg-[#F1F3FB] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="inline-block rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-1 text-xs font-extrabold text-[#663CF6] dark:text-[#B59CFF]">
              {activeArticle.category}
            </span>

            <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {activeArticle.title}
            </h2>

            <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA]">
              {activeArticle.subtitle}
            </p>

            {/* Step-by-Step Guide */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Step-by-Step Instructions</h3>
              {activeArticle.setupSteps.map((step) => (
                <div key={step.number} className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] dark:bg-[#171B38] p-3 text-xs font-medium text-[#374151] dark:text-[#E2E6FF]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#663CF6] text-xs font-bold text-white">
                    {step.number}
                  </span>
                  <div>
                    <strong className="block text-[#08093B] dark:text-[#F3F5FF]">{step.title}</strong>
                    <p className="leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA] mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Full guide link */}
            <div className="mt-5">
              <Link
                href={`/help/${activeArticle.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
              >
                <span>Read Full Step-by-Step Guide Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Was this helpful? */}
            <div className="mt-6 flex items-center justify-between border-t border-[#F0F2FA] dark:border-[#23284A] pt-4">
              <span className="text-xs font-semibold text-[#5A5E7A] dark:text-[#B4B9DA]">Was this article helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleArticleFeedback(activeArticle.id, "yes")}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    feedbackGiven[activeArticle.id] === "yes"
                      ? "border-emerald-300 dark:border-emerald-700/70 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      : "border-[#D6DBF0] dark:border-[#2C3159] text-[#5A5E7A] dark:text-[#B4B9DA] hover:bg-[#F8FAFC] dark:hover:bg-[#1E2248]"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleArticleFeedback(activeArticle.id, "no")}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    feedbackGiven[activeArticle.id] === "no"
                      ? "border-rose-300 dark:border-rose-700/70 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                      : "border-[#D6DBF0] dark:border-[#2C3159] text-[#5A5E7A] dark:text-[#B4B9DA] hover:bg-[#F8FAFC] dark:hover:bg-[#1E2248]"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Topic Articles Modal */}
      {activeTopic && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] dark:text-[#888EB5] transition hover:bg-[#F1F3FB] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {activeTopic.title} ({activeTopic.articleCount} Articles)
            </h2>
            <p className="mt-1 text-xs text-[#5A5E7A] dark:text-[#B4B9DA]">{activeTopic.description}</p>

            <div className="mt-5 space-y-2">
              {activeTopic.articles.map((art, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveTopic(null);
                    const matching = DETAILED_HELP_ARTICLES.find((a) => a.title === art);
                    if (matching) {
                      setActiveArticle(matching);
                    } else {
                      showToast(`Opening guide: "${art}"`);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#D6DBF0]/70 dark:border-[#2C3159]/80 p-3 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:bg-[#FAF9FF] dark:hover:bg-[#201C42] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                >
                  <span>{art}</span>
                  <ChevronRight className="h-4 w-4 text-[#8E92BC] dark:text-[#888EB5]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Video Tutorials Modal */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] dark:text-[#888EB5] transition hover:bg-[#F1F3FB] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[#663CF6] dark:text-[#B59CFF]" />
              <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                School Management Video Academy
              </h2>
            </div>

            {/* Video Player Mockup */}
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#312E81] flex flex-col items-center justify-center text-white p-6 shadow-inner">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:scale-110 cursor-pointer">
                <Play className="h-8 w-8 fill-white translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-center">{activeVideo.title}</h3>
              <p className="text-xs text-white/70 mt-1">{activeVideo.duration} &bull; {activeVideo.views}</p>
            </div>

            {/* Playlist */}
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] dark:text-[#A5ACD2]">
                Tutorial Playlist
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {VIDEO_TUTORIALS.map((vid) => (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setActiveVideo(vid)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                      activeVideo.id === vid.id
                        ? "border-[#663CF6] dark:border-[#8B5CF6] bg-[#EDE7FF] dark:bg-[#251D4A] font-bold text-[#663CF6] dark:text-[#B59CFF]"
                        : "border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF] hover:bg-[#F8FAFC] dark:hover:bg-[#1E2248]"
                    }`}
                  >
                    <span className="line-clamp-1">{vid.title}</span>
                    <span className="text-[11px] text-[#7C829E] dark:text-[#969CC2] shrink-0 ml-2">{vid.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Contact Support Modal */}
      {contactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] dark:text-[#888EB5] transition hover:bg-[#F1F3FB] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-[#663CF6] dark:text-[#B59CFF]" />
              <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Contact Support</h2>
            </div>
            <p className="mt-1 text-xs text-[#5A5E7A] dark:text-[#B4B9DA]">
              We usually respond to institutional inquiries within 2 hours.
            </p>

            <form onSubmit={handleSubmitTicket} className="mt-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Your Name</label>
                <input
                  type="text"
                  required
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  placeholder="e.g. Principal Sharma"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] p-2.5 text-xs text-[#08093B] dark:text-[#F3F5FF] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Official Email</label>
                <input
                  type="email"
                  required
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                  placeholder="admin@yourschool.edu"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] p-2.5 text-xs text-[#08093B] dark:text-[#F3F5FF] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Assistance with timetable generation"
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] p-2.5 text-xs text-[#08093B] dark:text-[#F3F5FF] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">How can we help?</label>
                <textarea
                  rows={3}
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="mt-1 w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] p-2.5 text-xs text-[#08093B] dark:text-[#F3F5FF] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingTicket ? "Submitting Ticket..." : "Submit Support Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Getting Started Checklist Modal */}
      {gettingStartedModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setGettingStartedModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8E92BC] dark:text-[#888EB5] transition hover:bg-[#F1F3FB] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[#663CF6] dark:text-[#B59CFF]" />
              <h2 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                School Quick Start Checklist
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#5A5E7A] dark:text-[#B4B9DA]">
              Get your institution up and running in 4 easy steps:
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Register your school profile and upload official school crest",
                "Define academic year, classes (Grade 1-12), and active sections",
                "Import students and guardian records via CSV bulk template",
                "Configure tuition fee structures and enable online payments",
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-[#D6DBF0]/80 dark:border-[#2C3159]/90 p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF]">{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Link
                href="/register?step=1"
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:scale-105"
              >
                Start Onboarding Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER (Matching Site Standards)
          ========================================================================= */}
      <footer className="mt-20 border-t border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12">
            {/* Logo & Description */}
            <div className="space-y-4 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-xs text-xs font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                A comprehensive, cloud-based school management platform to simplify and streamline your school operations.
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  aria-label="YouTube"
                >
                  <Youtube className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  aria-label="Facebook"
                >
                  <Facebook className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  aria-label="Instagram"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Product
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                <li>
                  <Link href="/features" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/for-schools" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="/features#integrations" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Resources
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                <li>
                  <Link href="/blog" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-[#663CF6] dark:text-[#B59CFF] font-bold">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Company
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                <li>
                  <Link href="/#about" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="/#privacy" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/#terms" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated Newsletter */}
            <div className="space-y-3 sm:col-span-2 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Stay Updated
              </h4>
              <p className="text-xs text-[#5A5E7A] dark:text-[#B4B9DA]">
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
                  className="w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] py-2 pr-10 pl-3 text-xs text-[#08093B] dark:text-[#F3F5FF] placeholder-[#8E92BC] dark:placeholder-[#7A81AC] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE]"
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
          <div className="mt-8 flex flex-col items-center justify-between border-t border-[#F0F2FA] dark:border-[#23284A] pt-6 text-xs text-[#5A5E7A] dark:text-[#B4B9DA] sm:flex-row">
            <p>&copy; 2026 ScholoNix. All rights reserved.</p>
            <p className="mt-2 flex items-center gap-1 sm:mt-0">
              <span className="text-rose-500 dark:text-rose-400">&hearts;</span> Made for Schools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
