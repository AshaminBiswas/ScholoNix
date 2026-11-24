import type { Metadata } from "next";
import { ContactPage } from "@/modules/marketing/components/contact-page";

export const metadata: Metadata = {
  title: "Contact Us & Schedule a Demo | ScholoNix",
  description:
    "Get in touch with our education specialists. Inquire about pricing, data migration, CBSE/ICSE compliance, or schedule a personalized walkthrough for your school management.",
  keywords: [
    "contact scholonix",
    "school software demo india",
    "school management system inquiry",
    "cbse school erp support",
    "school admission software contact",
  ],
  openGraph: {
    title: "Contact Us & Schedule a Demo | ScholoNix",
    description:
      "Get in touch with our education specialists. Request a live demonstration or talk to our school onboarding team.",
    url: "https://schoolmanagementsaas.in/contact",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/contact",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact ScholoNix",
  description: "Get in touch with ScholoNix for school ERP inquiries and live demonstrations.",
  mainEntity: {
    "@type": "Organization",
    name: "ScholoNix",
    url: "https://schoolmanagementsaas.in",
    telephone: "+91-98765-43210",
    email: "support@scholonix.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-98765-43210",
        contactType: "sales",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
      {
        "@type": "ContactPoint",
        telephone: "+91-800-456-7890",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    ],
  },
};

export default function ContactRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactPage />
    </>
  );
}
