"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Sprout,
  Crown,
  Check,
  Minus,
  Plus,
  Zap,
  Cloud,
  ShieldCheck,
  Headphones,
  Sparkles,
  Star,
  ArrowRight,
  Menu,
  X,
  Send,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Button } from "@/components/ui/button";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface PricingTier {
  id: "starter" | "professional" | "enterprise";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  topStripe: string;
  blobColor: string;
  ctaText: string;
  ctaVariant: "secondary" | "gradient";
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Ideal for small schools getting started with digital school management.",
    monthlyPrice: 1999,
    yearlyPrice: 1599,
    iconBg: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    iconColor: "text-[#663CF6] dark:text-[#B59CFF]",
    iconRing: "ring-[#DDD6FE] dark:ring-[#3B306E]",
    borderColor: "border-[#DDD6FE]/80 dark:border-[#3B306E]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F6F2FF]/90 dark:via-[#1D1940]/90 to-[#EDE7FF]/80 dark:to-[#251D4A]/85",
    shadow: "shadow-[0_8px_30px_rgba(102,60,246,0.06)]",
    topStripe: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    blobColor: "bg-[#8B5CF6]/15",
    ctaText: "Register Now",
    ctaVariant: "secondary",
    features: [
      "Up to 500 Students",
      "Core School Modules",
      "Online Fee Collection",
      "Reports & Analytics",
      "Email Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Perfect for growing schools with advanced needs and more users.",
    monthlyPrice: 3999,
    yearlyPrice: 3199,
    popular: true,
    iconBg: "bg-[#E0F2FE] dark:bg-[#132645]",
    iconColor: "text-[#0284C7] dark:text-[#56C2FF]",
    iconRing: "ring-[#BAE6FD] dark:ring-[#1E4670]",
    borderColor: "border-[#BAE6FD]/80 dark:border-[#1E4670]/90",
    bgGradient: "bg-gradient-to-br from-white/98 dark:from-[#141731]/98 via-[#F0F5FE]/95 dark:via-[#15203E]/95 to-[#EDE7FF]/85 dark:to-[#251D4A]/85",
    shadow: "shadow-[0_12px_36px_rgba(2,132,199,0.08)]",
    topStripe: "from-[#663CF6] via-[#0284C7] to-[#38BDF8]",
    blobColor: "bg-[#0284C7]/20",
    ctaText: "Register Now",
    ctaVariant: "gradient",
    features: [
      "Up to 2,500 Students",
      "All Starter Features",
      "Advanced Academics & Exams",
      "Parent & Student Portal",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Best for large schools or school groups with multi-branch requirements.",
    monthlyPrice: 7999,
    yearlyPrice: 6399,
    iconBg: "bg-[#FEF3C7] dark:bg-[#2B2010]",
    iconColor: "text-[#D97706] dark:text-[#FBBF24]",
    iconRing: "ring-[#FDE68A] dark:ring-[#6E4F1A]",
    borderColor: "border-[#FDE68A]/80 dark:border-[#6E4F1A]/90",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FFFBEB]/90 dark:via-[#261E10]/90 to-[#FEF3C7]/80 dark:to-[#2E2210]/85",
    shadow: "shadow-[0_8px_30px_rgba(217,119,6,0.06)]",
    topStripe: "from-[#D97706] via-[#F59E0B] to-[#FCD34D]",
    blobColor: "bg-[#D97706]/15",
    ctaText: "Register Now",
    ctaVariant: "secondary",
    features: [
      "Unlimited Students",
      "All Professional Features",
      "Multi-Branch / Multi-School",
      "Advanced Reports & Integrations",
      "Dedicated Account Manager",
    ],
  },
];

interface ComparisonFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Student Management",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Admissions Management",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Academics (Classes, Subjects, Timetable)",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Attendance Management",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Fee Management & Online Payments",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: "Examinations & Report Cards",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: "Parent & Student Portal",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: "Multi-Branch / Multi-School",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: "Dedicated Support",
    starter: "Email",
    professional: "Priority",
    enterprise: "Dedicated Manager",
  },
];

