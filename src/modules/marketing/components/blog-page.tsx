"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  ArrowRight,
  BookOpen,
  LayoutGrid,
  Building2,
  Zap,
  Users,
  Lightbulb,
  Mail,
  Flame,
  Tag,
  CheckCircle2,
  Cloud,
  CheckSquare,
  Laptop,
  Bookmark,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { SchoolIllustration } from "@/modules/schools/components/school-illustration";
import { ALL_BLOG_POSTS, type BlogPostData } from "../data/blog-data";
import { BrandLogo } from "@/components/ui/brand-logo";

// Category configuration
export interface CategoryTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: CategoryTab[] = [
  { id: "all", name: "All Articles", icon: LayoutGrid },
  { id: "school-management", name: "School Management", icon: Building2 },
  { id: "digital-transformation", name: "Digital Transformation", icon: Zap },
  { id: "academic-excellence", name: "Academic Excellence", icon: GraduationCap },
  { id: "parent-engagement", name: "Parent Engagement", icon: Users },
  { id: "tips-best-practices", name: "Tips & Best Practices", icon: Lightbulb },
];

export const POPULAR_ARTICLES = [
  {
    id: "pop-1",
    slug: "a-complete-guide-to-digital-transformation-for-schools",
    title: "Benefits of a Cloud-Based School Management System",
    date: "Aug 18, 2025",
    readTime: "6 min read",
    icon: Cloud,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
  },
  {
    id: "pop-2",
    slug: "how-a-school-management-system-simplifies-daily-operations",
    title: "How to Choose the Right School Management Software",
    date: "Aug 12, 2025",
    readTime: "7 min read",
    icon: CheckSquare,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
  },
  {
    id: "pop-3",
    slug: "10-ways-to-improve-academic-planning-and-student-outcomes",
    title: "A Teacher's Guide to Using School Technology Effectively",
    date: "Aug 8, 2025",
    readTime: "5 min read",
    icon: Laptop,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
  },
];

export const TOPICS = [
  { id: "school-management", name: "School Management", count: 24 },
  { id: "digital-transformation", name: "Digital Transformation", count: 18 },
  { id: "academic-excellence", name: "Academic Excellence", count: 16 },
  { id: "parent-engagement", name: "Parent Engagement", count: 12 },
  { id: "tips-best-practices", name: "Tips & Best Practices", count: 20 },
];

