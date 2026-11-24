"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Lock,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  Clock,
  Loader2,
  Pencil,
  Check,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ArrowRight,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { SchoolIllustration } from "@/modules/schools/components/school-illustration";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { BrandLogo } from "@/components/ui/brand-logo";

export type ForgotPasswordStep = 1 | 2 | 3 | 4;
export type ResetChannel = "phone" | "email";

interface ForgotPasswordWizardProps {
  initialStep?: ForgotPasswordStep;
  initialChannel?: ResetChannel;
}

export function ForgotPasswordWizard({
  initialStep = 1,
  initialChannel = "phone",
}: ForgotPasswordWizardProps) {
  const [step, setStep] = useState<ForgotPasswordStep>(initialStep);
  const [channel, setChannel] = useState<ResetChannel>(initialChannel);

  // Form Fields
  const [countryDialCode, setCountryDialCode] = useState<string>("+91");
  const [phoneDigits, setPhoneDigits] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // OTP Fields
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Fields
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Sync with URL query parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      const channelParam = params.get("channel");

      if (channelParam === "email") {
        setChannel("email");
      } else if (channelParam === "phone") {
        setChannel("phone");
      }

      if (stepParam === "1") setStep(1);
      else if (stepParam === "2") setStep(2);
      else if (stepParam === "3") setStep(3);
      else if (stepParam === "4") setStep(4);
    }
  }, []);

  // Update URL without full refresh for clean bookmarking & back button
  const goToStep = (newStep: ForgotPasswordStep) => {
    setStep(newStep);
    setErrorMessage(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", newStep.toString());
      url.searchParams.set("channel", channel);
      window.history.pushState({}, "", url.toString());
    }
  };

  // Resend OTP countdown timer
  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  // Recipient display text
  const recipientDisplay = channel === "phone" ? phone : email;

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    const updated = [...otp];
    updated[index] = clean.slice(-1);
    setOtp(updated);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otp];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtp(updated);
    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 1: Send OTP handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (channel === "phone" && phoneDigits.replace(/\D/g, "").length < 7) {
        throw new Error("Please enter a valid mobile number");
      }
      if (channel === "email" && !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: channel === "phone" ? phone : undefined,
          email: channel === "email" ? email : undefined,
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send verification code");
      }

      setResendTimer(data.data?.cooldownSeconds || 60);
      goToStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: channel === "phone" ? phone : undefined,
          email: channel === "email" ? email : undefined,
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Could not resend OTP. Please try again.");
      }

      setResendTimer(data.data?.cooldownSeconds || 60);
      setResendNotice("A new 6-digit verification code has been sent!");
      setTimeout(() => setResendNotice(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Could not resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = otp.join("");
    if (code.length < 6) {
      setErrorMessage("Please enter all 6 digits of the OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: recipientDisplay,
          channel: channel === "email" ? "EMAIL" : "SMS",
          purpose: "PASSWORD_RESET",
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid or expired verification code");
      }

      goToStep(3);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Step 3: Create New Password submit
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPasswordValid) {
      setErrorMessage("Please meet all password requirements before continuing.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage("Confirm password does not match new password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientDisplay,
          channel,
          otp: otp.join(""),
          password,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update password");
      }

      goToStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Left column content configuration by step
  const leftContent = {
    1: {
      headline: "Forgot Password?",
      subtitle:
        "No worries! Reset your account password using your registered mobile number or email address.",
      badge1: "Secure Password Reset",
      badge2: "Quick and Easy",
      badge3: "Keep Your Account Safe",
    },
    2: {
      headline: "Verify Your Account",
      subtitle: `Enter the one-time password (OTP) sent to your registered ${
        channel === "phone" ? "mobile number " + phone : "email address " + email
      }.`,
      badge1: "Secure Verification",
      badge2: "Quick and Easy",
      badge3: "Keep Your Account Safe",
    },
    3: {
      headline: "Create New Password",
      subtitle:
        "Set a new password for your account so you can sign in to the School Web Panel.",
      badge1: "Secure Account",
      badge2: "Quick and Easy",
      badge3: "Keep Your Data Safe",
    },
    4: {
      headline: "Password Reset Successful!",
      subtitle:
        "Your password has been changed successfully. You can now sign in to your account with your new password.",
      badge1: "Secure Account",
      badge2: "Quick and Easy",
      badge3: "Keep Your Data Safe",
    },
  }[step];

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45] flex flex-col justify-between">
      {/* Background Aurora & Wave Effect */}
      <AtmosphericBackground />

      {/* Main Two-Column Layout */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* =========================================================================
              LEFT COLUMN: Vector School Illustration & Badges
              (On mobile, stacked below the card for immediate input access)
              ========================================================================= */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Top Brand Logo */}
            <BrandLogo className="h-8 sm:h-9" />

            {/* Step Heading & Subtitle */}
            <div className="space-y-2.5 max-w-md">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl lg:text-5xl leading-tight">
                {leftContent.headline}
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-[#4D5072] font-medium">
                {leftContent.subtitle}
              </p>
            </div>

            {/* School Building Vector Illustration */}
            <div className="w-full max-w-md py-2">
              <SchoolIllustration />
            </div>

            {/* Three Security & Convenience Value Badges */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
              {/* Badge 1: Shield */}
              <div className="flex flex-col items-center text-center p-2 rounded-[14px] bg-white/70 border border-[#E2E8F0] shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#5824EE] ring-1 ring-[#D4C4FE] mb-2 shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-[#08093B] leading-tight">
                  {leftContent.badge1}
                </span>
              </div>

              {/* Badge 2: Quick & Easy */}
              <div className="flex flex-col items-center text-center p-2 rounded-[14px] bg-white/70 border border-[#E2E8F0] shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#5824EE] ring-1 ring-[#D4C4FE] mb-2 shadow-xs">
                  <Zap className="h-5 w-5 fill-[#5824EE]/20" />
                </div>
                <span className="text-[11px] font-bold text-[#08093B] leading-tight">
                  {leftContent.badge2}
                </span>
              </div>

              {/* Badge 3: Keep Safe */}
              <div className="flex flex-col items-center text-center p-2 rounded-[14px] bg-white/70 border border-[#E2E8F0] shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE7FF] text-[#5824EE] ring-1 ring-[#D4C4FE] mb-2 shadow-xs">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-[#08093B] leading-tight">
                  {leftContent.badge3}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Interactive Step Form Card
              ========================================================================= */}
          <div className="order-1 lg:order-2 lg:col-span-6 w-full flex justify-center">
            <div className="w-full max-w-lg rounded-[24px] border border-[#D6DBF0] bg-white/95 p-6 sm:p-8 shadow-[0_20px_50px_rgba(79,39,232,0.12)] backdrop-blur-md">
              {/* Card Header Branding */}
              <div className="flex items-center justify-center mb-4">
                <BrandLogo variant="full" className="h-7 sm:h-8" asLink={false} />
              </div>

              {/* Error Alert Message */}
              {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {resendNotice && (
                <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{resendNotice}</span>
                </div>
              )}

              {/* =====================================================================
                  STEP 1: FORGOT PASSWORD (Enter Phone / Email)
                  ===================================================================== */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                      Forgot Password
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#4D5072]">
                      Reset your account password in a few simple steps.
                    </p>
                  </div>

                  {/* Channel Toggle Tabs */}
                  <div className="grid grid-cols-2 p-1 rounded-[14px] bg-[#F1F3F9] border border-[#E2E8F0] mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setChannel("phone");
                        setErrorMessage(null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-bold transition-all",
                        channel === "phone"
                          ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                          : "text-[#4D5072] hover:text-[#08093B]",
                      )}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>Mobile Number</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChannel("email");
                        setErrorMessage(null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-xs font-bold transition-all",
                        channel === "email"
                          ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                          : "text-[#4D5072] hover:text-[#08093B]",
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </button>
                  </div>

                  {/* Step 1 Form */}
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {channel === "phone" ? (
                      <div>
                        <label className="block text-xs font-bold text-[#08093B] mb-1.5">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <CountryCodeSelect
                            value={countryDialCode}
                            onChange={(c) => {
                              setCountryDialCode(c.dialCode);
                              setPhone(`${c.dialCode} ${phoneDigits}`);
                            }}
                          />
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              value={phoneDigits}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPhoneDigits(val);
                                setPhone(`${countryDialCode} ${val}`);
                              }}
                              placeholder="98765 43210"
                              className="w-full rounded-[12px] border border-[#D6DBF0] bg-white px-3.5 py-3 text-sm font-semibold text-[#08093B] shadow-xs transition focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-[#08093B] mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="principal@sunriseis.edu.in"
                            className="w-full rounded-[12px] border border-[#D6DBF0] bg-white pl-10 pr-3.5 py-3 text-sm font-semibold text-[#08093B] shadow-xs transition focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                          />
                        </div>
                      </div>
                    )}

                    {/* Primary Submit Button */}
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all mt-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                    </Button>

                    {/* Divider with 'or' */}
                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#DFE3F5]" />
                      </div>
                      <span className="relative bg-white px-3 text-xs font-semibold text-[#76799C]">
                        or
                      </span>
                    </div>

                    {/* Secondary Action: Back to Login */}
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full rounded-[14px] border-[1.5px] border-[#D6DBF0] bg-white py-3 text-sm font-bold text-[#4F27E8] hover:border-[#4F27E8] hover:bg-[#F7F4FF] transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Login</span>
                    </Link>
                  </form>

                  {/* Security Trust Callout */}
                  <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFF] p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#5824EE]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#08093B]">
                        Your data is secure
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072]">
                        We use OTP verification to ensure only you can reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  STEP 2: VERIFY OTP
                  ===================================================================== */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                      Verify OTP
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#4D5072]">
                      We&apos;ve sent a 6-digit OTP to{" "}
                      <span className="font-bold text-[#08093B]">{recipientDisplay}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {/* 6 Digit OTP Inputs */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-[340px] mx-auto w-full my-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          aria-label={`Digit ${index + 1}`}
                          className={cn(
                            "h-11 sm:h-13 w-10 sm:w-12 flex-1 min-w-0 max-w-[48px] text-center text-lg sm:text-xl font-black text-[#08093B] rounded-[12px] border bg-white shadow-xs transition-all outline-none",
                            digit
                              ? "border-[#663CF6] ring-2 ring-[#663CF6]/20"
                              : "border-[#D6DBF0] focus:border-[#663CF6] focus:ring-2 focus:ring-[#663CF6]/20",
                          )}
                        />
                      ))}
                    </div>

                    {/* Resend Countdown Timer */}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4D5072]">
                      <Clock className="h-3.5 w-3.5 text-[#663CF6]" />
                      {isLoading ? (
                        <span className="inline-flex items-center gap-1 text-[#663CF6]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Sending code...</span>
                        </span>
                      ) : resendTimer > 0 ? (
                        <span>
                          Resend OTP in 00:
                          {resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="text-[#663CF6] font-bold hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {/* Change Verification Method Link */}
                    <div className="flex justify-center pt-1 pb-2">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Change Verification Method</span>
                      </button>
                    </div>

                    {/* Verify Primary CTA */}
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>Verify</span>
                    </Button>

                    {/* Back Secondary Button */}
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex items-center justify-center gap-2 w-full rounded-[14px] border-[1.5px] border-[#D6DBF0] bg-white py-3 text-sm font-bold text-[#4F27E8] hover:border-[#4F27E8] hover:bg-[#F7F4FF] transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                  </form>

                  {/* Security Trust Callout */}
                  <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFF] p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#5824EE]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#08093B]">
                        Your data is secure
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072]">
                        We use OTP verification to ensure only you can access your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  STEP 3: CREATE NEW PASSWORD
                  ===================================================================== */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                      Create New Password
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#4D5072]">
                      Your account is verified. Now set a new password.
                    </p>
                  </div>

                  <form onSubmit={handleCreatePassword} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#08093B] mb-1.5">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
                        <input
                          id="new-password-input"
                          name="newPassword"
                          autoComplete="new-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full rounded-[12px] border border-[#D6DBF0] bg-white pl-10 pr-10 py-3 text-sm font-semibold text-[#08093B] shadow-xs transition focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#76799C] hover:text-[#08093B]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-bold text-[#08093B] mb-1.5">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
                        <input
                          id="confirm-new-password-input"
                          name="confirmNewPassword"
                          autoComplete="new-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full rounded-[12px] border border-[#D6DBF0] bg-white pl-10 pr-10 py-3 text-sm font-semibold text-[#08093B] shadow-xs transition focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#76799C] hover:text-[#08093B]"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements Checklist Card */}
                    <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFF] p-3.5 space-y-2 mt-4 text-left">
                      <div className="text-xs font-bold text-[#08093B]">
                        Password must contain:
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        <li
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            hasMinLength
                              ? "text-[#15803D] font-semibold"
                              : "text-[#64748B]",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              hasMinLength
                                ? "text-[#16A34A] stroke-[3]"
                                : "text-[#94A3B8]",
                            )}
                          />
                          <span>At least 8 characters</span>
                        </li>
                        <li
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            hasUppercase
                              ? "text-[#15803D] font-semibold"
                              : "text-[#64748B]",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              hasUppercase
                                ? "text-[#16A34A] stroke-[3]"
                                : "text-[#94A3B8]",
                            )}
                          />
                          <span>At least one uppercase letter (A-Z)</span>
                        </li>
                        <li
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            hasLowercase
                              ? "text-[#15803D] font-semibold"
                              : "text-[#64748B]",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              hasLowercase
                                ? "text-[#16A34A] stroke-[3]"
                                : "text-[#94A3B8]",
                            )}
                          />
                          <span>At least one lowercase letter (a-z)</span>
                        </li>
                        <li
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            hasNumber
                              ? "text-[#15803D] font-semibold"
                              : "text-[#64748B]",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              hasNumber
                                ? "text-[#16A34A] stroke-[3]"
                                : "text-[#94A3B8]",
                            )}
                          />
                          <span>At least one number (0-9)</span>
                        </li>
                        <li
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            hasSpecialChar
                              ? "text-[#15803D] font-semibold"
                              : "text-[#64748B]",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              hasSpecialChar
                                ? "text-[#16A34A] stroke-[3]"
                                : "text-[#94A3B8]",
                            )}
                          />
                          <span>At least one special character (e.g., !@#$%^&*)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Create New Password Primary CTA */}
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all mt-4"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {isLoading ? "Updating Password..." : "Create New Password"}
                      </span>
                    </Button>

                    {/* Back to Login Secondary Action */}
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full rounded-[14px] border-[1.5px] border-[#D6DBF0] bg-white py-3 text-sm font-bold text-[#4F27E8] hover:border-[#4F27E8] hover:bg-[#F7F4FF] transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Login</span>
                    </Link>
                  </form>
                </div>
              )}

              {/* =====================================================================
                  STEP 4: PASSWORD CHANGED SUCCESSFULLY (Celebration)
                  ===================================================================== */}
              {step === 4 && (
                <div className="text-center py-2">
                  {/* Glowing Checkmark with Festive Floating Confetti */}
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center mb-5">
                    {/* Glowing emerald aura */}
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />

                    {/* Confetti Particles */}
                    <div className="absolute -top-1 -left-2 h-2.5 w-2.5 rounded-xs bg-[#8B5CF6] rotate-12" />
                    <div className="absolute -top-2 right-1 h-3 w-1.5 rounded-xs bg-[#F59E0B] -rotate-45" />
                    <div className="absolute top-1/2 -left-4 h-2 w-2 rounded-full bg-[#EC4899]" />
                    <div className="absolute top-1/3 -right-3 h-2.5 w-2 rounded-xs bg-[#10B981] rotate-45" />
                    <div className="absolute -bottom-1 right-2 h-2.5 w-2.5 rounded-xs bg-[#F97316] rotate-12" />
                    <div className="absolute bottom-2 -left-3 h-2 w-3 rounded-xs bg-[#3B82F6] -rotate-12" />

                    {/* Main Green Check Circle */}
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#16A34A] via-[#22C55E] to-[#4ADE80] shadow-[0_10px_25px_rgba(22,163,74,0.35)] ring-4 ring-white">
                      <Check className="h-10 w-10 text-white stroke-[3.5]" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                    Password Changed Successfully!
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm font-medium text-[#4D5072] max-w-sm mx-auto leading-relaxed">
                    Your account password has been updated. Please use your new password
                    to sign in.
                  </p>

                  <div className="mt-8 space-y-3">
                    {/* Primary CTA: Go to Login */}
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full rounded-[14px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:from-[#6D28D9] hover:to-[#3730A3] hover:shadow-xl transition-all"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Go to Login</span>
                    </Link>

                    {/* Secondary CTA: Go to Home */}
                    <Link
                      href="/"
                      className="flex items-center justify-center gap-2 w-full rounded-[14px] border-[1.5px] border-[#D6DBF0] bg-white py-3.5 text-sm font-bold text-[#08093B] hover:border-[#4F27E8] hover:bg-[#F7F4FF] hover:text-[#4F27E8] transition-all"
                    >
                      <Home className="h-4 w-4" />
                      <span>Go to Home</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#76799C]">
        © 2026 ScholoNix. All rights reserved. · Secure Password Recovery
      </footer>
    </div>
  );
}
