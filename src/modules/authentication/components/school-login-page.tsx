"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  BarChart3,
  Info,
  Send,
  Lock,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Clock,
  Loader2,
  Pencil,
  Check,
  ShieldCheck,
  X,
  Monitor,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { SchoolIllustration } from "@/modules/schools/components/school-illustration";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { BrandLogo } from "@/components/ui/brand-logo";

type LoginMode = "otp" | "email" | "password" | "otp-verify";
type OtpChannel = "phone" | "email";

export function SchoolLoginPage() {
  const [mode, setMode] = useState<LoginMode>("otp");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("phone");
  const [countryDialCode, setCountryDialCode] = useState<string>("+91");
  const [phoneDigits, setPhoneDigits] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<{
    name: string;
    email?: string | null;
    phone?: string | null;
    role?: string;
    schoolName?: string;
    schoolSlug?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [callbackUrl, setCallbackUrl] = useState<string>("/dashboard");

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode and callbackUrl from URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode");
      const channelParam = params.get("channel");
      const cbParam = params.get("callbackUrl");

      if (cbParam) {
        setCallbackUrl(cbParam);
      }

      if (channelParam === "email") {
        setOtpChannel("email");
      }
      if (modeParam === "email" || modeParam === "email-otp") {
        setMode("email");
        setOtpChannel("email");
      } else if (modeParam === "password") {
        setMode("password");
      } else if (modeParam === "verify" || modeParam === "otp-verify") {
        setMode("otp-verify");
      } else if (modeParam === "otp") {
        setMode("otp");
        setOtpChannel("phone");
      }
    }
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    if (mode === "otp-verify" && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, resendTimer]);

  const updateMode = (newMode: LoginMode, channel?: OtpChannel) => {
    setMode(newMode);
    if (channel) {
      setOtpChannel(channel);
    } else if (newMode === "otp") {
      setOtpChannel("phone");
    } else if (newMode === "email") {
      setOtpChannel("email");
    }
    setErrorMessage(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", newMode);
      if (channel) {
        url.searchParams.set("channel", channel);
      }
      window.history.pushState(null, "", url.toString());
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage("Please enter a valid mobile number");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setOtpChannel("phone");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "LOGIN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send OTP to mobile number");
      }
      setResendTimer(data.data?.cooldownSeconds || 60);
      updateMode("otp-verify", "phone");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setOtpChannel("email");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "LOGIN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send OTP to email address");
      }
      setResendTimer(data.data?.cooldownSeconds || 60);
      updateMode("otp-verify", "email");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val === "") {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }
    if (cleaned.length === 1) {
      const nextOtp = [...otp];
      nextOtp[index] = cleaned;
      setOtp(nextOtp);
      if (index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else if (cleaned.length === 6) {
      // Paste full 6-digit OTP
      setOtp(cleaned.split(""));
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResendingOtp) return;
    setErrorMessage(null);
    setResendNotice(null);
    setIsResendingOtp(true);
    try {
      const payload =
        otpChannel === "email"
          ? { email, purpose: "LOGIN" }
          : { phone, purpose: "LOGIN" };
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to resend OTP");
      }
      setResendTimer(data.data?.cooldownSeconds || 60);
      setResendNotice("A new 6-digit verification code has been sent!");
      setTimeout(() => setResendNotice(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join("");
    if (entered.length < 6) {
      setErrorMessage("Please enter all 6 digits of the OTP");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const payload =
        otpChannel === "email"
          ? { method: "otp", email, otpCode: entered }
          : { method: "otp", phone, otpCode: entered };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid or expired verification code");
      }
      setLoggedInUser({
        name: data.data.user.name,
        email: data.data.user.email,
        phone: data.data.user.phone,
        role: data.data.user.role,
        schoolName: data.data.school?.name,
        schoolSlug: data.data.school?.slug,
      });
      setLoginSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed. Please check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setErrorMessage("Please enter your Email Address, Mobile Number, or Login ID");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your Password");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "password", identifier: loginId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid credentials. Please verify your details.");
      }
      setLoggedInUser({
        name: data.data.user.name,
        email: data.data.user.email,
        phone: data.data.user.phone,
        role: data.data.user.role,
        schoolName: data.data.school?.name,
        schoolSlug: data.data.school?.slug,
      });
      setLoginSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Invalid credentials. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-[#1B1D45] overflow-x-clip">
      {/* Background Ambience */}
      <AtmosphericBackground />

      {/* Top Navbar */}
      <header id="login-header" className="sticky top-0 z-40 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <BrandLogo className="h-8 sm:h-9" />

          <Link href="/register?step=1">
            <Button
              variant="gradient"
              size="sm"
              className="rounded-[12px] text-xs font-bold px-4"
            >
              Register Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Two-Column Grid */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* LEFT COLUMN: HERO & BRANDING - Placed below the login form on small devices (< lg) */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-center">
            <div className="space-y-3 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#08093B]">
                School Login
              </h1>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-[#4D5072] max-w-md mx-auto lg:mx-0">
                Sign in to your school&apos;s workspace and manage students, staff, academics, fees
                and more.
              </p>
            </div>

            {/* School 3D/Vector Illustration */}
            <div className="my-6 max-w-md mx-auto lg:mx-0 w-full">
              <SchoolIllustration />
            </div>

            {/* 3 Key Operational Pillars */}
            <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto lg:mx-0 w-full">
              {/* Pillar 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] shadow-xs">
                  <Users className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold leading-tight text-[#08093B]">
                  Manage
                  <br />
                  <span className="text-[11px] font-medium text-[#4D5072]">Students & Staff</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] shadow-xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold leading-tight text-[#08093B]">
                  Run
                  <br />
                  <span className="text-[11px] font-medium text-[#4D5072]">Academics</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE7FF] text-[#663CF6] shadow-xs">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold leading-tight text-[#08093B]">
                  Track
                  <br />
                  <span className="text-[11px] font-medium text-[#4D5072]">Fees & Reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM CARD - Placed on top on small devices (< lg) */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] rounded-[28px] border border-[#D6DBF0] bg-white p-6 sm:p-9 shadow-[0_16px_40px_rgba(24,18,77,0.08)]">
              {/* Card Brand Header */}
              <div className="flex items-center justify-center">
                <BrandLogo variant="full" className="h-7 sm:h-8" asLink={false} />
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Card Heading & Tabs when not in OTP Verification */}
              {mode !== "otp-verify" && (
                <>
                  <div className="mt-4 text-center">
                    <h2 className="text-2xl font-black tracking-tight text-[#08093B]">
                      Sign In to Your School
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#4D5072]">
                      Access your school&apos;s independent workspace on the platform.
                    </p>
                  </div>

                  {/* Top Switcher Tabs: Mobile, Email, Password */}
                  <div className="mt-4 grid grid-cols-3 gap-1 rounded-[14px] bg-[#F1F3F9] p-1 border border-[#DFE3F5]">
                    <button
                      id="tab-signin-otp"
                      type="button"
                      onClick={() => updateMode("otp")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[11px] sm:text-xs font-bold transition-all",
                        mode === "otp"
                          ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                          : "text-[#4D5072] hover:text-[#08093B]"
                      )}
                    >
                      <Smartphone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Mobile</span>
                    </button>
                    <button
                      id="tab-signin-email"
                      type="button"
                      onClick={() => updateMode("email")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[11px] sm:text-xs font-bold transition-all",
                        mode === "email"
                          ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                          : "text-[#4D5072] hover:text-[#08093B]"
                      )}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Email</span>
                    </button>
                    <button
                      id="tab-signin-password"
                      type="button"
                      onClick={() => updateMode("password")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[11px] sm:text-xs font-bold transition-all",
                        mode === "password"
                          ? "bg-gradient-to-r from-[#663CF6] to-[#4F27E8] text-white shadow-sm"
                          : "text-[#4D5072] hover:text-[#08093B]"
                      )}
                    >
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Password</span>
                    </button>
                  </div>
                </>
              )}

              {/* =======================================================================
                  STATE A: SIGN IN WITH MOBILE OTP
                  ======================================================================= */}
              {mode === "otp" && (
                <div className="mt-5 space-y-4">
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#08093B]">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <button
                          id="otp-mode-use-email-link"
                          type="button"
                          onClick={() => updateMode("email")}
                          className="text-[11px] font-bold text-[#663CF6] hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          <span>Use Email Address</span>
                        </button>
                      </div>
                      <div className="flex items-center rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2 shadow-xs transition-all focus-within:border-[#663CF6] focus-within:ring-2 focus-within:ring-[#EDE7FF]">
                        {/* Interactive Country Code Selector */}
                        <div className="border-r border-[#E2E6F5] pr-2.5">
                          <CountryCodeSelect
                            id="login-country-code-select"
                            value={countryDialCode}
                            onChange={(c) => {
                              setCountryDialCode(c.dialCode);
                              setPhone(`${c.dialCode} ${phoneDigits}`.trim());
                            }}
                          />
                        </div>
                        <input
                          id="login-otp-phone-input"
                          type="tel"
                          value={phoneDigits}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhoneDigits(val);
                            setPhone(`${countryDialCode} ${val}`.trim());
                          }}
                          placeholder="98765 43210"
                          className="ml-3 w-full bg-transparent text-sm font-semibold text-[#08093B] placeholder-[#9094B0] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Helper Callout */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4D5072]">
                      <Info className="h-3.5 w-3.5 text-[#666987] shrink-0" />
                      <span>We&apos;ll send a one-time password (OTP) to verify your number.</span>
                    </div>

                    {/* Primary Button: Send OTP */}
                    <Button
                      id="send-otp-btn"
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                    </Button>
                  </form>

                  {/* Registration Link */}
                  <p className="text-center text-xs font-medium text-[#4D5072]">
                    Don&apos;t have a school on our platform?{" "}
                    <Link
                      href="/register?step=1"
                      className="font-bold text-[#663CF6] hover:underline"
                    >
                      Register Now &rarr;
                    </Link>
                  </p>

                  {/* Security Assurance Card */}
                  <div className="rounded-[16px] border border-[#E2E6F7] bg-[#FAF9FF] p-3.5 flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#663CF6] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Your data is secure</h4>
                      <p className="text-[11px] text-[#4D5072] leading-tight mt-0.5">
                        We keep your information safe and use it only to operate your
                        school&apos;s workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================================
                  STATE B: SIGN IN WITH EMAIL ADDRESS
                  ======================================================================= */}
              {mode === "email" && (
                <div className="mt-5 space-y-4">
                  <form onSubmit={handleSendEmailOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#08093B]">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <button
                          id="email-mode-use-phone-link"
                          type="button"
                          onClick={() => updateMode("otp")}
                          className="text-[11px] font-bold text-[#663CF6] hover:underline flex items-center gap-1"
                        >
                          <Smartphone className="h-3 w-3" />
                          <span>Use Mobile Number</span>
                        </button>
                      </div>
                      <div className="flex items-center rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2.5 shadow-xs transition-all focus-within:border-[#663CF6] focus-within:ring-2 focus-within:ring-[#EDE7FF]">
                        <Mail className="h-4 w-4 text-[#666987] shrink-0" />
                        <input
                          id="login-email-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="principal@sunriseis.edu.in"
                          className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#08093B] placeholder-[#9094B0] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Helper Callout */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4D5072]">
                      <Info className="h-3.5 w-3.5 text-[#666987] shrink-0" />
                      <span>We&apos;ll send a 6-digit verification code (OTP) to your email address.</span>
                    </div>

                    {/* Primary Button: Send Email OTP */}
                    <Button
                      id="send-email-otp-btn"
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isLoading ? "Sending OTP..." : "Send Email OTP"}</span>
                    </Button>
                  </form>

                  {/* Registration Link */}
                  <p className="text-center text-xs font-medium text-[#4D5072]">
                    Don&apos;t have a school on our platform?{" "}
                    <Link
                      href="/register?step=1"
                      className="font-bold text-[#663CF6] hover:underline"
                    >
                      Register Now &rarr;
                    </Link>
                  </p>

                  {/* Security Assurance Card */}
                  <div className="rounded-[16px] border border-[#E2E6F7] bg-[#FAF9FF] p-3.5 flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#663CF6] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Your data is secure</h4>
                      <p className="text-[11px] text-[#4D5072] leading-tight mt-0.5">
                        We keep your information safe and use it only to operate your
                        school&apos;s workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================================
                  STATE C: SIGN IN WITH PASSWORD
                  ======================================================================= */}
              {mode === "password" && (
                <div className="mt-5 space-y-4">
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    {/* Identifier */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#08093B]">
                        Email Address or Mobile / Login ID <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2.5 shadow-xs transition-all focus-within:border-[#663CF6] focus-within:ring-2 focus-within:ring-[#EDE7FF]">
                        <Mail className="h-4 w-4 text-[#666987] shrink-0" />
                        <input
                          id="login-id-input"
                          name="identifier"
                          autoComplete="username"
                          type="text"
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder="principal@sunriseis.edu.in or 9876543210"
                          className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#08093B] placeholder-[#9094B0] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#08093B]">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center rounded-[12px] border border-[#CAD0EB] bg-white px-3 py-2.5 shadow-xs transition-all focus-within:border-[#663CF6] focus-within:ring-2 focus-within:ring-[#EDE7FF]">
                        <Lock className="h-4 w-4 text-[#666987] shrink-0" />
                        <input
                          id="login-password-input"
                          name="password"
                          autoComplete="current-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="ml-2.5 w-full bg-transparent text-sm font-semibold text-[#08093B] placeholder-[#9094B0] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[#666987] hover:text-[#08093B]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-0.5">
                      <Link
                        href="/forgot-password"
                        className="text-xs font-bold text-[#663CF6] hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Sign In Primary CTA */}
                    <Button
                      id="password-signin-btn"
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                    </Button>
                  </form>

                  {/* Registration Link */}
                  <p className="text-center text-xs font-medium text-[#4D5072]">
                    Don&apos;t have a school on our platform?{" "}
                    <Link
                      href="/register?step=1"
                      className="font-bold text-[#663CF6] hover:underline"
                    >
                      Register Now &rarr;
                    </Link>
                  </p>

                  {/* Security Assurance Card */}
                  <div className="rounded-[16px] border border-[#E2E6F7] bg-[#FAF9FF] p-3.5 flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#663CF6] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Your data is secure</h4>
                      <p className="text-[11px] text-[#4D5072] leading-tight mt-0.5">
                        We keep your information safe and use it only to operate your
                        school&apos;s workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================================
                  STATE D: OTP VERIFICATION
                  ======================================================================= */}
              {mode === "otp-verify" && (
                <div className="mt-5 space-y-5">
                  <div className="text-center">
                    <h2 className="text-2xl font-black tracking-tight text-[#08093B]">
                      OTP Verification
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#4D5072]">
                      We&apos;ve sent a 6-digit OTP to{" "}
                      <span className="font-semibold text-[#08093B]">
                        {otpChannel === "email" ? email : phone}
                      </span>.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {/* Resend Notice Feedback */}
                    {resendNotice && (
                      <div className="flex items-center gap-2 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 text-xs font-semibold text-[#166534]">
                        <Check className="h-4 w-4 shrink-0 text-[#16A34A]" />
                        <span>{resendNotice}</span>
                      </div>
                    )}

                    {/* 6 Digit Input Boxes */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-[340px] mx-auto w-full py-1">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-box-${idx}`}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          className={`h-11 sm:h-13 w-10 sm:w-12 flex-1 min-w-0 max-w-[48px] text-center text-lg sm:text-xl font-black text-[#08093B] rounded-[12px] bg-white transition-all focus:outline-none ${
                            idx === 5
                              ? "border-2 border-[#663CF6] ring-4 ring-[#EDE7FF]"
                              : "border border-[#CAD0EB] focus:border-[#663CF6] focus:ring-4 focus:ring-[#EDE7FF]"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Timer & Change Destination Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#4D5072] pt-1">
                      <div className="flex items-center gap-1.5 text-[#4D5072]">
                        <Clock className="h-3.5 w-3.5 text-[#663CF6]" />
                        {isResendingOtp ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#663CF6]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                          </span>
                        ) : resendTimer > 0 ? (
                          <span>Resend OTP in 00:{resendTimer.toString().padStart(2, "0")}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResendingOtp}
                            className="font-bold text-[#663CF6] hover:underline"
                          >
                            Resend OTP Now
                          </button>
                        )}
                      </div>

                      <button
                        id="change-mobile-btn"
                        type="button"
                        onClick={() => updateMode(otpChannel === "email" ? "email" : "otp")}
                        className="flex items-center gap-1 font-bold text-[#663CF6] hover:underline"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>
                          {otpChannel === "email" ? "Change Email Address" : "Change Mobile Number"}
                        </span>
                      </button>
                    </div>

                    {/* Verify & Sign In CTA */}
                    <Button
                      id="verify-and-signin-btn"
                      type="submit"
                      variant="gradient"
                      disabled={isLoading}
                      className="w-full rounded-[14px] py-3.5 text-sm font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>{isLoading ? "Verifying..." : "Verify & Sign In"}</span>
                    </Button>
                  </form>

                  {/* "or" Divider */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E5E9F5]" />
                    </div>
                    <span className="relative bg-white px-3 text-xs font-semibold text-[#76799C]">
                      or
                    </span>
                  </div>

                  {/* Alternate Option: Sign in with Password */}
                  <Button
                    id="verify-switch-to-password-btn"
                    type="button"
                    variant="secondary"
                    onClick={() => updateMode("password")}
                    className="w-full rounded-[14px] border border-[#D6DBF0] py-3 text-xs font-bold text-[#08093B] hover:bg-[#F7F4FF] hover:border-[#663CF6] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5 text-[#663CF6]" />
                    <span>Sign in with Password</span>
                  </Button>

                  {/* Security Assurance Card */}
                  <div className="rounded-[16px] border border-[#E2E6F7] bg-[#FAF9FF] p-3.5 flex items-start gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#663CF6] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Your data is secure</h4>
                      <p className="text-[11px] text-[#4D5072] leading-tight mt-0.5">
                        We keep your information safe and use it only to operate your
                        school&apos;s workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* =======================================================================
          STATE D: LOGIN SUCCESSFUL POPUP MODAL (Screenshot 1)
          ======================================================================= */}
      {loginSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-success-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl border border-[#EAE6FD] text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              id="close-login-success-modal"
              type="button"
              onClick={() => setLoginSuccess(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#666987] hover:bg-[#F1F3F9] hover:text-[#08093B] transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing Green Check Circle with Confetti */}
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center pt-1">
              {/* Confetti Particles SVG */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full pointer-events-none"
              >
                {/* Purple rectangle */}
                <rect x="22" y="16" width="4" height="4" rx="1" fill="#7C3AED" transform="rotate(25 24 18)" />
                {/* Yellow rectangle */}
                <rect x="75" y="24" width="4" height="4" rx="1" fill="#FBBF24" transform="rotate(-30 77 26)" />
                {/* Cyan circle */}
                <circle cx="20" cy="40" r="2.5" fill="#06B6D4" />
                {/* Pink circle */}
                <circle cx="82" cy="42" r="2.5" fill="#F43F5E" />
                {/* Purple dot */}
                <circle cx="78" cy="18" r="2" fill="#663CF6" />
                {/* Yellow dot */}
                <circle cx="16" cy="30" r="2" fill="#F59E0B" />
              </svg>

              {/* Radiant Green Success Badge */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-lg ring-8 ring-[#DCFCE7]">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
            </div>

            {/* Headings */}
            <h3
              id="login-success-title"
              className="mt-3 text-2xl font-black tracking-tight text-[#08093B]"
            >
              Login Successful!
            </h3>
            <p className="mt-1 text-sm font-bold text-[#08093B]">
              Welcome back, {loggedInUser?.name || "Administrator"}!
            </p>
            <p className="text-xs font-medium text-[#4D5072]">
              You have been signed in to {loggedInUser?.schoolName || "your school portal"}.
            </p>

            {/* 3 Quick-Access Modules */}
            <div className="mt-6 rounded-2xl border border-[#EAE6FD] bg-[#F7F6FE] p-4">
              <div className="grid grid-cols-3 divide-x divide-[#E5E0FA]">
                <div className="flex flex-col items-center px-1 text-center">
                  <Monitor className="h-5 w-5 text-[#663CF6]" />
                  <span className="mt-1 text-[11px] font-bold text-[#08093B] leading-tight">
                    Go to Dashboard
                  </span>
                </div>
                <div className="flex flex-col items-center px-1 text-center">
                  <GraduationCap className="h-5 w-5 text-[#663CF6]" />
                  <span className="mt-1 text-[11px] font-bold text-[#08093B] leading-tight">
                    Manage Academics
                  </span>
                </div>
                <div className="flex flex-col items-center px-1 text-center">
                  <Users className="h-5 w-5 text-[#663CF6]" />
                  <span className="mt-1 text-[11px] font-bold text-[#08093B] leading-tight">
                    Manage Students & Staff
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <Link
              id="login-success-dashboard-btn"
              href={callbackUrl || "/dashboard"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] py-3.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 hover:opacity-95 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
