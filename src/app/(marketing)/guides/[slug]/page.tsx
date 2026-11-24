import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailPage } from "@/modules/marketing/components/guide-detail-page";
import {
  getAllGuideSlugs,
  getGuideBySlug,
  ALL_GUIDES,
} from "@/modules/marketing/data/guides-data";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | ScholoNix",
    };
  }

  return {
    title: `${guide.title} | Step-by-Step Guides | ScholoNix`,
    description: guide.description,
    alternates: {
      canonical: `/guides/${slug}`,
    },
    openGraph: {
      title: `${guide.title} | ScholoNix Guides`,
      description: guide.description,
      url: `/guides/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function DynamicGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  // Find index in ALL_GUIDES to determine prev and next
  const currentIndex = ALL_GUIDES.findIndex((g) => g.slug === slug);
  const prevGuide = currentIndex > 0 ? ALL_GUIDES[currentIndex - 1] ?? null : null;
  const nextGuide =
    currentIndex < ALL_GUIDES.length - 1 ? ALL_GUIDES[currentIndex + 1] ?? null : null;

  // Related guides in same category
  const relatedGuides = ALL_GUIDES.filter(
    (g) => g.categoryId === guide.categoryId && g.slug !== guide.slug
  ).slice(0, 3);

  // HowTo Structured Data for Google rich results
  const steps = guide.steps && guide.steps.length > 0
    ? guide.steps
    : [
        {
          stepNumber: 1,
          title: `Access ${guide.category} Module`,
          description: `Navigate to your school admin dashboard, locate the navigation drawer on the left sidebar, and select the ${guide.category} section to begin configuration.`,
        },
        {
          stepNumber: 2,
          title: "Configure Master Settings & Parameters",
          description: `Review the default settings for ${guide.title.toLowerCase()}. Adjust validation rules, naming conventions, and notification defaults to match your school's operating procedures.`,
        },
        {
          stepNumber: 3,
          title: "Input Data & Review Validations",
          description: "Enter required information into the intuitive form fields or upload your formatted spreadsheet. The system performs automatic syntax and duplicate checks.",
        },
        {
          stepNumber: 4,
          title: "Publish Changes & Notify Stakeholders",
          description: "Save and deploy the updated configuration. The cloud system securely updates all teacher, student, and parent apps in real time.",
        },
      ];

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: guide.description,
    step: steps.map((s) => ({
      "@type": "HowToStep",
      position: s.stepNumber,
      name: s.title,
      text: s.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <GuideDetailPage
        guide={guide}
        relatedGuides={relatedGuides}
        prevGuide={prevGuide}
        nextGuide={nextGuide}
      />
    </>
  );
}
