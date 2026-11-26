"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  Home,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Share2,
  CheckCircle2,
  Mail,
  ListOrdered,
  BookMarked,
  Settings,
  Users,
  BarChart3,
  Heart,
  CornerDownRight,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Linkedin,
  Facebook,
  Twitter,
  Link2,
  ArrowLeft,
  Youtube,
  Instagram,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { SchoolIllustration } from "@/modules/schools/components/school-illustration";
import type { BlogPostData } from "../data/blog-data";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface BlogPostPageProps {
  post: BlogPostData;
  relatedPosts: BlogPostData[];
  prevPost: BlogPostData | null;
  nextPost: BlogPostData | null;
}

export function BlogPostPage({
  post,
  relatedPosts,
  prevPost,
  nextPost,
}: BlogPostPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>(
    post.tableOfContents[0]?.id || "intro"
  );
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Dynamic comments state
  const [comments, setComments] = useState(post.comments);
  const [newCommentText, setNewCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Save / Bookmark toggle
  const handleToggleSave = () => {
    setIsSaved((prev) => {
      const next = !prev;
      showToast(next ? "Article saved to your reading list!" : "Article removed from saved");
      return next;
    });
  };

  // Share link handler
  const handleShare = async () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title,
            text: post.subtitle,
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

  // Like comment handler
  const handleLikeComment = (commentId: string) => {
    setLikedComments((prev) => {
      const currentlyLiked = prev[commentId];
      const nextLiked = !currentlyLiked;
      setComments((all) =>
        all.map((c) =>
          c.id === commentId ? { ...c, likes: c.likes + (nextLiked ? 1 : -1) } : c
        )
      );
      return { ...prev, [commentId]: nextLiked };
    });
  };

  // Add new comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `user-${Date.now()}`,
      author: "You (Educator)",
      initials: "ME",
      date: "Just now",
      content: newCommentText.trim(),
      likes: 1,
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    showToast("🎉 Your comment has been posted!");
  };

  // Newsletter subscribe
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
    }, 800);
  };

  // Scrollspy observer for Table of Contents
  useEffect(() => {
    const handleScroll = () => {
      const headings = post.tableOfContents.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const tocItem = post.tableOfContents[i];
        if (heading && tocItem && heading.offsetTop <= scrollPosition) {
          setActiveHeading(tocItem.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post.tableOfContents]);

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
            <Link href="/#for-schools" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              For Schools
            </Link>
            {/* Active Resources Dropdown */}
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
                href="/#for-schools"
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =========================================================================
            2. BREADCRUMBS
            ========================================================================= */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#A5ACD2] pb-6"
        >
          <Link
            href="/"
            className="flex items-center gap-1 text-[#4D5072] dark:text-[#B4B9DA] transition hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0] dark:text-[#888EB5]" />
          <Link href="/blog" className="transition hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
            Blog
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0] dark:text-[#888EB5]" />
          <Link
            href={`/blog?category=${post.categoryId}`}
            className="transition hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
          >
            {post.categoryName}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A0A4C0] dark:text-[#888EB5]" />
          <span className="text-[#08093B] dark:text-[#F3F5FF] font-bold truncate max-w-xs sm:max-w-md">
            {post.title}
          </span>
        </nav>

        {/* =========================================================================
            3. MAIN ARTICLE GRID (8 cols Left / 4 cols Right)
            ========================================================================= */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* =======================================================================
              LEFT CONTENT (Article Header, Cover, Content, Previous/Next, Comments)
              ======================================================================= */}
          <article ref={articleRef} className="space-y-8 lg:col-span-8">
            {/* Category Tag */}
            <div>
              <span className="inline-block rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-3.5 py-1 text-xs font-extrabold text-[#663CF6] dark:text-[#B59CFF] shadow-xs">
                {post.categoryName}
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-4xl lg:text-5xl lg:leading-[1.18]">
                {post.title}
              </h1>
              <p className="text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
                {post.subtitle}
              </p>
            </div>

            {/* Author Row & Save/Share Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#EAEFF8] dark:border-[#252A4E] py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#663CF6] to-[#38BDF8] text-sm font-bold text-white shadow-xs">
                  {post.author.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    {post.author.name}
                  </div>
                  <div className="text-xs font-medium text-[#7C829E] dark:text-[#969CC2]">
                    {post.author.date} &bull; {post.author.readTime}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    isSaved
                      ? "border-[#7C3AED] dark:border-[#8B5CF6] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]"
                      : "border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] text-[#4D5072] dark:text-[#B4B9DA] hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isSaved ? "fill-[#663CF6] text-[#663CF6] dark:text-[#B59CFF]" : ""}`}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] px-3.5 py-2 text-xs font-bold text-[#4D5072] dark:text-[#B4B9DA] transition-all hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Large Cover Hero Artwork */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0]/80 dark:border-[#2C3159]/90 bg-gradient-to-br from-[#E0F2FE] dark:from-[#122440] via-[#EDE7FF] dark:via-[#221A44] to-[#F5F3FF] dark:to-[#201C45] p-6 sm:p-10 shadow-[0_16px_40px_rgba(24,18,77,0.06)]">
              <div className="mx-auto max-w-lg">
                <SchoolIllustration />
              </div>
            </div>

            {/* Introduction Lead */}
            <div className="text-base font-medium leading-relaxed text-[#374151] dark:text-[#E2E6FF]">
              <p>{post.content.intro}</p>
            </div>

            {/* Mobile Table of Contents (Inline, Collapsible, Static) */}
            <div className="rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F1FE] dark:to-[#211C47] p-4 shadow-sm lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTocOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={mobileTocOpen}
              >
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-[#7C3AED] dark:text-[#B99BFF]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#08093B] dark:text-[#F3F5FF]">
                    Table of Contents
                  </span>
                  <span className="rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-2 py-0.5 text-[10px] font-bold text-[#663CF6] dark:text-[#B59CFF]">
                    {post.tableOfContents.length} sections
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#7C3AED] dark:text-[#B99BFF] transition-transform duration-200 ${
                    mobileTocOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileTocOpen && (
                <nav className="mt-3 space-y-1.5 border-t border-[#EDE7FF] dark:border-[#342B61] pt-3">
                  {post.tableOfContents.map((item) => {
                    const isActive = activeHeading === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setActiveHeading(item.id)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#EDE7FF] dark:bg-[#251D4A] font-bold text-[#663CF6] dark:text-[#B59CFF]"
                            : "text-[#4D5072] dark:text-[#B4B9DA] hover:bg-[#F8FAFC] dark:hover:bg-[#1E2248] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-[#663CF6]" : "bg-[#CBD5E1] dark:bg-[#3A406D]"
                          }`}
                        />
                        <span>{item.title}</span>
                      </a>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Section 1 */}
            <section id="what-is-digital-transformation" className="space-y-3 pt-2">
              <h2 className="text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {post.content.section1.heading}
              </h2>
              <p className="text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
                {post.content.section1.text}
              </p>
            </section>

            {/* Key Benefits for Schools Box */}
            <section
              id="key-benefits-for-schools"
              className="rounded-[22px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#EDE7FF]/70 dark:to-[#251D4A]/75 p-6 sm:p-8 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {post.content.benefitsHeading}
                </h3>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {post.content.benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center rounded-xl border border-[#CDC2F7]/60 dark:border-[#40347A]/70 bg-white/90 dark:bg-[#141731]/90 p-3.5 text-center shadow-xs transition hover:bg-white dark:hover:bg-[#1C2042] hover:border-[#663CF6] dark:hover:border-[#9D7CFE]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60">
                      {b.iconType === "settings" && <Settings className="h-5 w-5" />}
                      {b.iconType === "graduation" && <GraduationCap className="h-5 w-5" />}
                      {b.iconType === "users" && <Users className="h-5 w-5" />}
                      {b.iconType === "chart" && <BarChart3 className="h-5 w-5" />}
                    </div>
                    <span className="mt-2 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] leading-tight">
                      {b.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Step-by-Step Guide */}
            <section id="step-by-step-guide" className="space-y-5 pt-2">
              <h2 className="text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {post.content.section2.heading}
              </h2>

              <div className="space-y-4">
                {post.content.section2.steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex items-start gap-4 rounded-xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F1FE] dark:to-[#211C47] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] dark:bg-[#251D4A] text-sm font-extrabold text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE]/60 dark:ring-[#42357D]/60">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF] leading-tight">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA] sm:text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="space-y-3 pt-2">
              <h2 className="text-2xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {post.content.conclusion.heading}
              </h2>
              <p className="text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
                {post.content.conclusion.text}
              </p>
            </section>

            {/* Tags & Social Share Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EAEFF8] dark:border-[#252A4E] pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Tags:</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?search=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-[#F1F3FB] dark:bg-[#1B1F40] px-3 py-1 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA] transition hover:bg-[#EDE7FF] dark:hover:bg-[#2E245E] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Social Share Icons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">Share:</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  title="Share on LinkedIn"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6DBF0] dark:border-[#2C3159] text-[#4D5072] dark:text-[#B4B9DA] transition hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                  title="Copy Link"
                  aria-label="Copy Link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Previous & Next Article Cards */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F1FE] dark:to-[#211C47] p-4 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                    <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
                    <span>Previous Article</span>
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition line-clamp-2">
                    {prevPost.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F1FE] dark:to-[#211C47] p-4 text-right shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE] hover:shadow-[0_12px_28px_rgba(102,60,246,0.12)]"
                >
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                    <span>Next Article</span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-bold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition line-clamp-2">
                    {nextPost.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>

            {/* Author Bio Card */}
            <div className="flex items-start gap-4 rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F3EEFF]/80 dark:to-[#221C4A]/80 p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#38BDF8] text-base font-bold text-white shadow-md">
                {post.author.initials}
              </div>
              <div className="space-y-1.5">
                <div className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {post.author.name}
                </div>
                <div className="text-xs font-semibold text-[#663CF6] dark:text-[#B59CFF]">
                  {post.author.role}
                </div>
                <p className="text-xs font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA]">
                  {post.author.bio}
                </p>
              </div>
            </div>

            {/* ===================================================================
                COMMENTS SECTION
                =================================================================== */}
            <section className="space-y-6 border-t border-[#EAEFF8] dark:border-[#252A4E] pt-8">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#663CF6] dark:text-[#B59CFF]" />
                <h3 className="text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F5F1FE] dark:to-[#211C47] p-4 sm:p-5 shadow-[0_6px_20px_rgba(24,18,77,0.06)] backdrop-blur-sm transition hover:border-[#663CF6] dark:hover:border-[#9D7CFE]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                          {comment.initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            {comment.author}
                          </div>
                          <div className="text-[11px] font-medium text-[#7C829E] dark:text-[#969CC2]">
                            {comment.date}
                          </div>
                        </div>
                      </div>

                      {/* Heart Like Button */}
                      <button
                        type="button"
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                          likedComments[comment.id]
                            ? "border-rose-300 dark:border-rose-700/70 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                            : "border-[#D6DBF0] dark:border-[#2C3159] text-[#7C829E] dark:text-[#969CC2] hover:border-rose-300 dark:hover:border-rose-600 hover:text-rose-600 dark:hover:text-rose-300"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            likedComments[comment.id] ? "fill-rose-500 text-rose-500 dark:text-rose-400" : ""
                          }`}
                        />
                        <span>{comment.likes}</span>
                      </button>
                    </div>

                    <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                      {comment.content}
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNewCommentText(`@${comment.author} `);
                          showToast(`Replying to ${comment.author}`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                      >
                        <CornerDownRight className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add a Comment Form */}
              <div className="rounded-2xl border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F4EFFE] dark:to-[#211C47] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
                <h4 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">Add a Comment</h4>
                <form onSubmit={handlePostComment} className="mt-3 space-y-3">
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write your comment..."
                    className="w-full rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] p-3 text-xs sm:text-sm font-medium text-[#08093B] dark:text-[#F3F5FF] placeholder-[#8E92BC] dark:placeholder-[#7A81AC] outline-none focus:border-[#7C3AED] dark:focus:border-[#9D7CFE] focus:ring-2 focus:ring-[#7C3AED]/15"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </article>

          {/* =======================================================================
              RIGHT SIDEBAR: Table of Contents, Related Articles, Newsletter, CTA
              ======================================================================= */}
          <aside ref={sidebarRef} className="space-y-6 lg:col-span-4 lg:self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Widget 1: Table of Contents */}
            <div className="rounded-[22px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F4F0FE] dark:to-[#211C47] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-[#7C3AED] dark:text-[#B99BFF]" />
                <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Table of Contents
                </h3>
              </div>

              <nav className="mt-4 space-y-2">
                {post.tableOfContents.map((item) => {
                  const isActive = activeHeading === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setActiveHeading(item.id)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#EDE7FF] dark:bg-[#251D4A] font-bold text-[#663CF6] dark:text-[#B59CFF]"
                          : "text-[#4D5072] dark:text-[#B4B9DA] hover:bg-[#F8FAFC] dark:hover:bg-[#1E2248] hover:text-[#663CF6] dark:hover:text-[#C4B5FD]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          isActive ? "bg-[#663CF6] scale-125" : "bg-[#CBD5E1] dark:bg-[#3A406D]"
                        }`}
                      />
                      <span>{item.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Widget 2: Related Articles */}
            <div className="rounded-[22px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-b from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#F4F0FE] dark:to-[#211C47] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-[#7C3AED] dark:text-[#B99BFF]" />
                <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Related Articles
                </h3>
              </div>

              <div className="mt-4 space-y-3.5">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-[#F6F5FD] dark:hover:bg-[#221D45]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] transition-transform group-hover:scale-105">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] group-hover:text-[#663CF6] dark:group-hover:text-[#C4B5FD] transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </span>
                      <span className="mt-1 text-[11px] font-medium text-[#7C829E] dark:text-[#969CC2]">
                        {item.author.date} &bull; {item.author.readTime}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Widget 3: Subscribe to Our Blog */}
            <div className="rounded-[22px] border border-[#CDC2F7] dark:border-[#40347A] bg-gradient-to-br from-white/95 dark:from-[#141731]/95 via-[#FAF8FF] dark:via-[#191C3B] to-[#EDE7FF]/80 dark:to-[#251D4A]/85 p-6 shadow-[0_8px_24px_rgba(24,18,77,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  Subscribe to Our Blog
                </h3>
              </div>

              <p className="mt-2 text-xs font-medium leading-relaxed text-[#5A5E7A] dark:text-[#B4B9DA]">
                Get the latest articles, tips and resources delivered to your inbox.
              </p>

              <form onSubmit={handleSubscribe} className="mt-3">
                <div className="relative flex items-center rounded-xl border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-1 shadow-xs transition-all focus-within:border-[#7C3AED] dark:focus-within:border-[#9D7CFE]">
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent px-2.5 text-xs font-medium text-[#08093B] dark:text-[#F3F5FF] placeholder-[#8E92BC] dark:placeholder-[#7A81AC] outline-none"
                    disabled={isSubscribed}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing || isSubscribed}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#663CF6] text-white shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    aria-label="Subscribe"
                  >
                    {isSubscribing ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white dark:border-[#2C3159] border-t-transparent" />
                    ) : isSubscribed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {isSubscribed && (
                  <p className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    &check; You are subscribed to updates!
                  </p>
                )}
              </form>
            </div>

            {/* Widget 4: See It in Action (CTA Card) */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0]/80 bg-gradient-to-b from-[#8B5CF6] via-[#7C3AED] to-[#663CF6] p-6 text-center text-white shadow-xl shadow-[#7C3AED]/20">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                <Calendar className="h-3.5 w-3.5" />
                <span>See It in Action</span>
              </div>

              <p className="mt-3 text-xs font-medium text-white/90 leading-relaxed">
                Book a personalized demo and discover how ScholoNix can work for your school.
              </p>

              <div className="mt-4">
                <Link
                  href="/register?step=1"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#141731] px-5 py-2.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] shadow-md transition-all hover:bg-[#F7F4FF] dark:hover:bg-[#241E4A] hover:scale-105"
                >
                  <span>Book a Demo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Laptop Graphic */}
              <div className="mt-6 flex justify-center">
                <svg viewBox="0 0 200 120" className="w-44 h-auto drop-shadow-lg" fill="none">
                  <rect x="25" y="15" width="150" height="90" rx="8" fill="#FFFFFF" />
                  <rect x="32" y="22" width="136" height="76" rx="4" fill="#F8FAFC" />
                  {/* Rising bars */}
                  <rect x="45" y="60" width="10" height="30" rx="2" fill="#C4B5FD" />
                  <rect x="62" y="50" width="10" height="40" rx="2" fill="#A78BFA" />
                  <rect x="79" y="38" width="10" height="52" rx="2" fill="#8B5CF6" />
                  <rect x="96" y="44" width="10" height="46" rx="2" fill="#7C3AED" />
                  <rect x="113" y="30" width="10" height="60" rx="2" fill="#6D28D9" />
                  <rect x="130" y="25" width="10" height="65" rx="2" fill="#4C1D95" />
                  {/* Base */}
                  <path d="M10 105 L190 105 L175 114 L25 114 Z" fill="#E2E8F0" />
                </svg>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          4. FOOTER (Matching Site Standards)
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
                  <Link href="/#for-schools" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
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
                  <Link href="/blog" className="text-[#663CF6] dark:text-[#B59CFF] font-bold">
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
                  <Link href="/#contact" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
                    Contact Us
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
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
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
