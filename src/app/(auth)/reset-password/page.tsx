import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordWizard } from "@/modules/authentication/components/forgot-password-wizard";

export const metadata: Metadata = {
  title: "Create New Password | ScholoNix",
  description:
    "Set a new password for your account so you can sign in to the ScholoNix Web Panel.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFDFE] dark:bg-[#0B0D1D]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#663CF6] border-t-transparent dark:border-[#9D7CFE] dark:border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordWizard initialStep={3} />
    </Suspense>
  );
}
