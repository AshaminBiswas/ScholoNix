import type { Metadata } from "next";
import { HelpPage } from "@/modules/marketing/components/help-page";

export const metadata: Metadata = {
  title: "Help Center & Knowledge Base | ScholoNix",
  description:
    "Find answers, step-by-step guides, video tutorials, and documentation for ScholoNix. Learn how to set up accounts, add students, manage fees, and mark attendance.",
  keywords: [
    "school management help center",
    "school software documentation",
    "school setup tutorial",
    "bulk student csv import help",
    "school fee configuration guide",
    "education software support",
  ],
  openGraph: {
    title: "Help Center & Knowledge Base | ScholoNix",
    description:
      "Find answers, step-by-step guides, video tutorials, and documentation for ScholoNix.",
    url: "https://schoolmanagementsaas.in/help",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/help",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How to set up your school account",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Configure institutional profile, academic sessions, campus locations, and administrator roles through Admin Dashboard > Settings > Institution Profile.",
      },
    },
    {
      "@type": "Question",
      name: "How to add students in bulk using CSV upload",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Download the pre-formatted CSV template from Students > Directory > Bulk Import, paste student details, and upload for automated validation.",
      },
    },
    {
      "@type": "Question",
      name: "How to configure fee structures and collect payments online",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open Fees & Finance > Fee Structures, set billing schedules, enable automated SMS reminders, and collect payments online via integrated Razorpay/UPI gateway.",
      },
    },
  ],
};

export default function HelpRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpPage />
    </>
  );
}
