export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "ScholoNix",
  description:
    "ScholoNix - Modern multi-tenant school management SaaS platform built for schools, trusted by educators.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
