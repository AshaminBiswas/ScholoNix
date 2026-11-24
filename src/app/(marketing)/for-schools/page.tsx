import type { Metadata } from "next";
import { ForSchoolsPage } from "@/modules/marketing/components/for-schools-page";

export const metadata: Metadata = {
  title: "Built for Schools, Trusted by Educators | ScholoNix",
  description:
    "A complete school management platform that helps schools streamline operations, improve collaboration and deliver a better learning experience. Loved by school leaders across K-12, CBSE, ICSE, State Board and International schools.",
  keywords: [
    "school management platform",
    "software for schools",
    "cbse school erp",
    "icse school management system",
    "k-12 school software india",
    "school administration software",
  ],
  openGraph: {
    title: "Built for Schools, Trusted by Educators | ScholoNix",
    description:
      "A complete school management platform that helps schools streamline operations, improve collaboration and deliver a better learning experience.",
    url: "https://schoolmanagementsaas.in/for-schools",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/for-schools",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ScholoNix - For Schools",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: ["School Administrator", "Principal", "Teacher", "Educator"],
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    lowPrice: "1999",
  },
};

export default function ForSchoolsRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ForSchoolsPage />
    </>
  );
}