// Visual Illustrations for Cards
function ArticleVisual({ type, className = "" }: { type: BlogPostData["visualType"]; className?: string }) {
  if (type === "school") {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E0F2FE] via-[#EDE7FF] to-[#F5F3FF] p-4 ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent)]" />
        <div className="scale-75 transform transition-transform duration-500 group-hover:scale-80">
          <SchoolIllustration />
        </div>
      </div>
    );
  }

  if (type === "classroom") {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E0F7FA] via-[#EDE7FF] to-[#F3E8FF] p-6 ${className}`}>
        <svg viewBox="0 0 240 160" className="h-full w-full max-w-[200px] transition-transform duration-500 group-hover:scale-105" fill="none">
          {/* Blackboard */}
          <rect x="25" y="20" width="130" height="85" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
          <line x1="35" y1="40" x2="110" y2="40" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="55" x2="85" y2="55" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="70" x2="135" y2="70" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          {/* Teacher figure */}
          <circle cx="185" cy="50" r="14" fill="#663CF6" />
          <path d="M165 95 C165 75, 205 75, 205 95" fill="#7C3AED" />
          <path d="M175 68 L150 45" stroke="#663CF6" strokeWidth="3" strokeLinecap="round" />
          {/* Desk & Student */}
          <rect x="50" y="120" width="140" height="12" rx="4" fill="#CBD5E1" />
          <circle cx="95" cy="115" r="10" fill="#38BDF8" />
          <circle cx="140" cy="115" r="10" fill="#10B981" />
        </svg>
      </div>
    );
  }

  if (type === "books") {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FEF3C7] via-[#EDE7FF] to-[#F1F5F9] p-6 ${className}`}>
        <svg viewBox="0 0 240 160" className="h-full w-full max-w-[200px] transition-transform duration-500 group-hover:scale-105" fill="none">
          {/* Stack of books */}
          <rect x="50" y="95" width="140" height="26" rx="5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
          <rect x="55" y="66" width="130" height="26" rx="5" fill="#10B981" stroke="#047857" strokeWidth="2" />
          <rect x="60" y="37" width="120" height="26" rx="5" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          {/* Pencil cup */}
          <rect x="190" y="70" width="30" height="48" rx="4" fill="#EDE7FF" stroke="#7C3AED" strokeWidth="2" />
          <line x1="198" y1="45" x2="198" y2="70" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="208" y1="40" x2="208" y2="70" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type === "family") {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#EDE7FF] via-[#FCE7F3] to-[#FEF3C7] p-6 ${className}`}>
        <svg viewBox="0 0 240 160" className="h-full w-full max-w-[200px] transition-transform duration-500 group-hover:scale-105" fill="none">
          {/* Speech bubble */}
          <path d="M40 30 C40 20, 160 20, 160 30 L160 70 C160 80, 100 80, 90 95 L80 80 L40 80 Z" fill="#663CF6" fillOpacity="0.12" stroke="#663CF6" strokeWidth="2" />
          <circle cx="75" cy="50" r="4" fill="#663CF6" />
          <circle cx="100" cy="50" r="4" fill="#663CF6" />
          <circle cx="125" cy="50" r="4" fill="#663CF6" />
          {/* Parent & Child figures */}
          <circle cx="160" cy="90" r="16" fill="#7C3AED" />
          <circle cx="125" cy="100" r="12" fill="#EC4899" />
          <circle cx="95" cy="105" r="10" fill="#3B82F6" />
          {/* Laptop */}
          <rect x="75" y="125" width="90" height="15" rx="3" fill="#1E293B" />
        </svg>
      </div>
    );
  }

  // Analytics
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E0F2FE] via-[#EDE7FF] to-[#DCFCE7] p-6 ${className}`}>
      <svg viewBox="0 0 240 160" className="h-full w-full max-w-[200px] transition-transform duration-500 group-hover:scale-105" fill="none">
        {/* Laptop frame */}
        <rect x="40" y="30" width="160" height="95" rx="8" fill="#1E1B4B" stroke="#312E81" strokeWidth="2" />
        <rect x="48" y="38" width="144" height="79" rx="4" fill="#FFFFFF" />
        {/* Bars */}
        <rect x="62" y="80" width="12" height="30" rx="3" fill="#818CF8" />
        <rect x="80" y="65" width="12" height="45" rx="3" fill="#6366F1" />
        <rect x="98" y="55" width="12" height="55" rx="3" fill="#4F46E5" />
        <rect x="116" y="70" width="12" height="40" rx="3" fill="#7C3AED" />
        <rect x="134" y="50" width="12" height="60" rx="3" fill="#663CF6" />
        {/* Trend line */}
        <path d="M65 75 Q 98 45, 140 42" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Pie circle */}
        <circle cx="168" cy="65" r="14" stroke="#F59E0B" strokeWidth="6" strokeDasharray="60 30" fill="none" />
        {/* Laptop base */}
        <path d="M25 125 L215 125 L200 135 L40 135 Z" fill="#94A3B8" />
      </svg>
    </div>
  );
}