const TRUST_BADGES = [
  {
    icon: Zap,
    title: "Quick Setup",
    desc: "Get started in minutes.",
    iconColor: "text-[#663CF6] dark:text-[#B59CFF]",
    iconBg: "bg-[#EDE7FF] dark:bg-[#251D4A]",
    iconRing: "ring-[#DDD6FE] dark:ring-[#3B306E]",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F6F2FF]/90 dark:via-[#1D1940]/90 to-[#EDE7FF]/75",
    borderColor: "border-[#DDD6FE]/80 dark:border-[#3B306E]/90",
    topStripe: "from-[#7C3AED] to-[#A78BFA]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(102,60,246,0.14)]",
  },
  {
    icon: Cloud,
    title: "Cloud-Based",
    desc: "Access anytime, anywhere.",
    iconColor: "text-[#0284C7] dark:text-[#56C2FF]",
    iconBg: "bg-[#E0F2FE] dark:bg-[#132645]",
    iconRing: "ring-[#BAE6FD] dark:ring-[#1E4670]",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F0F8FF]/90 dark:via-[#12223D]/90 to-[#E0F2FE]/75 dark:to-[#14294A]/80",
    borderColor: "border-[#BAE6FD]/80 dark:border-[#1E4670]/90",
    topStripe: "from-[#0284C7] to-[#7DD3FC]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(2,132,199,0.14)]",
  },
  {
    icon: ShieldCheck,
    title: "Data Secure",
    desc: "Your school data is always protected.",
    iconColor: "text-[#15803D] dark:text-[#4ADE80]",
    iconBg: "bg-[#DCFCE7] dark:bg-[#0F2C24]",
    iconRing: "ring-[#BBF7D0] dark:ring-[#1B5742]",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#F0FDF4]/90 dark:via-[#0F2620]/90 to-[#DCFCE7]/75 dark:to-[#102E25]/80",
    borderColor: "border-[#BBF7D0]/80 dark:border-[#1B5742]/90",
    topStripe: "from-[#15803D] to-[#86EFAC]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(21,128,61,0.14)]",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    desc: "Get help from our dedicated team.",
    iconColor: "text-[#D946EF] dark:text-[#F0ABFC]",
    iconBg: "bg-[#FAE8FF] dark:bg-[#2B173D]",
    iconRing: "ring-[#F5D0FE] dark:ring-[#5D296E]",
    bgGradient: "bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FDF4FF]/90 dark:via-[#251738]/90 to-[#FAE8FF]/75 dark:to-[#2E1842]/80",
    borderColor: "border-[#F5D0FE]/80 dark:border-[#5D296E]/90",
    topStripe: "from-[#D946EF] to-[#F0ABFC]",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(217,70,239,0.14)]",
  },
];

