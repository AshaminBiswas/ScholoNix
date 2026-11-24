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
    borderColor: "border-[#DDD6FE]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/85 to-[#EDE7FF]/70",
    shadow: "shadow-[0_8px_24px_rgba(124,58,237,0.06)]",
    hoverBorder: "hover:border-[#7C3AED]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(124,58,237,0.18)]",
    topStripe: "from-[#7C3AED] to-[#A78BFA]",
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#5824EE]",
    iconRing: "ring-[#D4C4FE]",
    titleHover: "group-hover:text-[#663CF6]",
  },
  {
    title: "Academics",
    description: "Handle classes, subjects, timetables and lesson plans.",
    icon: GraduationCap,
    borderColor: "border-[#BAE6FD]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0F8FF]/85 to-[#E0F2FE]/70",
    shadow: "shadow-[0_8px_24px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(2,132,199,0.18)]",
    topStripe: "from-[#0284C7] to-[#38BDF8]",
    iconBg: "bg-[#DDF0FF]",
    iconColor: "text-[#0E74CE]",
    iconRing: "ring-[#BAE0FD]",
    titleHover: "group-hover:text-[#0E74CE]",
  },
  {
    title: "Attendance",
    description: "Track daily attendance for students and staff.",
    icon: Calendar,
    borderColor: "border-[#BBF7D0]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDF4]/85 to-[#DCFCE7]/70",
    shadow: "shadow-[0_8px_24px_rgba(22,163,74,0.06)]",
    hoverBorder: "hover:border-[#16A34A]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(22,163,74,0.18)]",
    topStripe: "from-[#16A34A] to-[#4ADE80]",
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
    iconRing: "ring-[#BBF7D0]",
    titleHover: "group-hover:text-[#15803D]",
  },
  {
    title: "Fees & Payments",
    description: "Collect fees online, track dues and generate receipts.",
    icon: CreditCard,
    borderColor: "border-[#FDE68A]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFFBEB]/85 to-[#FEF3C7]/70",
    shadow: "shadow-[0_8px_24px_rgba(217,119,6,0.06)]",
    hoverBorder: "hover:border-[#D97706]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(217,119,6,0.18)]",
    topStripe: "from-[#D97706] to-[#FBBF24]",
    iconBg: "bg-[#FFF0D5]",
    iconColor: "text-[#B45309]",
    iconRing: "ring-[#FDE68A]",
    titleHover: "group-hover:text-[#B45309]",
  },
  {
    title: "Staff Management",
    description: "Manage staff details, roles and responsibilities.",
    icon: BookOpen,
    borderColor: "border-[#FECDD3]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFF1F2]/85 to-[#FFE4E6]/70",
    shadow: "shadow-[0_8px_24px_rgba(225,29,72,0.06)]",
    hoverBorder: "hover:border-[#E11D48]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(225,29,72,0.18)]",
    topStripe: "from-[#E11D48] to-[#FB7185]",
    iconBg: "bg-[#FFE4EF]",
    iconColor: "text-[#DB2777]",
    iconRing: "ring-[#FBCFE8]",
    titleHover: "group-hover:text-[#DB2777]",
  },
  {
    title: "Parents & Communication",
    description: "Keep parents informed with notices, alerts and updates.",
    icon: MessageSquare,
    borderColor: "border-[#C7D2FE]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#EEF2FF]/85 to-[#E0E7FF]/70",
    shadow: "shadow-[0_8px_24px_rgba(79,70,229,0.06)]",
    hoverBorder: "hover:border-[#4F46E5]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(79,70,229,0.18)]",
    topStripe: "from-[#4F46E5] to-[#818CF8]",
    iconBg: "bg-[#F2EEFD]",
    iconColor: "text-[#4F27E8]",
    iconRing: "ring-[#DDD2FE]",
    titleHover: "group-hover:text-[#4F27E8]",
  },
  {
    title: "Reports & Analytics",
    description: "Get insightful reports for better decision making.",
    icon: BarChart3,
    borderColor: "border-[#99F6E4]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDFA]/85 to-[#CCFBF1]/70",
    shadow: "shadow-[0_8px_24px_rgba(13,148,136,0.06)]",
    hoverBorder: "hover:border-[#0D9488]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(13,148,136,0.18)]",
    topStripe: "from-[#0D9488] to-[#2DD4BF]",
    iconBg: "bg-[#CCFBF1]",
    iconColor: "text-[#0F766E]",
    iconRing: "ring-[#99F6E4]",
    titleHover: "group-hover:text-[#0F766E]",
  },
  {
    title: "Cloud & Secure",
    description: "Access anytime, anywhere with enterprise-grade security.",
    icon: Cloud,
    borderColor: "border-[#A5F3FC]/90",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#ECFEFF]/85 to-[#CFFAFE]/70",
    shadow: "shadow-[0_8px_24px_rgba(8,145,178,0.06)]",
    hoverBorder: "hover:border-[#0891B2]",
    hoverShadow: "hover:shadow-[0_18px_38px_rgba(8,145,178,0.18)]",
    topStripe: "from-[#0891B2] to-[#38BDF8]",
    iconBg: "bg-[#CFFAFE]",
    iconColor: "text-[#0891B2]",
    iconRing: "ring-[#A5F3FC]",
    titleHover: "group-hover:text-[#0891B2]",
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
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      {/* Luminous Atmospheric Aurora & Wave Background with rich contrast */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR (With Responsive Mobile Drawer)
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
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6]">
              For Schools
            </Link>
            <ResourcesDropdown />
          </nav>

          {/* Right Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white px-3 py-1.5 text-xs font-bold text-[#4F27E8] shadow-xs transition hover:border-[#4F27E8] hover:bg-[#F7F4FF]"
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
          2. HERO SECTION (Fluid Typography & Mobile-Stacked Actions)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Headlines & CTAs */}
            <div className="space-y-5 sm:space-y-6 lg:col-span-6">
              {/* Badge */}
              <div className="animate-hero-badge inline-flex items-center gap-2 rounded-full border border-[#BFA8FF] bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#4F27E8] shadow-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  All-in-One School Management Platform
                </span>
              </div>

              {/* Main Headline with fluid typography & loading animation */}
              <h1 className="animate-hero-headline text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-5xl lg:text-6xl leading-[1.14]">
                Run Your School <br />
                <span className="text-[#08093B]">Smarter, Simpler</span> <br />
                <span className="bg-gradient-to-r from-[#663CF6] via-[#4F27E8] to-[#1683E8] bg-clip-text text-transparent animate-gradient-flow">
                  and More Efficiently
                </span>
              </h1>

              {/* Subtitle */}
              <p className="animate-hero-subtitle max-w-xl text-sm leading-relaxed text-[#4D5072] font-medium sm:text-base lg:text-lg">
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
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-btn-shimmer" />
                </Link>
                <Link
                  id="hero-pricing-btn"
                  href="/pricing"
                  className="animate-hero-btn-secondary inline-flex w-full sm:w-auto items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white px-6 py-3.5 sm:py-4 text-sm font-bold text-[#4F27E8] shadow-xs transition-all duration-200 hover:border-[#4F27E8] hover:bg-[#F7F4FF] hover:scale-105 active:scale-[0.98]"
                >
                  View Pricing
                </Link>
              </div>

              {/* Value Points with accessible high-contrast checks */}
              <div className="animate-hero-checklist flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs font-semibold text-[#1B1D45]">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
                  <span>Quick Setup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
                  <span>No Coding Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
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
        className="relative bg-transparent py-10 sm:py-14 overflow-hidden border-y border-[#D6DBF0]/40"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-7 sm:mb-9 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-white/80 px-3 py-1 text-xs font-bold text-[#5824EE] shadow-xs backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-[#8B5CF6] text-[#8B5CF6]" />
              <span>Verified Institutions</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#08093B] sm:text-2xl lg:text-3xl">
              Trusted by 1,000+ Schools
            </h2>
            <p className="mt-1.5 text-xs font-medium text-[#4D5072] sm:text-sm max-w-xl mx-auto">
              Across India for a smarter, simpler, and more efficient school operations
            </p>
          </div>

          {/* 4 Interactive Elevated School Cards with Staggered Scroll-Reveal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {/* 1. Sunrise International School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#BAE6FD]/90 bg-gradient-to-b from-white/95 via-[#F0F8FF]/85 to-[#E0F2FE]/70 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(14,116,206,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#0E74CE] hover:shadow-[0_20px_42px_rgba(14,116,206,0.22)] cursor-pointer will-change-transform ${
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
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                {/* School Crest Badge with Hover Micro-Interactions */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#DDF0FF] text-[#0E74CE] ring-1 ring-[#93C5FD] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-4 group-hover:ring-[#BAE6FD]/60">
                  <SchoolIcon className="h-5 w-5 text-[#0E74CE]" />
                </div>

                {/* Pill Tag */}
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[10px] font-bold text-[#0369A1] ring-1 ring-[#BAE6FD]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#0284C7]" />
                  CBSE Affiliated
                </span>
              </div>

              {/* School Info */}
              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] group-hover:text-[#0E74CE] transition-colors">
                  Sunrise
                </span>
                <span className="block text-xs font-semibold text-[#4D5072]">
                  International School
                </span>
              </div>

              {/* Key Stats Bar */}
              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0E74CE]" />
                  2,450+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
            </div>

            {/* 2. Green Valley Public School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#86EFAC]/90 bg-gradient-to-b from-white/95 via-[#F0FDF4]/85 to-[#DCFCE7]/70 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(21,128,61,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#15803D] hover:shadow-[0_20px_42px_rgba(21,128,61,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "140ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#16A34A] to-[#4ADE80] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#86EFAC] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-4 group-hover:ring-[#BBF7D0]/60">
                  <Building className="h-5 w-5 text-[#15803D]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-bold text-[#15803D] ring-1 ring-[#86EFAC]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#16A34A]" />
                  ICSE Board
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] group-hover:text-[#15803D] transition-colors">
                  Green Valley
                </span>
                <span className="block text-xs font-semibold text-[#4D5072]">
                  Public School
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#15803D]" />
                  1,820+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  4.9
                </span>
              </div>
            </div>

            {/* 3. Lotus World School */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#DDD6FE]/90 bg-gradient-to-b from-white/95 via-[#FAF5FF]/85 to-[#EDE7FF]/70 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(102,60,246,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#663CF6] hover:shadow-[0_20px_42px_rgba(102,60,246,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "220ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#663CF6] to-[#A78BFA] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EDE7FF] text-[#5824EE] ring-1 ring-[#C4B5FD] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:ring-4 group-hover:ring-[#DDD6FE]/60">
                  <Sparkles className="h-5 w-5 text-[#5824EE]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[10px] font-bold text-[#5824EE] ring-1 ring-[#C4B5FD]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#5824EE]" />
                  IB World
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] group-hover:text-[#5824EE] transition-colors">
                  Lotus
                </span>
                <span className="block text-xs font-semibold text-[#4D5072]">
                  World School
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-[#5824EE]" />
                  3 Campuses
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  5.0
                </span>
              </div>
            </div>

            {/* 4. Riverside Academy */}
            <div
              className={`group relative overflow-hidden rounded-[20px] border border-[#C7D2FE]/90 bg-gradient-to-b from-white/95 via-[#F2F4FF]/85 to-[#E0E7FF]/70 backdrop-blur-md p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(79,70,229,0.08)] transition-all duration-700 hover:-translate-y-2 hover:border-[#4338CA] hover:shadow-[0_20px_42px_rgba(67,56,202,0.22)] cursor-pointer will-change-transform ${
                cardsInView
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-8 scale-[0.97]"
              }`}
              style={{
                transitionDelay: cardsInView ? "300ms" : "0ms",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4F46E5] to-[#818CF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#E0E7FF] text-[#4338CA] ring-1 ring-[#A5B4FC] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-4 group-hover:ring-[#C7D2FE]/60">
                  <GraduationCap className="h-5 w-5 text-[#4338CA]" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#4338CA] ring-1 ring-[#A5B4FC]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#4338CA]" />
                  State Board
                </span>
              </div>

              <div className="mt-3.5">
                <span className="block text-base font-extrabold text-[#08093B] group-hover:text-[#4338CA] transition-colors">
                  Riverside
                </span>
                <span className="block text-xs font-semibold text-[#4D5072]">
                  Academy
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6]/90 pt-3 text-[11px]">
                <span className="font-semibold text-[#4D5072] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#4338CA]" />
                  1,640+ Students
                </span>
                <span className="flex items-center gap-1 font-bold text-[#08093B]">
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
            className={`inline-flex items-center rounded-full border border-[#BFA8FF] bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#4F27E8] transition-all duration-700 ${
              featuresInView
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          >
            Key Features
          </div>
          <h2
            className={`mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl lg:text-4xl transition-all duration-700 delay-75 ${
              featuresInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            Everything Your School Needs
          </h2>
          <p
            className={`mx-auto mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm font-medium text-[#4D5072] lg:text-base transition-all duration-700 delay-150 ${
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
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

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
                    className={`mt-4 text-base font-bold text-[#08093B] ${item.titleHover} transition-colors`}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-xs leading-relaxed text-[#4D5072]">
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
              <div className="inline-flex items-center rounded-full border border-[#BFA8FF] bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#4F27E8]">
                Why Choose Us
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl lg:text-4xl">
                A Modern, Reliable & Scalable Solution
              </h2>

              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
                {/* Checklist (8 cols on desktop) */}
                <div className="space-y-3.5 sm:col-span-7">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D]" />
                    <span>All-in-one platform for school management</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D]" />
                    <span>Simple, user-friendly and quick to set up</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D]" />
                    <span>Secure, cloud-based and always available</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1B1D45]">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#15803D]" />
                    <span>Scales with your school&apos;s growing needs</span>
                  </div>
                </div>

                {/* 98% Customer Satisfaction Card (5 cols on desktop, Enhanced Contrast) */}
                <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#B8A4FF] bg-[#EDE7FF] p-5 sm:p-6 text-center shadow-[0_8px_24px_rgba(102,60,246,0.12)] sm:col-span-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFF0D5] text-[#B45309] shadow-sm">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl font-extrabold text-[#08093B]">
                    98%
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#4F27E8]">
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
          <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-5 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(24,18,77,0.08)] backdrop-blur-md">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <span className="inline-flex items-center rounded-full border border-[#BFA8FF] bg-[#EDE7FF] px-3 py-0.5 text-xs font-bold text-[#4F27E8]">
                Pricing
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                Simple & Transparent Pricing
              </h2>
              <p className="mt-1 text-xs text-[#4D5072] font-medium sm:text-sm">
                Choose a plan that fits your school&apos;s needs. No hidden charges.
                Cancel anytime.
              </p>
            </div>

            {/* 3-Column Pricing Strip (Distinct contrast gradient) */}
            <div className="grid grid-cols-1 items-center gap-5 sm:gap-6 rounded-[14px] border border-[#CDC2F7] bg-gradient-to-r from-[#F5F1FE] to-[#EEF5FE] p-5 sm:p-6 lg:grid-cols-12 shadow-xs">
              {/* Left Price Segment */}
              <div className="text-center sm:text-left lg:col-span-4">
                <span className="text-xs font-bold text-[#4D5072]">Starting from</span>
                <div className="mt-0.5 text-3xl sm:text-4xl font-black text-[#4F27E8]">
                  ₹1,999
                  <span className="text-sm font-normal text-[#4D5072]">/month</span>
                </div>
              </div>

              {/* Middle Features Segment */}
              <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-[#1B1D45] sm:grid-cols-2 lg:col-span-5">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
                  <span>Student & Staff Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
                  <span>Attendance & Academics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
                  <span>Fees & Online Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#15803D]" />
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
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-[12px] bg-white px-7 py-3.5 sm:py-4 text-sm font-extrabold text-[#4F27E8] shadow-xl transition hover:bg-[#F7F4FF]"
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
        className="border-t border-[#D6DBF0] bg-[#FAFBFF] pt-12 pb-8 sm:pt-16 sm:pb-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 sm:gap-10">
            {/* Brand column (4 cols on desktop) */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs leading-relaxed text-[#4D5072] font-medium">
                A comprehensive, cloud-based school management platform to simplify and
                streamline your school operations.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2.5 pt-1 text-[#4D5072]">
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

            {/* Product Links (2 cols on desktop) */}
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
                  <Link href="#integrations" className="hover:text-[#663CF6]">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links (2 cols on desktop) */}
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
                  <Link href="/guides" className="hover:text-[#663CF6]">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links (2 cols on desktop) */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Company
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="#about" className="hover:text-[#663CF6]">
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
                  <Link href="#privacy" className="hover:text-[#663CF6]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#terms" className="hover:text-[#663CF6]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated Column (2 cols on desktop) */}
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
            <div className="flex items-center gap-1 font-bold text-[#1B1D45]">
              <span className="text-red-500">❤️</span> Made for Schools
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage as HomePage };
