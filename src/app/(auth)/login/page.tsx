import type { Metadata } from "next";
import { SchoolLoginPage } from "@/modules/authentication/components/school-login-page";

export const metadata: Metadata = {
  title: "School Login | ScholoNix",
  description:
    "Sign in to your school's workspace and manage students, staff, academics, fees and more on ScholoNix.",
};

export default function LoginPage() {
  return <SchoolLoginPage />;
}