const FAQS = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade, downgrade, or switch between monthly and annual billing at any time from your school settings. When upgrading, prorated credits are automatically calculated and applied immediately.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Every new school gets a 14-day free trial with full access to all features so your administrators and teachers can test the platform without any upfront risk. No credit card is required to begin.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Net Banking across 50+ Indian banks, Credit/Debit Cards (Visa, MasterCard, RuPay), and NEFT/RTGS wire transfers for institutional accounts.",
  },
  {
    question: "Do you offer discounts for multiple schools?",
    answer:
      "Yes! Educational trusts, foundations, and multi-branch school groups qualify for special volume discounts under our Enterprise tier. Contact our sales team for custom group pricing.",
  },
  {
    question: "Is there any setup or onboarding fee?",
    answer:
      "No, there are zero hidden setup fees. Our platform includes guided setup wizards, CSV bulk data import tools, and dedicated email/phone onboarding assistance at no extra cost.",
  },
];

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "enterprise">("professional");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
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
            {/* Active Pricing Pill matching design */}
            <Link
              href="/pricing"
              className="rounded-full bg-[#8B5CF6] px-4 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED]"
            >
              Pricing
            </Link>
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              For Schools
            </Link>
            <ResourcesDropdown />
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
              Register Now
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
                className="rounded-[10px] bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-2 font-bold text-[#663CF6] dark:text-[#B59CFF]"
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
          2. HERO SECTION: SIMPLE & TRANSPARENT PRICING
          ========================================================================= */}
      <section className="pt-10 pb-6 sm:pt-14 sm:pb-8 lg:pt-16 lg:pb-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Top Pill Badge */}
          <div className="animate-hero-badge inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE] dark:border-[#42357D] bg-[#EDE7FF] dark:bg-[#251D4A] px-4 py-1 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pricing Plans</span>
          </div>

          {/* Main Title with Animated Iridescent Gradient */}
          <h1 className="animate-hero-headline mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-4xl md:text-5xl leading-tight">
            Simple &amp;{" "}
            <span className="bg-gradient-to-r from-[#663CF6] dark:from-[#A98BFF] via-[#4F27E8] dark:via-[#C4B5FD] to-[#0284C7] dark:to-[#38BDF8] bg-clip-text text-transparent animate-gradient-flow">
              Transparent Pricing
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-hero-subtitle mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
            Choose a plan that fits your school&apos;s needs. No hidden charges. Cancel anytime.
          </p>

          {/* 3 Core Trust Values */}
          <div className="animate-hero-checklist mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] sm:gap-8 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" strokeWidth={2.5} />
              <span>Full Feature Access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" strokeWidth={2.5} />
              <span>Secure &amp; Reliable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" strokeWidth={2.5} />
              <span>Dedicated Support</span>
            </div>
          </div>

          {/* Monthly / Yearly Billing Toggle with Smooth Sliding Pill */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative inline-flex items-center rounded-full border border-[#D6DBF0] dark:border-[#2C3159] bg-white/95 dark:bg-[#141731]/95 p-1.5 shadow-xs backdrop-blur-md">
              {/* Smooth Animated Sliding Indicator Pill */}
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] shadow-md transition-all duration-300 ease-out ${
                  billingCycle === "monthly"
                    ? "left-1.5 w-24 sm:w-28"
                    : "left-[102px] sm:left-[118px] w-24 sm:w-28"
                }`}
              />

              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 w-24 sm:w-28 py-2 text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer ${
                  billingCycle === "monthly"
                    ? "text-white"
                    : "text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                }`}
              >
                Monthly
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`relative z-10 w-24 sm:w-28 py-2 text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer ${
                    billingCycle === "yearly"
                      ? "text-white"
                      : "text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                  }`}
                >
                  Yearly
                </button>
                {/* Save 20% Floating Tag */}
                <span className="absolute -top-3.5 -right-3 sm:-right-4 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#15803D] to-[#16A34A] px-2 py-0.5 text-[9px] font-extrabold tracking-tight text-white shadow-sm ring-2 ring-white dark:ring-[#141731]">
                  Save 20%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PRICING CARDS (3 TIERS)
          ========================================================================= */}
      <section className="py-6 sm:py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
            {PRICING_TIERS.map((tier) => {
              const price =
                billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
              const isSelected = selectedPlan === tier.id;
              const registerUrl = `/register?step=1&plan=${tier.id}&billing=${billingCycle}`;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlan(tier.id)}
                  className={`group relative flex flex-col justify-between rounded-[24px] ${tier.bgGradient} p-6 sm:p-8 cursor-pointer transition-all duration-400 ease-out will-change-transform ${
                    isSelected
                      ? "border-[3.5px] border-[#663CF6] dark:border-[#8B5CF6] shadow-[0_22px_50px_rgba(102,60,246,0.22)] ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35 scale-[1.02] -translate-y-1.5"
                      : `border ${tier.borderColor} ${tier.shadow} hover:border-[#663CF6]/60 dark:hover:border-[#9D7CFE]/80 hover:shadow-[0_16px_36px_rgba(24,18,77,0.12)] hover:-translate-y-1.5 hover:scale-[1.01]`
                  }`}
                >
                  {/* Clipped background elements container */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
                    {/* Top Accent Gradient Stripe (Glows when selected or on hover) */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.topStripe} transition-opacity duration-300 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />

                    {/* Ambient corner glow */}
                    <div
                      className={`pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full ${tier.blobColor} blur-2xl transition-all duration-500 ${
                        isSelected ? "opacity-100 scale-125" : "opacity-40 group-hover:opacity-80 group-hover:scale-110"
                      }`}
                    />

                    {/* Shimmer sweep effect on hover */}
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  </div>

                  {/* Floating Most Popular Badge (outside overflow-hidden so not clipped) */}
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md ring-2 ring-white dark:ring-[#141731]">
                        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Direct Child div containing h3 to satisfy div:has(> div > h3) selector */}
                  <div className="relative z-10">
                    {/* Top Row: Icon Badge + Interactive Selection Pill */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${tier.iconBg} ${tier.iconColor} ring-1 ${tier.iconRing} shadow-xs transition-all duration-400 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        {tier.id === "starter" && <Sprout className="h-6 w-6" />}
                        {tier.id === "professional" && <GraduationCap className="h-6 w-6" />}
                        {tier.id === "enterprise" && <Crown className="h-6 w-6" />}
                      </div>

                      {/* Interactive Selection Status Pill */}
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-300 ${
                          isSelected
                            ? "bg-[#663CF6] text-white shadow-xs scale-105"
                            : "bg-white/80 dark:bg-[#141731]/80 text-[#4D5072] dark:text-[#B4B9DA] border border-[#D6DBF0]/70 dark:border-[#2C3159]/80 group-hover:border-[#663CF6]/50 dark:group-hover:border-[#9D7CFE]/70 group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD]"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Active Selection</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8] group-hover:bg-[#663CF6]" />
                            <span>Select Plan</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tier Title & Description */}
                    <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                      {tier.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] min-h-[36px]">
                      {tier.tagline}
                    </p>

                    {/* Price Display */}
                    <div className="mt-4 pb-4 border-b border-black/[0.06]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] transition-all duration-300">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA]">
                          /month
                        </span>
                      </div>
                      {billingCycle === "yearly" && (
                        <p className="mt-1 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                          Billed annually (₹{(price * 12).toLocaleString("en-IN")}/year)
                        </p>
                      )}
                    </div>

                    {/* Primary CTA Button */}
                    <div className="mt-5">
                      <Link href={registerUrl} className="block w-full">
                        <Button
                          variant={isSelected ? "gradient" : "secondary"}
                          className={`w-full rounded-[12px] py-3 text-xs font-bold transition-all duration-300 ${
                            !isSelected
                              ? "border-[1.5px] border-[#8B5CF6] dark:border-[#9D7CFE] text-[#663CF6] dark:text-[#B59CFF] hover:bg-[#F5F2FE] dark:hover:bg-[#251E4C]"
                              : "shadow-md hover:opacity-95 hover:scale-[1.01]"
                          }`}
                        >
                          <span>Register Now</span>
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>

                    {/* Features List */}
                    <div className="mt-5 space-y-2.5">
                      {tier.features.map((feature, idx) => {
                        const isPriority = feature.includes("Priority Support");
                        return (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] mt-0.5 shadow-2xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span
                              className={`text-xs ${
                                isPriority
                                  ? "font-extrabold text-[#08093B] dark:text-[#F3F5FF]"
                                  : "font-medium text-[#1B1D45] dark:text-[#F3F5FF]"
                              }`}
                            >
                              {feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURE COMPARISON TABLE
          ========================================================================= */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0]/80 dark:border-[#2C3159]/90 bg-white/95 dark:bg-[#141731]/95 backdrop-blur-sm p-6 shadow-[0_16px_40px_rgba(24,18,77,0.06)] sm:p-8 lg:p-10">
            {/* Top decorative gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#663CF6] via-[#38BDF8] to-[#10B981]" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-1 text-[11px] font-bold text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60 mb-2.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Plan Breakdown</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl">
                  Feature Comparison
                </h2>
                <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA] sm:text-sm">
                  See what&apos;s included in each plan and choose the right one for your school.
                </p>
              </div>
            </div>

            {/* Responsive Table Container with horizontal scrolling on mobile */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DFE3F5] dark:border-[#2C3159]">
                    <th className="pb-4 text-xs font-bold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF] w-[34%]">
                      Features
                    </th>
                    <th className="pb-4 text-center text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] w-[22%]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] shadow-xs">
                          <Sprout className="h-4 w-4" />
                        </div>
                        <span>Starter</span>
                      </div>
                    </th>
                    {/* Professional Column Header (Highlighted lavender tint) */}
                    <th className="pb-4 text-center text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] bg-gradient-to-b from-[#F3EFFF] dark:from-[#1E1A42] to-[#FAF8FF] rounded-t-2xl w-[22%] border-x border-t border-[#E4DCFD]/80 dark:border-[#39306B]/90 shadow-xs">
                      <div className="flex flex-col items-center gap-1 pt-2 pb-1">
                        <span className="inline-block rounded-full bg-[#663CF6] px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase text-white shadow-2xs">
                          Recommended
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E0F2FE] dark:bg-[#132645] text-[#0284C7] dark:text-[#56C2FF] shadow-xs">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="text-[#663CF6] dark:text-[#B59CFF] font-extrabold">Professional</span>
                      </div>
                    </th>
                    <th className="pb-4 text-center text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] w-[22%]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF3C7] dark:bg-[#2B2010] text-[#D97706] dark:text-[#FBBF24] shadow-xs">
                          <Crown className="h-4 w-4" />
                        </div>
                        <span>Enterprise</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0F2FA] dark:divide-[#23284A] text-xs">
                  {COMPARISON_FEATURES.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#F8F9FE] dark:hover:bg-[#1E2248] transition-colors duration-150"
                    >
                      <td className="py-3.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                        {item.name}
                      </td>

                      {/* Starter Value */}
                      <td className="py-3.5 text-center text-[#4D5072] dark:text-[#B4B9DA]">
                        {typeof item.starter === "boolean" ? (
                          item.starter ? (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] shadow-2xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#1B1F40] text-[#94A3B8] dark:text-[#8E95BA]">
                              <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                            </div>
                          )
                        ) : (
                          <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{item.starter}</span>
                        )}
                      </td>

                      {/* Professional Value (Tinted Column) */}
                      <td className="py-3.5 text-center bg-[#FAF8FF] dark:bg-[#181B38] border-x border-[#E4DCFD]/60 dark:border-[#39306B]/70 text-[#4D5072] dark:text-[#B4B9DA]">
                        {typeof item.professional === "boolean" ? (
                          item.professional ? (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] shadow-2xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#1B1F40] text-[#94A3B8] dark:text-[#8E95BA]">
                              <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                            </div>
                          )
                        ) : (
                          <span className="font-extrabold text-[#663CF6] dark:text-[#B59CFF]">{item.professional}</span>
                        )}
                      </td>

                      {/* Enterprise Value */}
                      <td className="py-3.5 text-center text-[#4D5072] dark:text-[#B4B9DA]">
                        {typeof item.enterprise === "boolean" ? (
                          item.enterprise ? (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] text-[#15803D] dark:text-[#4ADE80] shadow-2xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-[#1B1F40] text-[#94A3B8] dark:text-[#8E95BA]">
                              <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                            </div>
                          )
                        ) : (
                          <span className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{item.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FOUR TRUST BADGES STRIP
          ========================================================================= */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_BADGES.map((badge, idx) => {
              const IconComp = badge.icon;
              return (
                <div
                  key={idx}
                  className={`group relative flex items-center gap-3.5 rounded-[18px] border ${badge.borderColor} ${badge.bgGradient} p-4.5 sm:p-5 shadow-[0_8px_24px_rgba(24,18,77,0.04)] ${badge.hoverShadow} transition-all duration-300 hover:-translate-y-1.5 overflow-hidden`}
                >
                  {/* Top glowing accent stripe */}
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${badge.topStripe} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />
                  {/* Ambient corner glow blob */}
                  <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/60 dark:bg-white/10 blur-lg transition-transform duration-500 group-hover:scale-150" />

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${badge.iconBg} ${badge.iconColor} ring-1 ${badge.iconRing} shadow-xs transition-all duration-400 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#4D5072] dark:text-[#B4B9DA] leading-snug mt-0.5">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FREQUENTLY ASKED QUESTIONS (FAQ)
          ========================================================================= */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0]/80 dark:border-[#2C3159]/90 bg-white/95 dark:bg-[#141731]/95 backdrop-blur-sm p-6 shadow-[0_16px_40px_rgba(24,18,77,0.05)] sm:p-8 lg:p-10">
            {/* Top decorative gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#663CF6] via-[#A855F7] to-[#EC4899]" />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              {/* Left Column: Icon & Title */}
              <div className="lg:col-span-4 space-y-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#EDE7FF] dark:from-[#231B47] to-[#DDD6FE] text-[#663CF6] dark:text-[#B59CFF] shadow-sm ring-1 ring-[#D4C4FE] dark:ring-[#42357D]">
                  <HelpCircle className="h-7 w-7" />
                  <MessageSquare className="absolute -bottom-1 -right-1 h-5 w-5 fill-[#663CF6] text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-3 py-1 text-[11px] font-bold text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60 mb-2">
                    <Sparkles className="h-3 w-3" />
                    <span>Got Questions?</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-3xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-sm">
                    Find answers to common questions about our pricing and plans.
                  </p>
                </div>
              </div>

              {/* Right Column: Accordion */}
              <div className="lg:col-span-8 space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className={`rounded-[16px] border transition-all duration-300 overflow-hidden ${
                        isOpen
                          ? "border-[#C4B5FD] dark:border-[#4B3D91] bg-[#FAF8FF] dark:bg-[#181B38] shadow-xs"
                          : "border-[#E2E8F0] dark:border-[#2C3159] bg-white dark:bg-[#141731] hover:border-[#CBD5E1] dark:hover:border-[#4B538F] hover:bg-[#F8FAFC]/60 dark:hover:bg-[#1E2248]/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="flex w-full items-center justify-between p-4.5 sm:p-5 text-left text-xs sm:text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF] hover:text-[#663CF6] dark:hover:text-[#C4B5FD] transition-colors gap-3"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            isOpen
                              ? "bg-[#663CF6] text-white shadow-xs rotate-180"
                              : "bg-[#F1F5F9] dark:bg-[#1B1F40] text-[#475569] dark:text-[#B4B9DA]"
                          }`}
                        >
                          {isOpen ? (
                            <Minus className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4.5 pb-5 sm:px-5 text-xs leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] font-medium border-t border-[#E9D5FF]/60 dark:border-[#4A326E]/70 pt-3.5">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. BOTTOM CTA BANNER: READY TO GET STARTED?
          ========================================================================= */}
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#663CF6] via-[#5B30E8] to-[#4318D1] p-8 sm:p-12 shadow-2xl shadow-[#663CF6]/25 border border-white/20">
            {/* Ambient decorative blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#38BDF8]/20 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row text-center md:text-left">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Ready to Get Started?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/90">
                  Join hundreds of schools already managing their operations with ScholoNix.
                </p>
              </div>

              <Link href="/register?step=1">
                <Button
                  className="rounded-[12px] bg-white dark:bg-[#141731] px-7 py-3.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] shadow-md hover:bg-slate-50 dark:hover:bg-[#1D2145] transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                >
                  Register Now &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="border-t border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12">
            {/* Brand and Description (4 cols on desktop) */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                A comprehensive, cloud-based school management platform to simplify and
                streamline your school operations.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
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
                  <Link href="/pricing" className="text-[#663CF6] dark:text-[#B59CFF]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/for-schools" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="/#integrations" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
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
                  <Link href="/#blog" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
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

            {/* Stay Updated */}
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
            <p className="flex items-center gap-1 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
              <span className="text-red-500 dark:text-rose-400">❤️</span> Made for Schools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
