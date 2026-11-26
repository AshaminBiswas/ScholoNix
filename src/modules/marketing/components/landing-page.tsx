"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Check,
  Sparkles,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  BookOpen,
  Cloud,
  MessageSquare,
  Trophy,
  Building,
  School as SchoolIcon,
  Star,
  CheckCircle2,
  Send,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchoolIllustration } from "@/modules/schools/components/school-illustration";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { HeroDashboardVisual } from "./hero-dashboard-visual";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface FeatureModuleConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
  topStripe: string;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  titleHover: string;
}

const FEATURE_MODULES: FeatureModuleConfig[] = [
  {
    title: "Admissions",
    description: "Manage enquiries, applications and student admissions easily.",
    icon: Users,
    borderColor: "border-[#DDD6FE]/90 dark:border-[#3B306E]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F6F2FF]/85 dark:via-[#1D1940]/85 to-[#EDE7FF]/70 dark:to-[#251D4A]/75",
    shadow: "shadow-[0_8px_24px_rgba(124,58,237,0.06)]",
    hoverBorder: "hover:border-[#7C3AED] dark:hover:border-[#9D7CFE]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(124,58,237,0.18)]",
    topStripe: "from-[#7C3AED] to-[#A78BFA]",
    iconBg: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    iconColor: "text-[#5824EE] dark:text-[#B59CFF]",
    iconRing: "ring-[#D4C4FE] dark:ring-[#42357D]",
    titleHover: "group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD]",
  },
  {
    title: "Academics",
    description: "Handle classes, subjects, timetables and lesson plans.",
    icon: GraduationCap,
    borderColor: "border-[#BAE6FD]/90 dark:border-[#1E4670]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F0F8FF]/85 dark:via-[#12223D]/85 to-[#E0F2FE]/70 dark:to-[#14294A]/75",
    shadow: "shadow-[0_8px_24px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7] dark:hover:border-[#38BDF8]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(2,132,199,0.18)]",
    topStripe: "from-[#0284C7] to-[#38BDF8]",
    iconBg: "bg-[#DDF0FF] dark:bg-[#132645]",
    iconColor: "text-[#0E74CE] dark:text-[#56C2FF]",
    iconRing: "ring-[#BAE0FD] dark:ring-[#1E4670]",
    titleHover: "group-hover:text-[#0E74CE] dark:group-hover:text-[#7DD3FC]",
  },
  {
    title: "Attendance",
    description: "Track daily attendance for students and staff.",
    icon: Calendar,
    borderColor: "border-[#BBF7D0]/90 dark:border-[#1B5742]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F0FDF4]/85 dark:via-[#0F2620]/85 to-[#DCFCE7]/70 dark:to-[#102E25]/75",
    shadow: "shadow-[0_8px_24px_rgba(22,163,74,0.06)]",
    hoverBorder: "hover:border-[#16A34A] dark:hover:border-[#4ADE80]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(22,163,74,0.18)]",
    topStripe: "from-[#16A34A] to-[#4ADE80]",
    iconBg: "bg-[#DCFCE7] dark:bg-[#0F2C24]",
    iconColor: "text-[#15803D] dark:text-[#4ADE80]",
    iconRing: "ring-[#BBF7D0] dark:ring-[#1B5742]",
    titleHover: "group-hover:text-[#15803D] dark:group-hover:text-[#86EFAC]",
  },
  {
    title: "Fees & Payments",
    description: "Collect fees online, track dues and generate receipts.",
    icon: CreditCard,
    borderColor: "border-[#FDE68A]/90 dark:border-[#6E4F1A]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FFFBEB]/85 dark:via-[#261E10]/85 to-[#FEF3C7]/70 dark:to-[#2E2210]/75",
    shadow: "shadow-[0_8px_24px_rgba(217,119,6,0.06)]",
    hoverBorder: "hover:border-[#D97706] dark:hover:border-[#FBBF24]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(217,119,6,0.18)]",
    topStripe: "from-[#D97706] to-[#FBBF24]",
    iconBg: "bg-[#FFF0D5] dark:bg-[#2B2010]",
    iconColor: "text-[#B45309] dark:text-[#FBBF24]",
    iconRing: "ring-[#FDE68A] dark:ring-[#6E4F1A]",
    titleHover: "group-hover:text-[#B45309] dark:group-hover:text-[#FCD34D]",
  },
  {
    title: "Staff Management",
    description: "Manage staff details, roles and responsibilities.",
    icon: BookOpen,
    borderColor: "border-[#FECDD3]/90 dark:border-[#6E273B]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FFF1F2]/85 dark:via-[#291422]/85 to-[#FFE4E6]/70 dark:to-[#331725]/75",
    shadow: "shadow-[0_8px_24px_rgba(225,29,72,0.06)]",
    hoverBorder: "hover:border-[#E11D48] dark:hover:border-[#FB7185]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(225,29,72,0.18)]",
    topStripe: "from-[#E11D48] to-[#FB7185]",
    iconBg: "bg-[#FFE4EF] dark:bg-[#301730]",
    iconColor: "text-[#DB2777] dark:text-[#F472B6]",
    iconRing: "ring-[#FBCFE8] dark:ring-[#63264D]",
    titleHover: "group-hover:text-[#DB2777] dark:group-hover:text-[#F9A8D4]",
  },
  {
    title: "Parents & Communication",
    description: "Keep parents informed with notices, alerts and updates.",
    icon: MessageSquare,
    borderColor: "border-[#C7D2FE]/90 dark:border-[#343E7D]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#EEF2FF]/85 dark:via-[#191D42]/85 to-[#E0E7FF]/70 dark:to-[#1F2554]/70",
    shadow: "shadow-[0_8px_24px_rgba(79,70,229,0.06)]",
    hoverBorder: "hover:border-[#4F46E5] dark:hover:border-[#818CF8]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(79,70,229,0.18)]",
    topStripe: "from-[#4F46E5] to-[#818CF8]",
    iconBg: "bg-[#F2EEFD] dark:bg-[#251D4A]",
    iconColor: "text-[#4F27E8] dark:text-[#C4B5FD]",
    iconRing: "ring-[#DDD2FE] dark:ring-[#3B306E]",
    titleHover: "group-hover:text-[#4F27E8] dark:group-hover:text-[#C4B5FD]",
  },
  {
    title: "Reports & Analytics",
    description: "Get insightful reports for better decision making.",
    icon: BarChart3,
    borderColor: "border-[#99F6E4]/90 dark:border-[#195452]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F0FDFA]/85 dark:via-[#10272E]/85 to-[#CCFBF1]/70 dark:to-[#113038]/75",
    shadow: "shadow-[0_8px_24px_rgba(13,148,136,0.06)]",
    hoverBorder: "hover:border-[#0D9488] dark:hover:border-[#2DD4BF]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(13,148,136,0.18)]",
    topStripe: "from-[#0D9488] to-[#2DD4BF]",
    iconBg: "bg-[#CCFBF1] dark:bg-[#102B33]",
    iconColor: "text-[#0F766E] dark:text-[#34D399]",
    iconRing: "ring-[#99F6E4] dark:ring-[#195452]",
    titleHover: "group-hover:text-[#0F766E] dark:group-hover:text-[#5EEAD4]",
  },
  {
    title: "Cloud & Secure",
    description: "Access anytime, anywhere with enterprise-grade security.",
    icon: Cloud,
    borderColor: "border-[#A5F3FC]/90 dark:border-[#195063]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#ECFEFF]/85 dark:via-[#102730]/85 to-[#CFFAFE]/70 dark:to-[#122F3A]/75",
    shadow: "shadow-[0_8px_24px_rgba(8,145,178,0.06)]",
    hoverBorder: "hover:border-[#0891B2] dark:hover:border-[#22D3EE]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(8,145,178,0.18)]",
    topStripe: "from-[#0891B2] to-[#38BDF8]",
    iconBg: "bg-[#CFFAFE] dark:bg-[#102B33]",
    iconColor: "text-[#0891B2] dark:text-[#38D6DC]",
    iconRing: "ring-[#A5F3FC] dark:ring-[#195063]",
    titleHover: "group-hover:text-[#0891B2] dark:group-hover:text-[#67E8F9]",
  },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [cardsInView, setCardsInView] = useState(false);
  const [featuresInView, setFeaturesInView] = useState(false);
  const [visibleFeatureCards, setVisibleFeatureCards] = useState<boolean[]>(
    Array(8).fill(false)
  );
  const trustedSectionRef = useRef<HTMLElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCardsInView(true);
      setFeaturesInView(true);
      setVisibleFeatureCards(Array(8).fill(true));
      return;
    }

    // In automated testing environments (Playwright / WebDriver), reveal immediately
    if (typeof navigator !== "undefined" && navigator.webdriver) {
      setCardsInView(true);
      setFeaturesInView(true);
      setVisibleFeatureCards(Array(8).fill(true));
      return;
    }

    const trustedObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setCardsInView(true);
        } else if (entry && entry.boundingClientRect.top > window.innerHeight) {
          setCardsInView(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (trustedSectionRef.current) {
      trustedObserver.observe(trustedSectionRef.current);
    }

    const featuresObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setFeaturesInView(true);
        } else if (entry && entry.boundingClientRect.top > window.innerHeight) {
          // If user scrolls back up above Key Features, reset so it re-animates on scroll down
          setFeaturesInView(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    if (featuresSectionRef.current) {
      featuresObserver.observe(featuresSectionRef.current);
    }

    // Individual Feature Card Scroll Observer
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
          } else if (entry.boundingClientRect.top > window.innerHeight) {
            // When user scrolls back up above this card, reset so it re-animates on scrolling back down
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
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    featureCardRefs.current.forEach((el) => {
      if (el) cardObserver.observe(el);
    });

    return () => {
      trustedObserver.disconnect();
      featuresObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45] dark:text-[#F3F5FF]">
      {/* Luminous Atmospheric Aurora & Wave Background with rich contrast */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR (With Responsive Mobile Drawer)
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
            <ResourcesDropdown />
          </nav>

          {/* Right Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] dark:border-[#8B5CF6] bg-white dark:bg-[#141731] px-3 py-1.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs transition hover:border-[#4F27E8] dark:hover:border-[#9D7CFE] hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A]"
            >
              Sign In
            </Link>
            <Link
              href="/register?step=1"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-[#6D28D9] hover:to-[#3730A3]"
            >
              Register Now
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
                Register Now &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Fluid Typography & Mobile-Stacked Actions)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Headlines & CTAs */}
            <div className="space-y-5 sm:space-y-6 lg:col-span-6">
              {/* Badge */}
              <div className="animate-hero-badge inline-flex items-center gap-2 rounded-full border border-[#BFA8FF] dark:border-[#5343A1] bg-[#EDE7FF] dark:bg-[#251D4A] px-3.5 py-1 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  All-in-One School Management Platform
                </span>
              </div>

              {/* Main Headline with fluid typography & loading animation */}
              <h1 className="animate-hero-headline text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-5xl lg:text-6xl leading-[1.14]">
                Run Your School <br />
                <span className="text-[#08093B] dark:text-[#F3F5FF]">Smarter, Simpler</span> <br />
                <span className="bg-gradient-to-r from-[#663CF6] dark:from-[#A98BFF] via-[#4F27E8] dark:via-[#C4B5FD] to-[#1683E8] dark:to-[#38BDF8] bg-clip-text text-transparent animate-gradient-flow">
                  and More Efficiently
                </span>
              </h1>

              {/* Subtitle */}
              <p className="animate-hero-subtitle max-w-xl text-sm leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] font-medium sm:text-base lg:text-lg">
                A complete cloud-based school management solution to manage admissions,
                students, academics, attendance, fees, staff and more — all in one place.
              </p>

              {/* CTA Buttons (Smooth entrance animation & interactive hover effects) */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Link
                  id="hero-register-btn"
                  href="/register?step=1"
                  className="animate-hero-btn-primary group relative overflow-hidden inline-flex w-full sm:w-auto items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-6 py-3.5 sm:py-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:from-[#6D28D9] hover:to-[#3730A3] hover:shadow-[0_6px_22px_rgba(102,60,246,0.42)] hover:scale-105 active:scale-[0.98]"
                >
                  <span className="relative z-10">Register Now &rarr;</span>
                  {/* Subtle Shimmer Ray */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-btn-shimmer" />
                </Link>
                <Link
                  id="hero-pricing-btn"
                  href="/pricing"
                  className="animate-hero-btn-secondary inline-flex w-full sm:w-auto items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] dark:border-[#8B5CF6] bg-white dark:bg-[#141731] px-6 py-3.5 sm:py-4 text-sm font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs transition-all duration-200 hover:border-[#4F27E8] dark:hover:border-[#9D7CFE] hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A] hover:scale-105 active:scale-[0.98]"
                >
                  View Pricing
                </Link>
              </div>

              {/* Value Points with accessible high-contrast checks */}
              <div className="animate-hero-checklist flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Quick Setup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>No Coding Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Secure & Reliable</span>
                </div>
              </div>
            </div>

            {/* Right Column: Animated Live Interactive Dashboard Mockup */}
            <HeroDashboardVisual />
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SOCIAL PROOF / TRUSTED BY SCHOOLS SECTION
          Featuring completely transparent background & scroll-animated cards
          ========================================================================= */}
      <section
        ref={trustedSectionRef}
        className="relative bg-transparent py-10 sm:py-14 overflow-hidden border-y border-[#D6DBF0]/40 dark:border-[#2C3159]/50"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-7 sm:mb-9 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] dark:border-[#3B306E] bg-white/80 dark:bg-[#141731]/80 px-3 py-1 text-xs font-bold text-[#5824EE] dark:text-[#B59CFF] shadow-xs backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-[#8B5CF6] text-[#8B5CF6] dark:text-[#C4B5FD]" />
              <span>Verified Institutions</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-2xl lg:text-3xl">
              Trusted by 1,000+ Schools
            </h2>
            <p className="mt-1.5 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA] sm:text-sm max-w-xl mx-auto">
              Across India for a smarter, simpler, and more efficient school operations
            </p>
          </div>

          {/* 4 Interactive Elevated School Cards with Staggered Scroll-Reveal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {/* 1. Sunrise International School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#BAE6FD]/90 dark:border-[#1E4670]/90 bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#F0F8FF]/85 dark:via-[#12223D]/85 to-[#E0F2FE]/70 dark:to-[#14294A]/75 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(14,116,206,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#0E74CE] dark:hover:border-[#38BDF8] hover:shadow-[0_20px_42px_rgba(14,116,206,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "60ms" : "0ms",
              }}
            >
              {/* Top ambient color bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0284C7] to-[#38BDF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Shimmer light pass effect on hover */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                {/* School Crest Badge with Hover Micro-Interactions */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#DDF0FF] dark:bg-[#132645] text-[#0E74CE] dark:text-[#56C2FF] ring-1 ring-[#93C5FD] dark:ring-[#295591] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-4 group-hover:ring-[#BAE6FD]/60 dark:group-hover:ring-[#29639E]/70">
                  <SchoolIcon className="h-5 w-5 text-[#0E74CE] dark:text-[#56C2FF]" />
                </div>

                {/* Pill Tag */}
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E0F2FE] dark:bg-[#132645] px-2.5 py-0.5 text-[10px] font-bold text-[#0369A1] dark:text-[#56C2FF] ring-1 ring-[#BAE6FD] dark:ring-[#1E4670]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#0284C7] dark:text-[#56C2FF]" />
                  CBSE Affiliated
                </span>
              </div>

              {/* School Info */}
              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#0E74CE] dark:group-hover:text-[#7DD3FC] transition-colors">
                  Sunrise
                </span>
                <span className="block text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                  International School
                </span>
              </div>

              {/* Key Stats Bar */}
              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 dark:border-[#23284A]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] dark:text-[#B4B9DA] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0E74CE] dark:text-[#56C2FF]" />
                  2,450+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
            </div>

            {/* 2. Green Valley Public School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#86EFAC]/90 dark:border-[#20664D]/90 bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#F0FDF4]/85 dark:via-[#0F2620]/85 to-[#DCFCE7]/70 dark:to-[#102E25]/75 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(21,128,61,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#15803D] dark:hover:border-[#4ADE80] hover:shadow-[0_20px_42px_rgba(21,128,61,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "140ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#16A34A] to-[#4ADE80] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] ring-1 ring-[#86EFAC] dark:ring-[#20664D] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-4 group-hover:ring-[#BBF7D0]/60 dark:group-hover:ring-[#20664D]/70">
                  <Building className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-2.5 py-0.5 text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80] ring-1 ring-[#86EFAC] dark:ring-[#20664D]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#16A34A] dark:text-[#4ADE80]" />
                  ICSE Board
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#15803D] dark:group-hover:text-[#86EFAC] transition-colors">
                  Green Valley
                </span>
                <span className="block text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                  Public School
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 dark:border-[#23284A]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] dark:text-[#B4B9DA] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#15803D] dark:text-[#4ADE80]" />
                  1,820+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
            </div>

            {/* 3. Lotus World School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#DDD6FE]/90 dark:border-[#3B306E]/90 bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF5FF]/85 to-[#EDE7FF]/70 dark:to-[#251D4A]/75 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(102,60,246,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_20px_42px_rgba(102,60,246,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "220ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#663CF6] to-[#A78BFA] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#5824EE] dark:text-[#B59CFF] ring-1 ring-[#C4B5FD] dark:ring-[#4B3D91] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-4 group-hover:ring-[#DDD6FE]/60 dark:group-hover:ring-[#5343A1]/70">
                  <Sparkles className="h-5 w-5 text-[#5824EE] dark:text-[#B59CFF]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-2.5 py-0.5 text-[10px] font-bold text-[#5824EE] dark:text-[#B59CFF] ring-1 ring-[#C4B5FD] dark:ring-[#4B3D91]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#5824EE] dark:text-[#B59CFF]" />
                  IB World
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#5824EE] dark:group-hover:text-[#C4B5FD] transition-colors">
                  Lotus
                </span>
                <span className="block text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                  World School
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 dark:border-[#23284A]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] dark:text-[#B4B9DA] flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-[#5824EE] dark:text-[#B59CFF]" />
                  3 Campuses
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  5.0
                </span>
              </div>
            </div>

            {/* 4. Riverside Academy */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#C7D2FE]/90 dark:border-[#343E7D]/90 bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#F2F4FF]/85 dark:via-[#171B40]/85 to-[#E0E7FF]/70 dark:to-[#1F2554]/70 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(79,70,229,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#4338CA] dark:hover:border-[#818CF8] hover:shadow-[0_20px_42px_rgba(67,56,202,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "300ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4F46E5] to-[#818CF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#E0E7FF] dark:bg-[#1F2554] text-[#4338CA] dark:text-[#A5B4FC] ring-1 ring-[#A5B4FC] dark:ring-[#3E4A96] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-4 group-hover:ring-[#C7D2FE]/60 dark:group-hover:ring-[#4857AD]/70">
                  <GraduationCap className="h-5 w-5 text-[#4338CA] dark:text-[#A5B4FC]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] dark:bg-[#1C214A] px-2.5 py-0.5 text-[10px] font-bold text-[#4338CA] dark:text-[#A5B4FC] ring-1 ring-[#A5B4FC] dark:ring-[#3E4A96]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#4338CA] dark:text-[#A5B4FC]" />
                  State Board
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#4338CA] dark:group-hover:text-[#C7D2FE] transition-colors">
                  Riverside
                </span>
                <span className="block text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                  Academy
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 dark:border-[#23284A]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] dark:text-[#B4B9DA] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#4338CA] dark:text-[#A5B4FC]" />
                  1,640+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  4.8
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "KEY FEATURES" / EVERYTHING YOUR SCHOOL NEEDS
          Featuring unique distinct color for each card & scroll animation
          ========================================================================= */}
      <section ref={featuresSectionRef} id="features" className="py-12 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Section Badge */}
          <div
            className={`inline-flex items-center rounded-full border border-[#BFA8FF] dark:border-[#5343A1] bg-[#EDE7FF] dark:bg-[#251D4A] px-3.5 py-1 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] transition-all duration-700 ${
              featuresInView
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            Key Features
          </div>
          <h2
            className={`mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl lg:text-4xl transition-all duration-700 delay-75 ${
              featuresInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            Everything Your School Needs
          </h2>
          <p
            className={`mx-auto mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm font-medium text-[#4D5072] dark:text-[#B4B9DA] lg:text-base transition-all duration-700 delay-150 ${
              featuresInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            Powerful and easy-to-use modules to manage your entire school operations.
          </p>

          {/* 8 Feature Cards Grid with Unique Colors and Individual Dynamic Scroll-Reveal */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 text-left">
            {FEATURE_MODULES.map((item, index) => {
              const Icon = item.icon;
              const isVisible = visibleFeatureCards[index];
              const delayMs = isVisible ? (index % 4) * 85 : 0;

              return (
                <div
                  key={item.title}
                  ref={(el) => {
                    featureCardRefs.current[index] = el;
                  }}
                  data-card-index={index}
                  className={`group relative overflow-hidden rounded-[18px] border ${item.borderColor} ${item.bgGradient} backdrop-blur-sm p-5 ${item.shadow} ${item.hoverBorder} ${item.hoverShadow} cursor-pointer will-change-transform transition-all duration-700 hover:-translate-y-2 hover:scale-[1.02] ${
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-14 scale-[0.93]"
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    transitionDelay: `${delayMs}ms`,
                  }}
                >
                  {/* Top Accent Gradient Stripe that brightens on hover */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.topStripe} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  {/* Shimmer sweep on hover */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

                  {/* Icon with interactive pop and rotation */}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${item.iconBg} ${item.iconColor} ring-1 ${item.iconRing} transition-all duration-500 group-hover:scale-110 ${
                      index % 2 === 0 ? "group-hover:rotate-6" : "group-hover:-rotate-6"
                    } ${
                      isVisible
                        ? "scale-100 rotate-0 opacity-100"
                        : "scale-75 -rotate-6 opacity-70"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`mt-4 text-base font-bold text-[#08093B] dark:text-[#F3F5FF] ${item.titleHover} transition-colors`}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-xs leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. "WHY CHOOSE US" / A MODERN, RELIABLE & SCALABLE SOLUTION
          ========================================================================= */}
      <section id="for-schools" className="py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Vector School Illustration */}
            <div className="mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
              <SchoolIllustration />
            </div>

            {/* Right: Why Choose Us copy & Satisfaction Card */}
            <div className="space-y-5 sm:space-y-6 lg:col-span-7">
              <div className="inline-flex items-center rounded-full border border-[#BFA8FF] dark:border-[#5343A1] bg-[#EDE7FF] dark:bg-[#251D4A] px-3.5 py-1 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
                Why Choose Us
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl lg:text-4xl">
                A Modern, Reliable & Scalable Solution
              </h2>

              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
                {/* Checklist (8 cols on desktop) */}
                <div className="space-y-3.5 sm:col-span-7">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                    <span>All-in-one platform for school management</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                    <span>Simple, user-friendly and quick to set up</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                    <span>Secure, cloud-based and always available</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45] dark:text-[#F3F5FF]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                    <span>Scales with your school&apos;s growing needs</span>
                  </div>
                </div>

                {/* 98% Customer Satisfaction Card (5 cols on desktop, Enhanced Contrast) */}
                <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#B8A4FF] dark:border-[#5343A1] bg-[#EDE7FF] dark:bg-[#251D4A] p-5 sm:p-6 text-center shadow-[0_8px_24px_rgba(102,60,246,0.12)] sm:col-span-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFF0D5] dark:bg-[#2B2010] text-[#B45309] dark:text-[#FBBF24] shadow-sm">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                    98%
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
                    Customer Satisfaction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. "PRICING" / SIMPLE & TRANSPARENT PRICING (Vibrant Strip)
          ========================================================================= */}
      <section id="pricing" className="py-10 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[16px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(24,18,77,0.08)] backdrop-blur-md">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <span className="inline-flex items-center rounded-full border border-[#BFA8FF] dark:border-[#5343A1] bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-0.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
                Pricing
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl">
                Simple & Transparent Pricing
              </h2>
              <p className="mt-1 text-xs text-[#4D5072] dark:text-[#B4B9DA] font-medium sm:text-sm">
                Choose a plan that fits your school&apos;s needs. No hidden charges.
                Cancel anytime.
              </p>
            </div>

            {/* 3-Column Pricing Strip (Distinct contrast gradient) */}
            <div className="grid grid-cols-1 items-center gap-5 sm:gap-6 rounded-[14px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-r from-[#F5F1FE] dark:from-[#1D1940] to-[#EEF5FE] dark:to-[#182245] p-5 sm:p-6 lg:grid-cols-12 shadow-xs">
              {/* Left Price Segment */}
              <div className="text-center sm:text-left lg:col-span-4">
                <span className="text-xs font-bold text-[#4D5072] dark:text-[#B4B9DA]">Starting from</span>
                <div className="mt-0.5 text-3xl sm:text-4xl font-black text-[#4F27E8] dark:text-[#C4B5FD]">
                  ₹1,999
                  <span className="text-sm font-normal text-[#4D5072] dark:text-[#B4B9DA]">/month</span>
                </div>
              </div>

              {/* Middle Features Segment */}
              <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-[#1B1D45] dark:text-[#F3F5FF] sm:grid-cols-2 lg:col-span-5">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Student & Staff Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Attendance & Academics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Fees & Online Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <span>Reports & Communication</span>
                </div>
              </div>

              {/* Right CTA Button Segment */}
              <div className="text-center lg:col-span-3 lg:text-right">
                <Link href="/pricing" className="block sm:inline-block w-full sm:w-auto">
                  <Button
                    variant="gradient"
                    className="w-full rounded-[12px] px-6 py-3.5 sm:py-5 text-xs font-bold justify-center sm:w-auto shadow-md"
                  >
                    View Pricing Plans &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. BOTTOM CTA BANNER (Rich Gradient & Glow)
          ========================================================================= */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-r from-[#4F27E8] via-[#663CF6] to-[#7C3AED] p-6 sm:p-10 lg:p-12 shadow-[0_16px_36px_rgba(79,39,232,0.32)] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl text-center lg:text-left text-white">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                Ready to Digitize Your School?
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#EDE7FF] font-medium">
                Join hundreds of schools that are already managing their operations
                smarter with ScholoNix.
              </p>
            </div>

            <div className="shrink-0 text-center lg:text-right">
              <Link
                href="/register?step=1"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-[12px] bg-white dark:bg-[#141731] px-7 py-3.5 sm:py-4 text-sm font-extrabold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xl transition hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A]"
              >
                Register Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER (High Contrast Details & Sharper Boundaries)
          ========================================================================= */}
      <footer
        id="support"
        className="border-t border-[#D6DBF0] dark:border-[#2C3159] bg-[#FAFBFF] dark:bg-[#10132C] pt-12 pb-8 sm:pt-16 sm:pb-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 sm:gap-10">
            {/* Brand column (4 cols on desktop) */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] font-medium">
                A comprehensive, cloud-based school management platform to simplify and
                streamline your school operations.
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

            {/* Product Links (2 cols on desktop) */}
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

            {/* Resources Links (2 cols on desktop) */}
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

            {/* Company Links (2 cols on desktop) */}
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
                  <Link href="/feedback" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="#privacy" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#terms" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated Column (2 cols on desktop) */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                Stay Updated
              </h4>
              <p className="text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-1.5 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
              {subscribed && (
                <p className="text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DFE3F5] dark:border-[#2C3159] pt-6 text-xs text-[#4D5072] dark:text-[#B4B9DA] sm:flex-row">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} ScholoNix. All rights
              reserved.
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

export { LandingPage as HomePage };
