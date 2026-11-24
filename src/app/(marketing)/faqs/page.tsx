import { Metadata } from "next";
import { FaqsPage } from "@/modules/marketing/components/faqs-page";
import { FAQ_CATEGORIES } from "@/modules/marketing/data/faqs-data";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQs) | ScholoNix",
  description:
    "Find quick answers to common questions about ScholoNix features, transparent pricing plans, security & data compliance, student attendance, and setup onboarding.",
  keywords: [
    "School Management FAQ",
    "School SaaS questions",
    "School software pricing FAQ",
    "School onboarding guide",
    "Student data security FAQ",
    "School ERP questions and answers",
  ],
  alternates: {
    canonical: "/faqs",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQs) | ScholoNix",
    description:
      "Find quick answers to common questions about ScholoNix features, pricing, security, attendance, and onboarding.",
    url: "/faqs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | ScholoNix",
    description:
      "Quick answers about our all-in-one cloud platform for schools, teachers, and parents.",
  },
};

export default function Page() {
  // Generate structured FAQPage schema for search engines
  const allQuestions = FAQ_CATEGORIES.flatMap((cat) => cat.items);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqsPage />
    </>
  );
}
