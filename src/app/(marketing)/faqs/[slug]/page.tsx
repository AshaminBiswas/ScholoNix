import { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqDetailPage } from "@/modules/marketing/components/faq-detail-page";
import {
  getAllFaqSlugs,
  getFaqBySlug,
} from "@/modules/marketing/data/faqs-data";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllFaqSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getFaqBySlug(slug);

  if (!article) {
    return {
      title: "FAQ Not Found | ScholoNix",
    };
  }

  return {
    title: `${article.question} | ScholoNix FAQs`,
    description: article.subtitle || article.overview.slice(0, 160),
    alternates: {
      canonical: `/faqs/${slug}`,
    },
    openGraph: {
      title: `${article.question} | ScholoNix`,
      description: article.subtitle || article.overview.slice(0, 160),
      url: `/faqs/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.question,
      description: article.subtitle || article.overview.slice(0, 160),
    },
  };
}

export default async function DynamicFaqPage({ params }: PageProps) {
  const { slug } = await params;
  const article = getFaqBySlug(slug);

  if (!article) {
    notFound();
  }

  const faqDetailSchema = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: article.question,
    text: article.overview,
    acceptedAnswer: {
      "@type": "Answer",
      text: `${article.overview} ${article.howItWorks}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqDetailSchema) }}
      />
      <FaqDetailPage article={article} />
    </>
  );
}
