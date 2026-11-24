import type { Metadata } from "next";
import { FeaturesPage } from "@/modules/marketing/components/features-page";

export const metadata: Metadata = {
  title: "Powerful Features for Complete School Management | ScholoNix",
  description:
    "Explore complete school management features: admissions, academics, attendance, fees, staff management, parent communication, timetable, and examinations.",
  keywords: [
    "school management features",
    "school software modules",
    "online attendance system",
    "school fee management software",
    "school examination management",
    "student information system india",
  ],
  openGraph: {
    title: "Powerful Features for Complete School Management | ScholoNix",
    description:
      "Everything you need to manage your school's admissions, academics, fees, communication and more — all in one easy-to-use platform.",
    url: "https://schoolmanagementsaas.in/features",
    siteName: "ScholoNix",
    type: "website",
  },
  alternates: {
    canonical: "/features",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ScholoNix",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  featureList: [
    "Admissions Management",
    "Academic Management & Assessments",
    "Daily Attendance Tracking",
    "Online Fee Collection & Receipts",
    "Staff Profiles & Leaves",
    "Student Lifecycle Management",
    "Parent & Student Portal",
    "Conflict-Free Timetable Scheduling",
    "Examinations & Report Cards",
    "Analytics & Performance Reports",
    "Library Inventory Management",
    "School Transport & Bus Tracking",
  ],
};

export default function FeaturesRoutePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FeaturesPage />
    </>
  );
}
