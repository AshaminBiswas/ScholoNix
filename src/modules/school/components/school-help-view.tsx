"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Clock,
  Play,
  Rocket,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  DETAILED_HELP_ARTICLES,
  HELP_TOPICS,
  VIDEO_TUTORIALS,
  type HelpTopic,
} from "@/modules/marketing/data/help-data";
import {
  SchoolWorkspaceShell,
  buildSchoolRoute,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "./school-workspace-shell";

interface SchoolHelpViewProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
}

function TopicIcon({ type }: { type: HelpTopic["iconType"] }) {
  switch (type) {
    case "rocket":
      return <Rocket className="h-5 w-5" />;
    case "settings":
      return <Settings className="h-5 w-5" />;
    case "users":
      return <Users className="h-5 w-5" />;
    case "academics":
      return <GraduationCap className="h-5 w-5" />;
    case "attendance":
      return <Calendar className="h-5 w-5" />;
    case "fees":
      return <CreditCard className="h-5 w-5" />;
    case "reports":
      return <BarChart3 className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
}

export function SchoolHelpView({ school, user }: SchoolHelpViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const dashboardHref = buildSchoolRoute(school.slug);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HELP_TOPICS.filter((topic) => {
      const categoryOk = selectedCategory === "all" || topic.id === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.articles.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DETAILED_HELP_ARTICLES.filter((article) => {
      const categoryOk =
        selectedCategory === "all" || article.categoryId === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <SchoolWorkspaceShell school={school} user={user} activeNav="help">
      {/* Breadcrumb & Header Banner */}
      <div className="rounded-[22px] border border-[#D6DBF0] bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {school.name} Dashboard</span>
          </Link>
          <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-bold text-[#663CF6]">
            Authenticated School Help Center
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#08093B]">
          Help Center for {school.name}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#4D5072] max-w-2xl">
          Step-by-step setup guides, workflows, and troubleshooting documentation right inside your school workspace.
        </p>

        {/* Search Input */}
        <div className="mt-5 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
          <input
            id="school-help-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides on setup, admissions, attendance, fees..."
            className="w-full rounded-[14px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-[#08093B] placeholder-[#9094B0] focus:border-[#663CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EDE7FF]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#663CF6] text-white shadow-xs"
                : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6]"
            }`}
          >
            All Topics
          </button>
          {HELP_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedCategory(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                selectedCategory === t.id
                  ? "bg-[#663CF6] text-white shadow-xs"
                  : "border border-[#D6DBF0] bg-white text-[#4D5072] hover:border-[#663CF6]"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Articles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-[#08093B] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#663CF6]" />
            <span>Step-by-Step Guides</span>
          </h2>
          <span className="text-xs font-semibold text-[#76799C]">
            {filteredArticles.length} guide{filteredArticles.length === 1 ? "" : "s"}
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-8 text-center text-xs text-[#76799C]">
            No help guides matched &ldquo;{searchQuery}&rdquo;. Try another keyword or choose All Topics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={buildSchoolRoute(school.slug, `help/${article.slug}`)}
                className="group rounded-[18px] border border-[#D6DBF0] bg-white p-5 shadow-xs transition hover:border-[#663CF6] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-[#EDE7FF] px-2.5 py-0.5 text-[#663CF6]">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[#76799C]">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-extrabold text-[#08093B] group-hover:text-[#663CF6] transition">
                    {article.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#4D5072] line-clamp-2">
                    {article.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-xs font-bold text-[#663CF6]">
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Topics Directory & Quick Video Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-8 space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#08093B]">Browse by Module</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EDE7FF] text-[#663CF6]">
                    <TopicIcon type={topic.iconType} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#08093B]">{topic.title}</h3>
                    <p className="text-[11px] text-[#76799C]">{topic.articleCount} resources</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-[#4D5072]">{topic.description}</p>
                <ul className="mt-3 space-y-1.5 border-t border-[#F0F2FA] pt-2.5 text-xs text-[#1B1D45]">
                  {topic.articles.map((title) => {
                    const matched = DETAILED_HELP_ARTICLES.find(
                      (a) => a.title.toLowerCase() === title.toLowerCase(),
                    );
                    return (
                      <li key={title}>
                        {matched ? (
                          <Link
                            href={buildSchoolRoute(school.slug, `help/${matched.slug}`)}
                            className="font-semibold text-[#663CF6] hover:underline flex items-center gap-1.5"
                          >
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span>{title}</span>
                          </Link>
                        ) : (
                          <span className="text-[#4D5072] flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#CAD0EB] shrink-0" />
                            <span>{title}</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#08093B]">Quick Walkthroughs</h2>
          <div className="rounded-[18px] border border-[#D6DBF0] bg-white p-4 shadow-xs space-y-3">
            {VIDEO_TUTORIALS.map((vid) => (
              <div
                key={vid.id}
                className="flex items-start gap-3 rounded-[12px] border border-[#E2E6F5] bg-[#FAF8FE] p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#663CF6] text-white">
                  <Play className="h-3.5 w-3.5 ml-0.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#08093B] leading-snug">{vid.title}</p>
                  <p className="mt-0.5 text-[10px] text-[#76799C]">{vid.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SchoolWorkspaceShell>
  );
}
