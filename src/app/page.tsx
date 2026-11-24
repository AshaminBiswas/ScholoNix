import type { Metadata } from "next";
import { HomePage } from "@/modules/marketing/components/landing-page";

export const metadata: Metadata = {
  title: "ScholoNix | Run Your School Smarter, Simpler & More Efficiently",
  description:
    "ScholoNix - A complete cloud-based school management platform for schools to manage admissions, student lifecycle, attendance, fees, examinations, staff, and parent communication.",
  keywords: [
    "ScholoNix",
    "school management software",
    "school erp india",
    "student information system",
    "school attendance",
    "fee management saas",
    "cbse school portal",
  ],
  openGraph: {
    title: "ScholoNix | Run Your School Smarter, Simpler & More Efficiently",
    description:
      "All-in-one school management platform for schools across India. Digitize admissions, fees, attendance, and academics with ScholoNix.",
    url: "https://scholonix.com",
    siteName: "ScholoNix",
    type: "website",
  },
};

export default function RootHomePage() {
  return <HomePage />;
}
