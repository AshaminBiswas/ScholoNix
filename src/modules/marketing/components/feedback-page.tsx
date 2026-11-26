"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Menu,
  X,
  Heart,
  Lightbulb,
  Bug,
  Layout,
  Briefcase,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";

type FeedbackCategory =
  | "General Experience"
  | "Feature Request"
  | "Bug Report"
  | "Design & Usability"
  | "Administration & Billing";

interface CategoryOption {
  id: FeedbackCategory;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  ringColor: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "General Experience",
    title: "General Experience",
    desc: "Your overall thoughts on using ScholoNix daily",
    icon: Heart,
    accentColor: "text-[#663CF6] dark:text-[#B59CFF]",
    bgLight: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    ringColor: "ring-[#DDD6FE] dark:ring-[#3B306E]",
  },
  {
    id: "Feature Request",
    title: "Feature Request",
    desc: "Suggest a tool, workflow, or shortcut you need",
    icon: Lightbulb,
    accentColor: "text-[#0284C7] dark:text-[#56C2FF]",
    bgLight: "bg-[#E0F2FE] dark:bg-[#132645]",
    ringColor: "ring-[#BAE6FD] dark:ring-[#1E4670]",
  },
  {
    id: "Bug Report",
    title: "Bug or Glitch Report",
    desc: "Report an issue, error banner, or unexpected glitch",
    icon: Bug,
    accentColor: "text-[#DC2626] dark:text-[#FB7185]",
    bgLight: "bg-[#FEE2E2] dark:bg-[#331624]",
    ringColor: "ring-[#FECACA] dark:ring-[#6E273B]",
  },
  {
    id: "Design & Usability",
    title: "Design & Usability",
    desc: "Feedback on clarity, colors, layouts, or speed",
    icon: Layout,
    accentColor: "text-[#7C3AED] dark:text-[#B99BFF]",
    bgLight: "bg-[#F5F3FF] dark:bg-[#221B44]",
    ringColor: "ring-[#DDD6FE] dark:ring-[#3B306E]",
  },
  {
    id: "Administration & Billing",
    title: "Administration & Billing",
    desc: "Subscription, fee receipts, or licensing questions",
    icon: Briefcase,
    accentColor: "text-[#D97706] dark:text-[#FBBF24]",
    bgLight: "bg-[#FEF3C7] dark:bg-[#2B2010]",
    ringColor: "ring-[#FDE68A] dark:ring-[#6E4F1A]",
  },
];

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: "Needs Significant Work", emoji: "🙁", color: "text-red-500 dark:text-rose-400" },
  2: { text: "Could Be Better", emoji: "😐", color: "text-amber-500 dark:text-amber-400" },
  3: { text: "Good & Useful", emoji: "🙂", color: "text-blue-500 dark:text-[#60A5FA]" },
  4: { text: "Very Good Experience", emoji: "😊", color: "text-[#663CF6] dark:text-[#B59CFF]" },
  5: { text: "Outstanding & Essential!", emoji: "🌟", color: "text-emerald-600 dark:text-emerald-400" },
};

const COMMUNITY_CHANGELOG = [
  {
    tag: "Shipped in v2.4",
    title: "Bulk WhatsApp Fee Receipts",
    origin: "Suggested by 38+ School Accountants & Principals",
    desc: "Instant automated WhatsApp receipt dispatch directly to parent mobile numbers upon fee payment.",
    icon: CheckCircle2,
    badgeBg: "bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80]",
  },
  {
    tag: "Shipped in v2.3",
    title: "One-Click CBSE Term Grade Sheet Generator",
    origin: "Suggested by St. Jude's High School & DPS Mathura",
    desc: "Fully automated grading formula calculation adhering to standard 9-point board criteria.",
    icon: CheckCircle2,
    badgeBg: "bg-[#E0F2FE] dark:bg-[#132645] text-[#0284C7] dark:text-[#56C2FF]",
  },
  {
    tag: "Shipped in v2.2",
    title: "Single Sign-On for Multi-Child Parents",
    origin: "Suggested by Over 120 Parent Users",
    desc: "Seamless one-tap switching between siblings across different grades without logging out.",
    icon: CheckCircle2,
    badgeBg: "bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]",
  },
];

