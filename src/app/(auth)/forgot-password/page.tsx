import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordWizard } from "@/modules/authentication/components/forgot-password-wizard";

export const metadata: Metadata = {
  title: "Forgot Password | ScholoNix",
  description:
    "Reset your account password in a few simple steps using OTP verification via registered mobile number or email address on ScholoNix.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFDFE]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#663CF6] border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordWizard />
    </Suspense>
  );
}
