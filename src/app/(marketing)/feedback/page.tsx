import type { Metadata } from "next";
import { FeedbackPage } from "@/modules/marketing/components/feedback-page";

export const metadata: Metadata = {
  title: "Give Feedback & Suggest Features | ScholoNix",
  description:
    "Help us shape the future of ScholoNix. Share your user experience, request new features, or report bugs to our engineering and product design team.",
  keywords: [
    "scholonix feedback",
    "school erp feature request",
    "school software suggestions",
    "report bug scholonix",
    "edtech feedback india",
  ],
  openGraph: {
    title: "Give Feedback & Suggest Features | ScholoNix",
    description:
      "Share your suggestions, feature requests, or report issues directly to the ScholoNix product engineering team.",
    url: "https://schoolmanagementsaas.in/feedback",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/feedback",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ScholoNix Feedback & Community Suggestions",
  description:
    "Submit feedback, feature requests, and usability reviews for the ScholoNix school management platform.",
  publisher: {
    "@type": "Organization",
    name: "ScholoNix",
    url: "https://schoolmanagementsaas.in",
  },
};

export default function FeedbackRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FeedbackPage />
    </>
  );
}