// Hero 3D Illustration matching mockup
function BlogHeroIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center p-4">
      {/* Soft background glow */}
      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C4B5FD]/40 to-[#93C5FD]/30 blur-2xl filter" />

      {/* Floating Sparkle Micro-interactions */}
      <div className="absolute -top-2 left-6 z-20 flex animate-bounce items-center gap-1.5 rounded-full border border-[#D4C4FE]/60 bg-white/95 px-3 py-1 shadow-md shadow-[#663CF6]/10 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
        <span className="text-xs font-bold text-[#08093B]">50+ Expert Guides</span>
      </div>

      <div className="absolute -bottom-2 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#BAE6FD] bg-white/95 px-3 py-1 shadow-md shadow-[#0284C7]/10 backdrop-blur-md">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7]" />
        <span className="text-xs font-bold text-[#08093B]">Verified Insights</span>
      </div>

      {/* Main Vector Artwork: Laptop + Stacked Books + Graduation Cap */}
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
          <linearGradient id="book1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="book2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
        </defs>

        {/* Ambient shadow */}
        <ellipse cx="260" cy="340" rx="200" ry="24" fill="#1E1B4B" fillOpacity="0.12" />

        {/* Left Decorative Botanical Leaves */}
        <path d="M120 220 Q 90 190, 80 150 Q 110 170, 120 220 Z" fill="#38BDF8" fillOpacity="0.7" />
        <path d="M100 240 Q 60 210, 60 180 Q 90 200, 100 240 Z" fill="#0EA5E9" fillOpacity="0.5" />

        {/* Right Decorative Leaves */}
        <path d="M410 240 Q 450 200, 470 170 Q 440 190, 410 240 Z" fill="#38BDF8" fillOpacity="0.7" />
        <path d="M420 270 Q 460 240, 480 220 Q 440 235, 420 270 Z" fill="#0EA5E9" fillOpacity="0.5" />

        {/* Laptop Screen Body */}
        <rect x="150" y="70" width="280" height="190" rx="16" fill="url(#laptopBody)" stroke="#4338CA" strokeWidth="4" />
        {/* Screen Display */}
        <rect x="162" y="82" width="256" height="166" rx="10" fill="url(#screenGrad)" />

        {/* Article Preview UI inside Laptop */}
        {/* Header bar */}
        <rect x="175" y="94" width="230" height="20" rx="4" fill="#EDE9FE" />
        <circle cx="188" cy="104" r="4" fill="#7C3AED" />
        <rect x="200" y="101" width="60" height="6" rx="3" fill="#663CF6" />

        {/* Image / Graphic box on screen */}
        <rect x="175" y="122" width="70" height="60" rx="8" fill="#E0F2FE" />
        <circle cx="210" cy="142" r="14" fill="#38BDF8" fillOpacity="0.6" />
        <path d="M185 172 Q 200 155, 215 165 T 235 172 Z" fill="#0284C7" fillOpacity="0.7" />

        {/* Text lines on screen */}
        <rect x="256" y="125" width="145" height="10" rx="4" fill="#0F172A" fillOpacity="0.8" />
        <rect x="256" y="142" width="130" height="6" rx="3" fill="#94A3B8" />
        <rect x="256" y="154" width="140" height="6" rx="3" fill="#94A3B8" />
        <rect x="256" y="166" width="115" height="6" rx="3" fill="#CBD5E1" />

        {/* Bottom CTA on screen */}
        <rect x="175" y="195" width="70" height="16" rx="8" fill="#663CF6" />
        <rect x="256" y="198" width="80" height="8" rx="4" fill="#E2E8F0" />

        {/* Laptop Keyboard Base */}
        <path d="M110 260 L470 260 L445 285 L135 285 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <rect x="245" y="263" width="90" height="10" rx="3" fill="#94A3B8" fillOpacity="0.6" />

        {/* Stacked Textbooks in Foreground / Left */}
        {/* Bottom Book */}
        <rect x="90" y="280" width="160" height="24" rx="4" fill="url(#book1)" stroke="#0369A1" strokeWidth="2" />
        <rect x="94" y="284" width="150" height="4" rx="2" fill="#E0F2FE" />
        {/* Top Book */}
        <rect x="98" y="254" width="150" height="22" rx="4" fill="url(#book2)" stroke="#6D28D9" strokeWidth="2" />
        <rect x="102" y="258" width="140" height="4" rx="2" fill="#F3E8FF" />

        {/* Graduation Cap / Mortarboard on Top */}
        {/* Skull cap */}
        <ellipse cx="370" cy="95" rx="32" ry="14" fill="#312E81" />
        {/* Diamond Flat Top */}
        <polygon points="370,45 425,72 370,98 315,72" fill="url(#capGrad)" stroke="#2E1065" strokeWidth="2.5" />
        {/* Center button */}
        <circle cx="370" cy="72" r="5" fill="#FBBF24" />
        {/* Golden Tassel */}
        <path d="M370 72 Q 410 80, 415 115" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="411" y="115" width="8" height="15" rx="2" fill="#D97706" />
      </svg>
    </div>
  );
}

