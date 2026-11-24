import { Metadata } from "next";
import { GuidesPage } from "@/modules/marketing/components/guides-page";
import { ALL_GUIDES } from "@/modules/marketing/data/guides-data";

export const metadata: Metadata = {
  title: "Step-by-Step Guides | ScholoNix",
  description:
    "Learn how to set up, use and get the most out of ScholoNix with our detailed, step-by-step guides for school administrators, teachers, and staff.",
  keywords: [
    "School Management Guides",
    "School SaaS Tutorials",
    "School Setup Guide",
    "Teacher Onboarding Guide",
    "School ERP Documentation",
    "Fee Management Setup",
    "Timetable Creation Guide",
  ],
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "Step-by-Step Guides | ScholoNix",
    description:
      "Learn how to set up, use and get the most out of ScholoNix with our detailed guides.",
    url: "/guides",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Step-by-Step Guides | ScholoNix",
    description:
      "Master school operations with step-by-step guides for admissions, timetables, fee management, and parent communication.",
  },
};

export default function Page() {
  // Generate structured ItemList schema for Google Search & SEO
  const guidesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ScholoNix Step-by-Step Guides",
    description:
      "Comprehensive tutorials and operational walkthroughs for school administrators and staff.",
    itemListElement: ALL_GUIDES.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      description: guide.description,
      url: `https://schoolmanagementsaas.com/guides/${guide.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesSchema) }}
      />
      <GuidesPage />
    </>
  );
}
