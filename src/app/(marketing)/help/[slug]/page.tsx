import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticlePage } from "@/modules/marketing/components/help-article-page";
import {
  DETAILED_HELP_ARTICLES,
  getDetailedHelpArticleBySlug,
  getRelatedHelpArticles,
  getAdjacentHelpArticles,
} from "@/modules/marketing/data/help-data";

interface HelpArticleRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return DETAILED_HELP_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: HelpArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getDetailedHelpArticleBySlug(slug);

  if (!article) {
    return {
      title: "Help Article Not Found | ScholoNix",
    };
  }

  return {
    title: `${article.title} | ScholoNix Help Center`,
    description: article.subtitle,
    openGraph: {
      title: `${article.title} | ScholoNix`,
      description: article.subtitle,
      url: `https://schoolmanagementsaas.in/help/${article.slug}`,
      siteName: "ScholoNix",
      type: "article",
    },
    alternates: {
      canonical: `/help/${article.slug}`,
    },
  };
}

export default async function HelpArticleRoutePage({ params }: HelpArticleRouteProps) {
  const { slug } = await params;
  const article = getDetailedHelpArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedHelpArticles(article.relatedSlugs);
  const { prev, next } = getAdjacentHelpArticles(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: article.title,
    description: article.subtitle,
    step: article.setupSteps.map((step) => ({
      "@type": "HowToStep",
      position: step.number,
      name: step.title,
      text: step.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpArticlePage
        article={article}
        relatedArticles={relatedArticles}
        prevArticle={prev}
        nextArticle={next}
      />
    </>
  );
}