export function BlogPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter posts based on active category tab & search query
  const filteredPosts = useMemo(() => {
    return ALL_BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === "all" || post.categoryId === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Separate featured article and latest list
  const featuredPost = useMemo(() => {
    return filteredPosts.find((p) => p.featured) || filteredPosts[0];
  }, [filteredPosts]);

  const latestPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  // Micro interaction: bookmarking an article
  const toggleSavePost = (postId: string) => {
    setSavedPosts((prev) => {
      const exists = prev.includes(postId);
      const next = exists ? prev.filter((id) => id !== postId) : [...prev, postId];
      showToast(exists ? "Article removed from saved" : "Article saved to your bookmarks!");
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Newsletter subscribe form submission
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setIsSubscribed(true);
      showToast("🎉 Thank you for subscribing to our blog updates!");
    }, 900);
  };

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
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6]">
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
                Get Started Free &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* =========================================================================
            2. HERO SECTION (Title, Subtitle, Search, 3D Hero Artwork)
            ========================================================================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#F8F6FE]/90 to-[#EDE7FF]/80 p-6 sm:p-10 lg:p-12 shadow-[0_16px_40px_rgba(24,18,77,0.08)] backdrop-blur-md">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Content */}
            <div className="space-y-5 lg:col-span-7">
              {/* Blog Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4C4FE]/80 bg-[#EDE7FF] px-3.5 py-1 text-xs font-extrabold text-[#663CF6] shadow-xs">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Blog</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl lg:text-5xl lg:leading-[1.15]">
                School Management <br />
                <span className="bg-gradient-to-r from-[#08093B] via-[#4F27E8] to-[#7C3AED] bg-clip-text text-transparent">
                  Insights & Resources
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-sm font-medium leading-relaxed text-[#4D5072] sm:text-base">
                Explore expert articles, tips and best practices on school management,
                digital transformation and education technology.
              </p>

              {/* Search Bar with Micro-interactions */}
              <div className="relative max-w-md pt-2">
                <div className="relative flex items-center rounded-2xl border border-[#D6DBF0] bg-white p-1.5 shadow-[0_8px_25px_rgba(24,18,77,0.06)] transition-all focus-within:border-[#7C3AED] focus-within:ring-3 focus-within:ring-[#7C3AED]/15">
                  <div className="pl-3 pr-2 text-[#8E92BC]">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search blog articles..."
                    className="w-full bg-transparent text-sm font-semibold text-[#08093B] placeholder-[#8E92BC] outline-none"
                    aria-label="Search blog articles"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mr-1 p-1 text-[#8E92BC] hover:text-[#08093B]"
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
                  <p className="mt-2 text-xs font-semibold text-[#663CF6]">
                    Showing {filteredPosts.length} article(s) matching &quot;{searchQuery}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Right Artwork (Laptop + Books + Mortarboard Cap) */}
            <div className="lg:col-span-5">
              <BlogHeroIllustration />
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CATEGORIES / FILTER TABS BAR
            ========================================================================= */}
        <section className="mt-10 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex min-w-max items-center gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 outline-none ${
                    isActive
                      ? "scale-[1.02] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] text-white shadow-md shadow-[#7C3AED]/25"
                      : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6]/60 hover:bg-[#F8F6FE] hover:text-[#663CF6]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-[#7C3AED]"
                    }`}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. MAIN CONTENT: 2-COLUMN GRID (Left: Articles, Right: Sidebar)
            ========================================================================= */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* =======================================================================
              LEFT COLUMN: Featured & Latest Articles
              ======================================================================= */}
          <div className="space-y-10 lg:col-span-8">
            {/* Featured Article Card */}
            {featuredPost && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE]/80 bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#663CF6]">
                    <Sparkles className="h-3 w-3" />
                    <span>Featured Article</span>
                  </span>
                </div>

                <div className="group relative overflow-hidden rounded-[24px] border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF]/90 to-[#EDE7FF]/70 shadow-[0_12px_36px_rgba(24,18,77,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_20px_45px_rgba(102,60,246,0.16)]">
                  <div className="grid md:grid-cols-12">
                    {/* Visual / Image */}
                    <div className="relative md:col-span-5">
                      <ArticleVisual
                        type={featuredPost.visualType}
                        className="h-56 w-full md:h-full min-h-[220px]"
                      />
                    </div>

                    {/* Text Details */}
                    <div className="flex flex-col justify-between p-6 md:col-span-7 sm:p-8">
                      <div className="space-y-3">
                        <span className="inline-block rounded-full bg-[#EDE7FF] px-3 py-0.5 text-xs font-extrabold text-[#663CF6]">
                          {featuredPost.categoryName}
                        </span>

                        <h2 className="text-xl font-extrabold text-[#08093B] transition-colors group-hover:text-[#663CF6] sm:text-2xl leading-snug">
                          <Link href={`/blog/${featuredPost.slug}`}>
                            {featuredPost.title}
                          </Link>
                        </h2>

                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#5A5E7A]">
                          {featuredPost.excerpt}
                        </p>
                      </div>

                      {/* Author & Read Time Footer */}
                      <div className="mt-6 flex items-center justify-between border-t border-[#F0F2FA] pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#38BDF8] text-xs font-bold text-white shadow-xs">
                            {featuredPost.author.initials}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#08093B]">
                              {featuredPost.author.name}
                            </div>
                            <div className="text-[11px] font-medium text-[#7C829E]">
                              {featuredPost.author.date} &bull; {featuredPost.author.readTime}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSavePost(featuredPost.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6DBF0] text-[#7C829E] transition-colors hover:border-[#663CF6] hover:text-[#663CF6]"
                            title="Save article"
                            aria-label="Save article"
                          >
                            <Bookmark
                              className={`h-4 w-4 ${
                                savedPosts.includes(featuredPost.id)
                                  ? "fill-[#663CF6] text-[#663CF6]"
                                  : ""
                              }`}
                            />
                          </button>
                          <Link
                            href={`/blog/${featuredPost.slug}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DBF0] bg-[#F8FAFC] text-[#08093B] shadow-xs transition-all group-hover:border-[#663CF6] group-hover:bg-[#663CF6] group-hover:text-white"
                            aria-label={`Read ${featuredPost.title}`}
                          >
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Latest Articles List */}
            <section className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B]">
                Latest Articles
              </h2>

              {latestPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D6DBF0] bg-white p-12 text-center">
                  <p className="text-sm font-semibold text-[#5A5E7A]">
                    No articles found matching your criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#663CF6] hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {latestPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group relative overflow-hidden rounded-[20px] border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF]/90 to-[#F2EDFD]/60 p-4 sm:p-5 shadow-[0_8px_24px_rgba(24,18,77,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#663CF6] hover:shadow-[0_16px_36px_rgba(102,60,246,0.14)]"
                    >
                      <div className="grid gap-4 sm:grid-cols-12 sm:gap-6">
                        {/* Thumbnail Graphic */}
                        <div className="sm:col-span-4 overflow-hidden rounded-xl">
                          <ArticleVisual
                            type={post.visualType}
                            className="h-44 w-full rounded-xl sm:h-full min-h-[140px]"
                          />
                        </div>

                        {/* Article Details */}
                        <div className="flex flex-col justify-between sm:col-span-8">
                          <div className="space-y-2">
                            <span className="inline-block rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[11px] font-extrabold text-[#663CF6]">
                              {post.categoryName}
                            </span>

                            <h3 className="text-base sm:text-lg font-bold text-[#08093B] transition-colors group-hover:text-[#663CF6] leading-snug">
                              <Link href={`/blog/${post.slug}`}>
                                {post.title}
                              </Link>
                            </h3>

                            <p className="text-xs font-medium text-[#5A5E7A] line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>

                          {/* Footer: Author & Action */}
                          <div className="mt-4 flex items-center justify-between border-t border-[#F0F2FA] pt-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#663CF6] to-[#A855F7] text-[10px] font-bold text-white shadow-xs">
                                {post.author.initials}
                              </div>
                              <div className="text-xs text-[#5A5E7A]">
                                <span className="font-bold text-[#08093B]">
                                  {post.author.name}
                                </span>{" "}
                                &bull; {post.author.date} &bull; {post.author.readTime}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSavePost(post.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-[#7C829E] transition hover:text-[#663CF6]"
                                title="Save article"
                                aria-label="Save article"
                              >
                                <Bookmark
                                  className={`h-3.5 w-3.5 ${
                                    savedPosts.includes(post.id)
                                      ? "fill-[#663CF6] text-[#663CF6]"
                                      : ""
                                  }`}
                                />
                              </button>
                              <Link
                                href={`/blog/${post.slug}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6DBF0] bg-[#F8FAFC] text-[#08093B] shadow-xs transition-all group-hover:border-[#663CF6] group-hover:bg-[#663CF6] group-hover:text-white"
                                aria-label={`Read ${post.title}`}
                              >
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DBF0] bg-white text-[#4D5072] transition-colors hover:border-[#663CF6] hover:text-[#663CF6] disabled:opacity-40"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                      : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
                disabled={currentPage === 5}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D6DBF0] bg-white text-[#4D5072] transition-colors hover:border-[#663CF6] hover:text-[#663CF6] disabled:opacity-40"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* =======================================================================
              RIGHT COLUMN: Sidebar Widgets (Newsletter, Popular, Topics, CTA)
              ======================================================================= */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Widget 1: Subscribe to Our Blog */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-br from-white/95 via-[#FAF8FF] to-[#EDE7FF]/80 p-6 shadow-[0_12px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] ring-1 ring-[#D4C4FE]/60">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#08093B]">
                  Subscribe to Our Blog
                </h3>
              </div>

              <p className="mt-2.5 text-xs font-medium leading-relaxed text-[#5A5E7A]">
                Get the latest articles, tips and resources delivered straight to your inbox.
              </p>

              <form onSubmit={handleSubscribe} className="mt-4">
                <div className="relative flex items-center rounded-xl border border-[#D6DBF0] bg-white p-1 shadow-xs transition-all focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/15">
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent px-3 text-xs font-medium text-[#08093B] placeholder-[#8E92BC] outline-none"
                    disabled={isSubscribed}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing || isSubscribed}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#663CF6] text-white shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    aria-label="Subscribe"
                  >
                    {isSubscribing ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isSubscribed ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isSubscribed && (
                  <p className="mt-2 text-xs font-bold text-emerald-600">
                    &check; You are subscribed to updates!
                  </p>
                )}
              </form>
            </div>

            {/* Widget 2: Popular Articles */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE]/80 p-6 shadow-[0_12px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#F97316]" />
                <h3 className="text-base font-extrabold text-[#08093B]">
                  Popular Articles
                </h3>
              </div>

              <div className="mt-4 space-y-3.5">
                {POPULAR_ARTICLES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-[#F6F5FD]"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </span>
                        <span className="mt-1 text-[11px] font-medium text-[#7C829E]">
                          {item.date} &bull; {item.readTime}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Widget 3: Topics with count badges */}
            <div className="rounded-[22px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#F5F1FE]/80 p-6 shadow-[0_12px_32px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#7C3AED]" />
                <h3 className="text-base font-extrabold text-[#08093B]">Topics</h3>
              </div>

              <div className="mt-4 space-y-2">
                {TOPICS.map((topic) => {
                  const isTopicActive = selectedCategory === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(topic.id);
                        setCurrentPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                        isTopicActive
                          ? "bg-[#EDE7FF] font-bold text-[#663CF6]"
                          : "text-[#4D5072] hover:bg-[#F8FAFC] hover:text-[#663CF6]"
                      }`}
                    >
                      <span>{topic.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isTopicActive
                            ? "bg-[#663CF6] text-white"
                            : "bg-[#F1F3FB] text-[#6B7280]"
                        }`}
                      >
                        {topic.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget 4: Transform Your School Operations CTA Card */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#CDC2F7] bg-gradient-to-b from-white/95 via-[#FAF8FF] to-[#EDE7FF]/80 p-6 text-center shadow-[0_16px_40px_rgba(24,18,77,0.08)] backdrop-blur-sm">
              <div className="mx-auto max-w-[160px] pb-2">
                <SchoolIllustration />
              </div>

              <h3 className="text-lg font-extrabold text-[#08093B]">
                Transform Your School Operations
              </h3>

              <p className="mt-1.5 text-xs font-medium text-[#5A5E7A] leading-relaxed">
                Join 1,000+ schools already using ScholoNix.
              </p>

              <div className="mt-4">
                <Link
                  href="/register?step=1"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          5. FOOTER (Matching Site Standards)
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
              {/* Social Links */}
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
                  <Link href="/for-schools" className="hover:text-[#663CF6]">
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
                  <Link href="/blog" className="text-[#663CF6] font-bold">
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

            {/* Stay Updated Newsletter */}
            <div className="space-y-3 sm:col-span-2 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Stay Updated
              </h4>
              <p className="text-xs text-[#5A5E7A]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
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
