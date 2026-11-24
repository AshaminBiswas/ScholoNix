import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/modules/marketing/components/blog-post-page";
import {
  ALL_BLOG_POSTS,
  getBlogPostBySlug,
  getRelatedPosts,
  getAdjacentPosts,
} from "@/modules/marketing/data/blog-data";

interface BlogPostRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return ALL_BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found | ScholoNix",
    };
  }

  return {
    title: `${post.title} | ScholoNix Blog`,
    description: post.subtitle,
    keywords: post.tags,
    openGraph: {
      title: `${post.title} | ScholoNix`,
      description: post.subtitle,
      url: `https://schoolmanagementsaas.in/blog/${post.slug}`,
      siteName: "ScholoNix",
      type: "article",
      authors: [post.author.name],
      publishedTime: "2025-08-28T09:00:00.000Z",
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostRoutePage({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const { prev, next } = getAdjacentPosts(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.subtitle,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "ScholoNix",
      url: "https://schoolmanagementsaas.in",
    },
    datePublished: "2025-08-28T09:00:00.000Z",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://schoolmanagementsaas.in/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostPage
        post={post}
        relatedPosts={relatedPosts}
        prevPost={prev}
        nextPost={next}
      />
    </>
  );
}