const DEFAULT_RATING_INFO = { text: "Outstanding & Essential!", emoji: "🌟", color: "text-emerald-600 dark:text-emerald-400" };

export function FeedbackPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<FeedbackCategory>("General Experience");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [moduleUsed, setModuleUsed] = useState("Overall Platform Experience");
  const [role, setRole] = useState("School Principal / Administrator");
  const [schoolName, setSchoolName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [email, setEmail] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [serverError, setServerError] = useState("");

  // Newsletter in footer
  const [footerEmail, setFooterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!feedbackText.trim() || feedbackText.trim().length < 5) {
      errors.feedbackText = "Please write at least 5 characters sharing your feedback";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address if providing contact info";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const payload = {
        category,
        rating,
        module: moduleUsed,
        feedback: feedbackText,
        role,
        email: email.trim() || undefined,
        schoolName: schoolName.trim() || undefined,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          const mappedErrors: Record<string, string> = {};
          for (const key in data.errors) {
            mappedErrors[key] = data.errors[key][0];
          }
          setFormErrors(mappedErrors);
        }
        setServerError(data.message || "Failed to submit feedback. Please try again.");
      } else {
        setSubmitSuccess(true);
        setReferenceId(data.referenceId || `FDBK-${Date.now().toString().slice(-6)}`);
      }
    } catch {
      setServerError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFeedbackText("");
    setEmail("");
    setSchoolName("");
    setFormErrors({});
    setSubmitSuccess(false);
    setReferenceId("");
  };

  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setFooterEmail("");
    }
  };

  const activeRating = hoverRating || rating;
  const currentRatingInfo = RATING_LABELS[activeRating] ?? DEFAULT_RATING_INFO;

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45] dark:text-[#F3F5FF]">
      {/* Background Ambience */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] dark:border-[#2C3159] bg-white/95 dark:bg-[#141731]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4D5072] dark:text-[#B4B9DA] md:flex">
            <Link href="/features" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Pricing
            </Link>
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              For Schools
            </Link>
            <ResourcesDropdown />
            <Link href="/contact" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Contact
            </Link>
            {/* Active Feedback Pill */}
            <Link
              href="/feedback"
              className="rounded-full bg-[#8B5CF6] px-4 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED]"
            >
              Feedback
            </Link>
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
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

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] text-[#08093B] dark:text-[#F3F5FF] shadow-sm transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D6DBF0] dark:border-[#2C3159] bg-white/98 dark:bg-[#141731]/98 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg md:hidden">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
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

              {/* Mobile Resources Menu */}
              <div className="rounded-[10px] bg-[#FAF8FE] dark:bg-[#10132C] p-2">
                <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
              </div>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
              >
                Contact Us
              </Link>
              <Link
                href="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-2 font-bold text-[#663CF6] dark:text-[#B59CFF]"
              >
                Share Feedback
              </Link>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-[12px] border border-[#7C3AED] dark:border-[#8B5CF6] bg-white dark:bg-[#141731] text-sm font-bold text-[#4F27E8] dark:text-[#C4B5FD]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register?step=1"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] to-[#4F27E8] text-sm font-bold text-white shadow-md"
                >
                  Get Started Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] dark:border-[#3B306E] bg-gradient-to-r from-[#EDE7FF] dark:from-[#231B47] via-[#F6F2FF] dark:via-[#1D1940] to-[#EDE7FF] dark:to-[#251D4A] px-3.5 py-1.5 shadow-xs transition-all duration-300 hover:scale-105">
            <Sparkles className="h-4 w-4 text-[#663CF6] dark:text-[#B59CFF]" />
            <span className="text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
              Your Voice Drives Our Product Roadmap
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-4xl md:text-5xl lg:text-[2.75rem] leading-tight">
            Help Us Shape the{" "}
            <span className="bg-gradient-to-r from-[#663CF6] dark:from-[#A98BFF] via-[#7C3AED] dark:via-[#C4B5FD] to-[#4F27E8] dark:to-[#B99BFF] bg-clip-text text-transparent">
              Future of ScholoNix
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base md:text-lg max-w-2xl mx-auto font-medium">
            Whether you have an idea for a feature, want to report an unexpected glitch, or wish to
            rate your daily experience—our engineering team reviews every single comment.
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. CATEGORY SELECTION CARDS
          ========================================================================= */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4D5072] dark:text-[#B4B9DA]">
              Select What You&apos;d Like to Share
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`group relative flex flex-col items-center justify-center rounded-[18px] border p-4 text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#663CF6] dark:border-[#8B5CF6] bg-gradient-to-b from-[#EDE7FF]/70 dark:from-[#261E52]/80 to-white dark:to-[#141731] shadow-[0_8px_24px_rgba(102,60,246,0.18)] scale-[1.03] ring-2 ring-[#663CF6]/30"
                      : "border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] hover:border-[#9B76FF] dark:hover:border-[#B59CFF] hover:bg-[#FAF8FE] dark:hover:bg-[#1B1F40] shadow-xs hover:-translate-y-0.5"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${cat.bgLight} ${cat.accentColor} ring-1 ${cat.ringColor} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className={`mt-2.5 text-xs font-extrabold ${
                      isSelected ? "text-[#4F27E8] dark:text-[#C4B5FD]" : "text-[#08093B] dark:text-[#F3F5FF]"
                    }`}
                  >
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#5A5E7A] dark:text-[#B4B9DA] leading-tight line-clamp-2">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MAIN FEEDBACK FORM
          ========================================================================= */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-6 sm:p-8 md:p-10 shadow-[0_12px_36px_rgba(24,18,77,0.06)]">
            {/* Top Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#0284C7]" />

            {submitSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] ring-8 ring-[#DCFCE7]/40 dark:ring-[#164234]/50 animate-bounce">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">Feedback Submitted!</h3>
                <p className="mx-auto max-w-md text-sm text-[#4D5072] dark:text-[#B4B9DA] leading-relaxed">
                  Thank you for contributing to ScholoNix. Your input has been logged and assigned
                  to our product engineering roadmap.
                </p>
                <div className="inline-block rounded-[12px] border border-[#DDD6FE] dark:border-[#3B306E] bg-[#F6F2FF] dark:bg-[#221B44] px-4 py-2 text-xs font-mono font-bold text-[#663CF6] dark:text-[#B59CFF]">
                  Reference ID: {referenceId}
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-[12px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-5 py-2.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52]"
                  >
                    Submit Additional Feedback
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 border-b border-[#DFE3F5]/80 dark:border-[#2C3159]/90 pb-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-1 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                      {category}
                    </span>
                    <span className="text-xs text-[#76799C] dark:text-[#969CC2]">· Community Feedback Form</span>
                  </div>
                  <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    How Would You Rate Your Experience?
                  </h2>

                  {/* Interactive Star / Sentiment Rating */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-[16px] bg-[#FAF8FE] dark:bg-[#10132C] border border-[#DDD6FE]/60 dark:border-[#3B306E]/70 p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = starVal <= activeRating;
                        return (
                          <button
                            type="button"
                            key={starVal}
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            aria-label={`Rate ${starVal} out of 5 stars`}
                            className="p-1 transition-transform duration-150 hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                                isFilled
                                  ? "fill-[#F59E0B] text-[#F59E0B] dark:text-[#FBBF24] drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                                  : "text-[#CAD0EB] dark:text-[#666D99] hover:text-[#F59E0B] dark:hover:text-amber-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-[#DFE3F5] dark:border-[#2C3159] pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-base mr-1.5">{currentRatingInfo.emoji}</span>
                      <span className={`text-xs sm:text-sm font-bold ${currentRatingInfo.color}`}>
                        {currentRatingInfo.text}
                      </span>
                    </div>
                  </div>
                </div>

                {serverError && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-[12px] border border-red-200 dark:border-rose-800/70 bg-red-50 dark:bg-red-950/45 p-3.5 text-xs text-red-700 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500 dark:text-rose-400" />
                    <span>{serverError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                  {/* Module & Role Row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="moduleUsed"
                        className="block text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF] mb-1.5"
                      >
                        Which Module / Area?
                      </label>
                      <select
                        id="moduleUsed"
                        value={moduleUsed}
                        onChange={(e) => setModuleUsed(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] dark:text-[#F3F5FF] transition-all hover:border-[#9B76FF] dark:hover:border-[#B59CFF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 cursor-pointer"
                      >
                        <option>Overall Platform Experience</option>
                        <option>Student Attendance & Leave</option>
                        <option>Exams, Marks & Report Cards</option>
                        <option>Fee Management & Invoicing</option>
                        <option>Class Scheduling & Timetable</option>
                        <option>Parent & Student Mobile Portal</option>
                        <option>Staff & Teacher Administration</option>
                        <option>Reports, Analytics & Exports</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="role"
                        className="block text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF] mb-1.5"
                      >
                        Your Role
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] dark:text-[#F3F5FF] transition-all hover:border-[#9B76FF] dark:hover:border-[#B59CFF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 cursor-pointer"
                      >
                        <option>School Principal / Administrator</option>
                        <option>Teacher / Subject Educator</option>
                        <option>Parent / Guardian</option>
                        <option>Student</option>
                        <option>IT / Systems Coordinator</option>
                        <option>Accountant / Cashier</option>
                        <option>EdTech Consultant / Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="feedbackText"
                        className="block text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]"
                      >
                        Your Comments or Suggestion <span className="text-red-500 dark:text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-[#76799C] dark:text-[#969CC2]">
                        {feedbackText.length}/2500
                      </span>
                    </div>
                    <textarea
                      id="feedbackText"
                      rows={5}
                      value={feedbackText}
                      onChange={(e) => {
                        setFeedbackText(e.target.value);
                        if (formErrors.feedbackText) {
                          setFormErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.feedbackText;
                            return copy;
                          });
                        }
                      }}
                      maxLength={2500}
                      placeholder={
                        category === "Feature Request"
                          ? "Describe the feature you'd love to see: What problem does it solve? How should it work?"
                          : category === "Bug Report"
                          ? "What happened, and what did you expect? Steps to reproduce or error message details are very helpful."
                          : "Share what works well, what feels slow, or any ideas you have to improve our platform..."
                      }
                      required
                      className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] dark:text-[#F3F5FF] transition-all placeholder:text-[#76799C] dark:placeholder:text-[#7A81AC] focus:outline-none focus:ring-2 ${
                        formErrors.feedbackText
                          ? "border-red-400 dark:border-rose-500/70 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-400/30"
                          : "border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] hover:border-[#9B76FF] dark:hover:border-[#B59CFF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:ring-[#663CF6]/20"
                      }`}
                    />
                    {formErrors.feedbackText && (
                      <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-rose-400">
                        {formErrors.feedbackText}
                      </p>
                    )}
                  </div>

                  {/* School Name & Email Row (Optional) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="schoolName"
                        className="block text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF] mb-1.5"
                      >
                        School Name <span className="text-xs font-normal text-[#76799C] dark:text-[#969CC2]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Modern Public School"
                        className="w-full rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] dark:text-[#F3F5FF] transition-all placeholder:text-[#76799C] dark:placeholder:text-[#7A81AC] hover:border-[#9B76FF] dark:hover:border-[#B59CFF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF] mb-1.5"
                      >
                        Your Email <span className="text-xs font-normal text-[#76799C] dark:text-[#969CC2]">(For follow-up)</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) {
                            setFormErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.email;
                              return copy;
                            });
                          }
                        }}
                        placeholder="educator@school.edu"
                        className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] dark:text-[#F3F5FF] transition-all placeholder:text-[#76799C] dark:placeholder:text-[#7A81AC] focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? "border-red-400 dark:border-rose-500/70 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-400/30"
                            : "border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] hover:border-[#9B76FF] dark:hover:border-[#B59CFF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:ring-[#663CF6]/20"
                        }`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-rose-400">
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 hover:from-[#6D28D9] hover:to-[#3730A3] hover:shadow-lg disabled:opacity-70 active:scale-[0.99] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting Your Feedback...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Feedback</span>
                          <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-[#76799C] dark:text-[#969CC2]">
                      ✨ Every message is reviewed by our engineering and UX team.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. COMMUNITY ROADMAP / YOU SPOKE, WE BUILT
          ========================================================================= */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <span className="rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-3.5 py-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
              You Spoke, We Built
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl">
              Recent Features Inspired by Community Feedback
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#4D5072] dark:text-[#B4B9DA] max-w-xl mx-auto font-medium">
              We release continuous improvements every two weeks based directly on the feedback
              teachers and school managers submit right here.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            {COMMUNITY_CHANGELOG.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-[20px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#9B76FF] dark:hover:border-[#B59CFF] hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.badgeBg}`}>
                      {item.tag}
                    </span>
                    <Icon className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold text-[#663CF6] dark:text-[#B59CFF]">
                    {item.origin}
                  </p>
                  <p className="mt-2 text-xs text-[#4D5072] dark:text-[#B4B9DA] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOOTER
          ========================================================================= */}
      <footer
        id="support"
        className="border-t border-[#D6DBF0] dark:border-[#2C3159] bg-[#FAFBFF] dark:bg-[#10132C] pt-12 pb-8 sm:pt-16 sm:pb-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 sm:gap-10">
            {/* Brand column */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] font-medium">
                A comprehensive, cloud-based school management platform to simplify and streamline
                your school operations.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2.5 pt-1 text-[#4D5072] dark:text-[#B4B9DA]">
                <a
                  href="#linkedin"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] dark:border-[#3E3275] bg-[#F2EEFD] dark:bg-[#251D4A] text-[#4F27E8] dark:text-[#C4B5FD] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#youtube"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] dark:border-[#3E3275] bg-[#F2EEFD] dark:bg-[#251D4A] text-[#4F27E8] dark:text-[#C4B5FD] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] dark:border-[#3E3275] bg-[#F2EEFD] dark:bg-[#251D4A] text-[#4F27E8] dark:text-[#C4B5FD] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] dark:border-[#3E3275] bg-[#F2EEFD] dark:bg-[#251D4A] text-[#4F27E8] dark:text-[#C4B5FD] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
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
                  <Link href="#integrations" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
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
                  <Link href="/help" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
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
                  <Link href="#about" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] text-[#663CF6] dark:text-[#B59CFF] font-bold">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="#privacy" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated Column */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Stay Updated
              </h4>
              <p className="text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleFooterSubscribe} className="flex gap-1.5 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3 py-2 text-xs text-[#1B1D45] dark:text-[#F3F5FF] shadow-xs placeholder:text-[#76799C] dark:placeholder:text-[#7A81AC] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                />
                <button
                  type="submit"
                  aria-label="Submit newsletter"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#663CF6] text-white shadow-sm transition hover:bg-[#4F27E8]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              {newsletterSubscribed && (
                <p className="text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DFE3F5] dark:border-[#2C3159] pt-6 text-xs text-[#4D5072] dark:text-[#B4B9DA] sm:flex-row">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} ScholoNix. All rights reserved.
            </p>
            <div className="flex items-center gap-1 font-bold text-[#1B1D45] dark:text-[#F3F5FF]">
              <span className="text-red-500 dark:text-rose-400">❤️</span> Made for Schools
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
