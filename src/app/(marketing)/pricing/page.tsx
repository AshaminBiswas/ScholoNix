import type { Metadata } from "next";
import { PricingPage } from "@/modules/marketing/components/pricing-page";

export const metadata: Metadata = {
  title: "Simple & Transparent Pricing | ScholoNix",
  description:
    "Flexible, transparent school management software pricing for Indian schools. Starter, Professional, and Enterprise plans with zero hidden fees and a 14-day free trial.",
  keywords: [
    "school management pricing",
    "school erp cost india",
    "school software subscription",
    "cbse school management pricing",
    "school fee management pricing",
  ],
  openGraph: {
    title: "Simple & Transparent Pricing | ScholoNix",
    description:
      "Choose a school management plan that fits your school's size and needs. Full feature access, secure & reliable, dedicated support.",
    url: "https://schoolmanagementsaas.in/pricing",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/pricing",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ScholoNix",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "1999",
      priceCurrency: "INR",
      billingDuration: "P1M",
      description: "Ideal for small schools getting started with digital school management.",
    },
    {
      "@type": "Offer",
      name: "Professional Plan",
      price: "3999",
      priceCurrency: "INR",
      billingDuration: "P1M",
      description: "Perfect for growing schools with advanced needs and more users.",
    },
    {
      "@type": "Offer",
      name: "Enterprise Plan",
      price: "7999",
      priceCurrency: "INR",
      billingDuration: "P1M",
      description: "Best for large schools or school groups with multi-branch requirements.",
    },
  ],
};

export default function PricingRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingPage />
    </>
  );
}
