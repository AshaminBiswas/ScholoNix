"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  BookOpen,
} from "lucide-react";
import type { DetailedHelpArticle } from "@/modules/marketing/data/help-data";
import {
  SchoolWorkspaceShell,
  buildSchoolRoute,
  type SchoolShellSchool,
  type SchoolShellUser,
} from "./school-workspace-shell";

interface SchoolHelpArticleViewProps {
  school: SchoolShellSchool;
  user: SchoolShellUser;
  article: DetailedHelpArticle;
  relatedArticles: DetailedHelpArticle[];
  prevArticle: DetailedHelpArticle | null;
  nextArticle: DetailedHelpArticle | null;
}

export function SchoolHelpArticleView({
  school,
  user,
  article,
  relatedArticles,
  prevArticle,
  nextArticle,
}: SchoolHelpArticleViewProps) {
  const helpHomeHref = buildSchoolRoute(school.slug, "help");
  const dashboardHref = buildSchoolRoute(school.slug);

  const rewriteHelpHref = (rawHref: string) => {
    const slug = rawHref.replace(/^\/?help\/?/, "").trim();
    return slug ? buildSchoolRoute(school.slug, `help/${slug}`) : helpHomeHref;
  };

  return (
    <SchoolWorkspaceShell school={school} user={user} activeNav="help">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#76799C]">
        <Link href={dashboardHref} className="hover:text-[#663CF6]">
          {school.name}
        </Link>
        <span>/</span>
        <Link href={helpHomeHref} className="hover:text-[#663CF6]">
          Help Center
        </Link>
        <span>/</span>
        <span className="text-[#08093B] font-bold">{article.title}</span>
      </nav>

      {/* Main Article Card */}
      <article className="rounded-[22px] border border-[#D6DBF0] bg-white p-5 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#F0F2FA] pb-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold mb-3">
            <span className="rounded-full bg-[#EDE7FF] px-3 py-1 text-[#663CF6]">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[#76799C]">
              <Clock className="h-3.5 w-3.5" />
              {article.readTime}
            </span>
            <span className="text-[#76799C]">Updated {article.lastUpdated}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#08093B]">
            {article.title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4D5072]">
            {article.subtitle}
          </p>
        </div>

        {/* Overview & Prerequisites */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#08093B] mb-1.5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#663CF6]" />
              <span>Overview</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4D5072]">
              {article.overviewText}
            </p>
          </div>

          <div className="rounded-[14px] border border-[#DCEAF8] bg-[#F4F8FD] p-4 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#08093B]">Before You Start</p>
              <p className="mt-0.5 text-xs text-[#4D5072]">{article.beforeYouStart}</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-[#08093B]">Step-by-Step Instructions</h2>
          <ol className="space-y-3">
            {article.setupSteps.map((step) => (
              <li
                key={step.number}
                className="flex items-start gap-3 rounded-[14px] border border-[#E2E6F5] bg-[#FAF8FE] p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#663CF6] text-xs font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#08093B]">{step.title}</h3>
                  <p className="mt-0.5 text-xs text-[#4D5072] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Completion Note */}
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <p className="text-xs font-semibold text-emerald-900">{article.allSetMessage}</p>
        </div>

        {/* What's Next (In-portal links) */}
        {article.whatsNext.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h2 className="text-sm font-extrabold text-[#08093B]">Next Recommended Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.whatsNext.map((item) => (
                <Link
                  key={item.title}
                  href={rewriteHelpHref(item.href)}
                  className="rounded-[14px] border border-[#D6DBF0] bg-white p-3.5 hover:border-[#663CF6] transition flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-[#08093B]">{item.title}</p>
                    <p className="text-[11px] text-[#76799C]">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#663CF6] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev / Next Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE3F5] pt-5">
          {prevArticle ? (
            <Link
              href={buildSchoolRoute(school.slug, `help/${prevArticle.slug}`)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{prevArticle.title}</span>
            </Link>
          ) : (
            <Link
              href={helpHomeHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Help Guides</span>
            </Link>
          )}

          {nextArticle && (
            <Link
              href={buildSchoolRoute(school.slug, `help/${nextArticle.slug}`)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
            >
              <span>{nextArticle.title}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </article>

      {/* Related Guides */}
      {relatedArticles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-[#08093B]">Related School Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={buildSchoolRoute(school.slug, `help/${rel.slug}`)}
                className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 hover:border-[#663CF6] transition"
              >
                <span className="text-[10px] font-bold text-[#663CF6]">{rel.category}</span>
                <p className="mt-1 text-xs font-bold text-[#08093B]">{rel.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </SchoolWorkspaceShell>
  );
}
