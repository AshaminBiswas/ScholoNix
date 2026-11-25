import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import {
  getAdjacentHelpArticles,
  getDetailedHelpArticleBySlug,
  getRelatedHelpArticles,
} from "@/modules/marketing/data/help-data";
import { SchoolHelpArticleView } from "@/modules/school/components/school-help-article-view";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { buildSchoolShellProps } from "@/modules/school/utils/shell-props";

export const dynamic = "force-dynamic";

interface SchoolHelpArticlePageProps {
  params: Promise<{ schoolSlug: string; articleSlug: string }>;
}

export async function generateMetadata({
  params,
}: SchoolHelpArticlePageProps): Promise<Metadata> {
  const { articleSlug } = await params;
  const article = getDetailedHelpArticleBySlug(articleSlug);
  return {
    title: article ? `${article.title} · Help Center | ScholoNix` : "Help Guide | ScholoNix",
    robots: { index: false, follow: false },
  };
}

export default async function SchoolHelpArticlePage({
  params,
}: SchoolHelpArticlePageProps) {
  const { schoolSlug, articleSlug } = await params;
  const access = await resolveTenantRouteAccess(
    schoolSlug,
    `/${schoolSlug}/help/${articleSlug}`,
  );

  if (!access.authorized) {
    return (
      <TenantUnauthorizedView
        ownSchoolSlug={access.ownSchool.slug}
        ownSchoolName={access.ownSchool.name}
      />
    );
  }

  const article = getDetailedHelpArticleBySlug(articleSlug);
  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedHelpArticles(article.relatedSlugs);
  const { prev, next } = getAdjacentHelpArticles(article.slug);

  const { school, user } = buildSchoolShellProps(access.school, access.session.user);
  return (
    <SchoolHelpArticleView
      school={school}
      user={user}
      article={article}
      relatedArticles={relatedArticles}
      prevArticle={prev}
      nextArticle={next}
    />
  );
}
