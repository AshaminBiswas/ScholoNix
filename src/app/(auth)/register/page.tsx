import type { Metadata } from "next";
import { RegisterSchoolPage } from "@/modules/schools/components/register-school-page";

export const metadata: Metadata = {
  title: "Register Your School",
  description:
    "Create your school's independent workspace on our modern, secure multi-tenant School Management Platform.",
};

export default function RegisterPage() {
  return <RegisterSchoolPage />;
}
