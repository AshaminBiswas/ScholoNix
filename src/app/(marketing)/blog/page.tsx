import type { Metadata } from "next";
import { BlogPage } from "@/modules/marketing/components/blog-page";

export const metadata: Metadata = {
  title: "School Management Insights & Resources | Blog",
  description:
    "Explore expert articles, tips and best practices on school management, digital transformation, student outcomes and education technology.",
  keywords: [
    "school management blog",
    "education technology insights",
    "school digital transformation",
    "academic planning best practices",
    "parent communication in schools",
    "school operations guide",
  ],
  openGraph: {
    title: "School Management Insights & Resources | Blog",
    description:
      "Explore expert articles, tips and best practices on school management, digital transformation and education technology.",
    url: "https://schoolmanagementsaas.in/blog",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/blog",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ScholoNix Blog",
  description:
    "Explore expert articles, tips and best practices on school management, digital transformation and education technology.",
  url: "https://schoolmanagementsaas.in/blog",
  publisher: {
    "@type": "Organization",
    name: "ScholoNix",
    url: "https://schoolmanagementsaas.in",
  },
};

export default function BlogRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPage />
    </>
  );
}
