"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CheckCircle2,
  Users,
  Zap,
  Flag,
  Crown,
  ShieldCheck,
  Globe,
  Upload,
  X,
  ArrowLeft,
  Check,
  Loader2,
  Building2,
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Info,
  Smartphone,
  Pencil,
  Clock,
  Send,
  FileText,
  Sparkles,
  Rocket,
  Shield,
  Monitor,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SchoolIllustration } from "./school-illustration";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { CountryCodeSelect, COUNTRIES } from "@/components/ui/country-code-select";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const SCHOOL_CATEGORIES = [
  "Co-Educational School",
  "Boys School",
  "Girls School",
  "Play School / Kindergarten",
  "Primary School (Class I-V)",
  "Secondary School (Class I-X)",
  "Higher Secondary (K-12 / Junior College)",
];

const AFFILIATION_BOARDS = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "IB (International Baccalaureate)",
  "Cambridge / IGCSE",
  "Other / Autonomous",
];

const DESIGNATION_ROLES = [
  "Principal",
  "Vice Principal",
  "Director / Chairman",
  "Headmaster / Headmistress",
  "Administrator / Registrar",
  "Trustee / Board Member",
  "Other Staff / IT Coordinator",
];

const NEXT_STEPS = [
  {
    step: 1,
    title: "Institution Details",
    desc: "Provide your school's basic information.",
  },
  {
    step: 2,
    title: "Administrator Details",
    desc: "Add the main administrator's details and set up account access.",
  },
  {
    step: 3,
    title: "Verify & Confirm",
    desc: "Verify your mobile number with OTP (and email, if provided).",
  },
  {
    step: 4,
    title: "Select Plan",
    desc: "Choose the plan that best fits your school's size and needs.",
  },
  {
    step: 5,
    title: "Review & Create",
    desc: "Review your information and create your school account.",
  },
];

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    tagline: "A great start for small schools.",
    monthlyPrice: "₹1,999",
    yearlyPrice: "₹1,599",
    iconBg: "bg-[#EAF7FE] dark:bg-[#12233E] text-[#0891B2] dark:text-[#38D6DC]",
    popular: false,
    features: [
      "Up to 500 students",
      "Student & Staff Management",
      "Attendance Management",
      "Academic Setup (Classes, Sections)",
      "Notices & Messaging",
      "Basic Reports",
    ],
  },
  {
    id: "professional" as const,
    name: "Professional",
    tagline: "Complete school management for growing schools.",
    monthlyPrice: "₹3,999",
    yearlyPrice: "₹3,199",
    iconBg: "bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]",
    popular: true,
    features: [
      "Up to 2,000 students",
      "All Starter features",
      "Fees & Online Payments",
      "Exams & Results",
      "Parent-Teacher Meetings (PTM)",
      "Advanced Reports & Exports",
    ],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    tagline: "For large schools with advanced requirements.",
    monthlyPrice: "₹7,999",
    yearlyPrice: "₹6,399",
    iconBg: "bg-[#F0F2FF] dark:bg-[#1F234A] text-[#4F46E5] dark:text-[#A5B4FC]",
    popular: false,
    features: [
      "Unlimited students",
      "All Professional features",
      "Multi-branch / Multiple Campuses",
      "Advanced Analytics & Dashboards",
      "API & Integrations (if applicable)",
      "Priority Support",
    ],
  },
];

export function RegisterSchoolPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "enterprise">("professional");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isPlanSkipped, setIsPlanSkipped] = useState(false);

  const goToStep = (step: 1 | 2 | 3 | 4 | 5, options?: { replace?: boolean }) => {
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("step", step.toString());
      if (options?.replace) {
        window.history.replaceState({ step }, "", url.toString());
      } else {
        window.history.pushState({ step }, "", url.toString());
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const handleSkipPlan = () => {
    setIsPlanSkipped(true);
    goToStep(5);
  };

  // Always scroll to top of page whenever step changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentStep]);

  // Country code states
  const [schoolCountryCode, setSchoolCountryCode] = useState<string>("+91");
  const [adminCountryCode, setAdminCountryCode] = useState<string>("+91");

  // Step 1: Institution Details
  const [institution, setInstitution] = useState({
    name: "",
    category: "Co-Educational School",
    affiliationBoard: "CBSE",
    contactPhone: "",
    website: "",
    addressLine: "",
    locality: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    logoUrl: "",
  });

  // Step 2: Administrator Details
  const [admin, setAdmin] = useState({
    adminName: "",
    designation: "Principal",
    adminPhone: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync step from URL parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");

      const planParam = params.get("plan");
      if (planParam === "starter" || planParam === "professional" || planParam === "enterprise") {
        setSelectedPlan(planParam);
      }
      const billingParam = params.get("billing");
      if (billingParam === "monthly" || billingParam === "yearly") {
        setBillingCycle(billingParam);
      }

      if (stepParam === "2") {
        setCurrentStep(2);
      } else if (stepParam === "3") {
        setCurrentStep(3);
      } else if (stepParam === "4" || stepParam === "plan" || stepParam === "pricing") {
        setCurrentStep(4);
      } else if (stepParam === "5" || stepParam === "review") {
        setCurrentStep(5);
      } else {
        if (!stepParam) {
          const url = new URL(window.location.href);
          url.searchParams.set("step", "1");
          window.history.replaceState({ step: 1 }, "", url.toString());
        }
        setCurrentStep(1);
      }

      const onPopState = () => {
        const currentParams = new URLSearchParams(window.location.search);
        const currentStepParam = currentParams.get("step");
        if (currentStepParam === "2") setCurrentStep(2);
        else if (currentStepParam === "3") setCurrentStep(3);
        else if (currentStepParam === "4" || currentStepParam === "plan" || currentStepParam === "pricing") setCurrentStep(4);
        else if (currentStepParam === "5" || currentStepParam === "review") setCurrentStep(5);
        else setCurrentStep(1);

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, []);

  // Step 3: Dual OTP Verification State (Mobile + Email)
  // Mobile OTP
  const [mobileOtp, setMobileOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileVerificationToken, setMobileVerificationToken] = useState<string | null>(null);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  const [mobileOtpError, setMobileOtpError] = useState<string | null>(null);
  const [mobileOtpSuccess, setMobileOtpSuccess] = useState<string | null>(null);

  // Email OTP
  const [emailOtp, setEmailOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpSuccess, setEmailOtpSuccess] = useState<string | null>(null);

  // Verified tracking to detect edits after verification
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState<string | null>(null);
  const [registrationSessionId, setRegistrationSessionId] = useState<string>("");
  const [draftHydrated, setDraftHydrated] = useState(false);

  // Synchronous submission locks to prevent double clicks / concurrent verify race conditions
  const verifyingMobileRef = useRef(false);
  const verifyingEmailRef = useRef(false);
  const sendingMobileRef = useRef(false);
  const sendingEmailRef = useRef(false);

  // In-step quick change states for Step 3
  const [isChangingPhoneInStep3, setIsChangingPhoneInStep3] = useState(false);
  const [inlineNewPhone, setInlineNewPhone] = useState("");
  const [isChangingEmailInStep3, setIsChangingEmailInStep3] = useState(false);
  const [inlineNewEmail, setInlineNewEmail] = useState("");

  const createRegistrationSessionId = () => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `reg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };

  // Restore draft and verification state from localStorage on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("school_registration_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.institution) setInstitution(draft.institution);
        if (draft.admin) setAdmin(draft.admin);
        if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan);
        if (draft.billingCycle) setBillingCycle(draft.billingCycle);
        if (draft.mobileVerificationToken) setMobileVerificationToken(draft.mobileVerificationToken);
        if (draft.emailVerificationToken) setEmailVerificationToken(draft.emailVerificationToken);
        if (draft.verifiedPhoneNumber) setVerifiedPhoneNumber(draft.verifiedPhoneNumber);
        if (draft.verifiedEmailAddress) setVerifiedEmailAddress(draft.verifiedEmailAddress);
        if (draft.mobileVerified) setMobileVerified(true);
        if (draft.emailVerified) setEmailVerified(true);
        setRegistrationSessionId(draft.registrationSessionId || createRegistrationSessionId());
      } else {
        setRegistrationSessionId(createRegistrationSessionId());
      }
    } catch {
      setRegistrationSessionId(createRegistrationSessionId());
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  // Persist draft and tokens to localStorage whenever registration data changes
  useEffect(() => {
    if (typeof window === "undefined" || !draftHydrated) return;
    try {
      localStorage.setItem(
        "school_registration_draft",
        JSON.stringify({
          registrationSessionId,
          institution,
          admin,
          selectedPlan,
          billingCycle,
          mobileVerified,
          emailVerified,
          mobileVerificationToken,
          emailVerificationToken,
          verifiedPhoneNumber,
          verifiedEmailAddress,
        }),
      );
    } catch {}
  }, [
    draftHydrated,
    registrationSessionId,
    institution,
    admin,
    selectedPlan,
    billingCycle,
    mobileVerified,
    emailVerified,
    mobileVerificationToken,
    emailVerificationToken,
    verifiedPhoneNumber,
    verifiedEmailAddress,
  ]);

  // Synchronize live verification status from the backend (single source of truth)
  const syncVerificationWithBackend = async (
    targetPhone?: string,
    targetEmail?: string,
    overridePhoneToken?: string | null,
    overrideEmailToken?: string | null,
  ) => {
    const phone = (targetPhone ?? admin.adminPhone).trim();
    const email = (targetEmail ?? admin.adminEmail).trim().toLowerCase();
    if (!phone && !email) return null;

    try {
      const params = new URLSearchParams();
      if (phone) params.set("phone", phone);
      if (email) params.set("email", email);
      const pToken = overridePhoneToken !== undefined ? overridePhoneToken : mobileVerificationToken;
      const eToken = overrideEmailToken !== undefined ? overrideEmailToken : emailVerificationToken;
      if (pToken) params.set("phoneToken", pToken);
      if (eToken) params.set("emailToken", eToken);
      if (registrationSessionId) params.set("registrationSessionId", registrationSessionId);

      const res = await fetch(`/api/auth/otp/status?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (phone) {
            setMobileVerified(Boolean(json.data.isMobileVerified));
            if (json.data.isMobileVerified) {
              setVerifiedPhoneNumber(phone);
              if (json.data.mobileVerificationToken) {
                setMobileVerificationToken(json.data.mobileVerificationToken);
              }
            } else {
              setVerifiedPhoneNumber(null);
              setMobileVerificationToken(null);
            }
          }
          if (email) {
            setEmailVerified(Boolean(json.data.isEmailVerified));
            if (json.data.isEmailVerified) {
              setVerifiedEmailAddress(email);
              if (json.data.emailVerificationToken) {
                setEmailVerificationToken(json.data.emailVerificationToken);
              }
            } else {
              setVerifiedEmailAddress(null);
              setEmailVerificationToken(null);
            }
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn("[RegisterSchool] Verification sync error:", e);
    }
    return null;
  };

  // Re-verify with backend once draft is hydrated and upon entering Step 3 or Step 5
  useEffect(() => {
    if (draftHydrated && (currentStep === 3 || currentStep === 5)) {
      syncVerificationWithBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, draftHydrated]);

  // Resend Countdown Timers
  useEffect(() => {
    if (currentStep === 3 && (mobileResendTimer > 0 || emailResendTimer > 0)) {
      const timer = setInterval(() => {
        setMobileResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setEmailResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, mobileResendTimer, emailResendTimer]);

  // Step 4: Submission & Result
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    schoolId: string;
    schoolName: string;
    slug: string;
    adminName: string;
    adminEmail?: string;
  } | null>(null);

  // Step 1 validation
  const validateStep1 = () => {
    if (!institution.name.trim()) return "Please enter School / Institution Name";
    if (!institution.contactPhone.trim()) return "Please enter School Contact Phone";
    if (!institution.addressLine.trim()) return "Please enter Address Line";
    if (!institution.city.trim()) return "Please enter City";
    if (!institution.state.trim()) return "Please select State";
    if (!institution.pinCode.trim() || institution.pinCode.length < 6)
      return "Please enter a valid 6-digit PIN Code";
    return null;
  };

  // Step 2 validation
  const validateStep2 = () => {
    if (!admin.adminName.trim()) return "Please enter Administrator Full Name";
    if (!admin.adminPhone.trim()) return "Please enter Administrator Mobile Number";
    if (!admin.adminEmail.trim() || !admin.adminEmail.includes("@"))
      return "Please enter a valid Administrator Email Address";
    if (!admin.password) return "Please enter a Password";
    if (admin.password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(admin.password)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(admin.password)) return "Password must contain at least one number";
    if (admin.password !== admin.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleStep1Next = () => {
    const err = validateStep1();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    goToStep(2);
  };

  // Reset verification states when fields are altered
  const resetEmailVerification = () => {
    setEmailVerified(false);
    setVerifiedEmailAddress(null);
    setEmailVerificationToken(null);
    setEmailOtpSent(false);
    setEmailOtp(["", "", "", "", "", ""]);
    setEmailOtpSuccess(null);
    setEmailOtpError(null);
    setEmailResendTimer(0);
  };

  const resetMobileVerification = () => {
    setMobileVerified(false);
    setVerifiedPhoneNumber(null);
    setMobileVerificationToken(null);
    setMobileOtpSent(false);
    setMobileOtp(["", "", "", "", "", ""]);
    setMobileOtpSuccess(null);
    setMobileOtpError(null);
    setMobileResendTimer(0);
  };

  // Field change helpers that enforce re-verification on edits
  const handleEmailChange = (newEmail: string) => {
    const trimmed = newEmail.trim().toLowerCase();
    const oldEmail = admin.adminEmail.trim().toLowerCase();
    setAdmin((prev) => ({ ...prev, adminEmail: newEmail }));
    if (trimmed !== oldEmail) {
      resetEmailVerification();
    }
  };

  const handlePhoneChange = (newPhone: string) => {
    const trimmed = newPhone.trim();
    const oldPhone = admin.adminPhone.trim();
    setAdmin((prev) => ({ ...prev, adminPhone: newPhone }));
    if (trimmed !== oldPhone) {
      resetMobileVerification();
    }
  };

  // Mobile OTP Handlers
  const handleSendMobileOtp = async (overridePhone?: string) => {
    if (sendingMobileRef.current) return;
    const targetPhone = (overridePhone || admin.adminPhone).trim();
    if (!targetPhone) {
      setMobileOtpError("Please enter mobile number in Step 2");
      return;
    }
    sendingMobileRef.current = true;
    setIsSendingMobileOtp(true);
    setMobileOtpError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          purpose: "REGISTRATION",
          registrationSessionId: registrationSessionId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send mobile OTP");
      }
      setMobileOtpSent(true);
      setMobileResendTimer(data.data?.cooldownSeconds || 60);
      setMobileOtpSuccess(data.message || "OTP sent to your mobile");
      setTimeout(() => setMobileOtpSuccess(null), 6000);
    } catch (err: unknown) {
      setMobileOtpError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      sendingMobileRef.current = false;
      setIsSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (verifyingMobileRef.current) return;
    const code = mobileOtp.map((d) => d.replace(/\D/g, "")).join("");
    if (code.length !== 6) {
      setMobileOtpError("Please enter all 6 digits of the mobile OTP");
      return;
    }
    const targetPhone = admin.adminPhone.trim();
    verifyingMobileRef.current = true;
    setIsVerifyingMobileOtp(true);
    setMobileOtpError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: targetPhone,
          channel: "SMS",
          type: "mobile",
          purpose: "REGISTRATION",
          code,
          registrationSessionId: registrationSessionId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid verification code");
      }
      const token = data.data?.verificationToken || null;
      setMobileVerified(true);
      setVerifiedPhoneNumber(targetPhone);
      setMobileVerificationToken(token);
      setMobileOtpSuccess(data.message || "Mobile number verified successfully!");
    } catch (err: unknown) {
      setMobileOtpError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      verifyingMobileRef.current = false;
      setIsVerifyingMobileOtp(false);
    }
  };

  // Email OTP Handlers
  const handleSendEmailOtp = async (overrideEmail?: string) => {
    if (sendingEmailRef.current) return;
    const targetEmail = (overrideEmail || admin.adminEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailOtpError("Please enter a valid email address");
      return;
    }
    sendingEmailRef.current = true;
    setIsSendingEmailOtp(true);
    setEmailOtpError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          purpose: "REGISTRATION",
          recipientName: admin.adminName,
          registrationSessionId: registrationSessionId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to send email OTP");
      }
      setEmailOtpSent(true);
      setEmailResendTimer(data.data?.cooldownSeconds || 60);
      setEmailOtpSuccess(data.message || `OTP sent to ${targetEmail}`);
      setTimeout(() => setEmailOtpSuccess(null), 6000);
    } catch (err: unknown) {
      setEmailOtpError(err instanceof Error ? err.message : "Failed to send email OTP");
    } finally {
      sendingEmailRef.current = false;
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (verifyingEmailRef.current) return;
    const code = emailOtp.map((d) => d.replace(/\D/g, "")).join("");
    if (code.length !== 6) {
      setEmailOtpError("Please enter all 6 digits of the email OTP");
      return;
    }
    const targetEmail = admin.adminEmail.trim().toLowerCase();
    verifyingEmailRef.current = true;
    setIsVerifyingEmailOtp(true);
    setEmailOtpError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: targetEmail,
          channel: "EMAIL",
          type: "email",
          purpose: "REGISTRATION",
          code,
          registrationSessionId: registrationSessionId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid verification code");
      }
      const token = data.data?.verificationToken || null;
      setEmailVerified(true);
      setVerifiedEmailAddress(targetEmail);
      setEmailVerificationToken(token);
      setEmailOtpSuccess(data.message || "Email address verified successfully!");
    } catch (err: unknown) {
      setEmailOtpError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      verifyingEmailRef.current = false;
      setIsVerifyingEmailOtp(false);
    }
  };

  // Step 3 Quick-Change Handlers: Updates address and immediately requires verification for new destination
  const handleApplyNewEmailInStep3 = async () => {
    const trimmed = inlineNewEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailOtpError("Please enter a valid email address");
      return;
    }
    if (trimmed === admin.adminEmail.trim().toLowerCase() && emailVerified) {
      setIsChangingEmailInStep3(false);
      return;
    }
    setAdmin((prev) => ({ ...prev, adminEmail: trimmed }));
    resetEmailVerification();
    setIsChangingEmailInStep3(false);
    await handleSendEmailOtp(trimmed);
  };

  const handleApplyNewPhoneInStep3 = async () => {
    const trimmed = inlineNewPhone.trim();
    if (!trimmed || trimmed.length < 7) {
      setMobileOtpError("Please enter a valid mobile number");
      return;
    }
    if (trimmed === admin.adminPhone.trim() && mobileVerified) {
      setIsChangingPhoneInStep3(false);
      return;
    }
    setAdmin((prev) => ({ ...prev, adminPhone: trimmed }));
    resetMobileVerification();
    setIsChangingPhoneInStep3(false);
    await handleSendMobileOtp(trimmed);
  };

  const handleStep2Next = async () => {
    const err = validateStep2();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    goToStep(3);

    // Sync with backend verification state
    const backendStatus = await syncVerificationWithBackend();
    const phoneAlreadyVerified = backendStatus?.isMobileVerified ?? mobileVerified;
    const emailAlreadyVerified = backendStatus?.isEmailVerified ?? emailVerified;

    // Automatically trigger OTP delivery ONLY if not already verified
    if (!phoneAlreadyVerified && !mobileOtpSent) {
      handleSendMobileOtp();
    }
    if (!emailAlreadyVerified && !emailOtpSent) {
      handleSendEmailOtp();
    }
  };

  const handleStep3Next = async () => {
    // Check against backend before progressing
    const backendStatus = await syncVerificationWithBackend();
    const phoneOk = backendStatus?.isMobileVerified ?? mobileVerified;
    const emailOk = backendStatus?.isEmailVerified ?? emailVerified;

    if (!phoneOk || !emailOk) {
      const unverified: string[] = [];
      if (!phoneOk) unverified.push("Mobile number");
      if (!emailOk) unverified.push("Email address");
      setErrorMessage(`Please verify both: ${unverified.join(" and ")} before continuing.`);
      return;
    }
    if (verifiedPhoneNumber && admin.adminPhone.trim() !== verifiedPhoneNumber) {
      setErrorMessage("Mobile number was changed after verification. Please verify your new number.");
      return;
    }
    if (verifiedEmailAddress && admin.adminEmail.trim().toLowerCase() !== verifiedEmailAddress) {
      setErrorMessage("Email address was changed after verification. Please verify your new email.");
      return;
    }
    setErrorMessage(null);
    goToStep(4);
  };

  const handleFinalSubmit = async () => {
    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service to proceed");
      return;
    }

    // Single source of truth: Verify against backend
    const backendStatus = await syncVerificationWithBackend();
    const phoneOk = backendStatus?.isMobileVerified ?? mobileVerified;
    const emailOk = backendStatus?.isEmailVerified ?? emailVerified;

    if (!phoneOk || !emailOk) {
      const unverified: string[] = [];
      if (!phoneOk) unverified.push("Mobile number");
      if (!emailOk) unverified.push("Email address");
      setErrorMessage(
        `Please complete verification for: ${unverified.join(" and ")}. Both are required to activate your account.`,
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        institution: {
          ...institution,
          contactPhone: institution.contactPhone.replace(/\s+/g, ""),
        },
        administrator: {
          ...admin,
          adminPhone: admin.adminPhone.replace(/\s+/g, ""),
        },
        plan: selectedPlan,
        billingCycle,
        registrationSessionId: registrationSessionId || undefined,
        mobileVerificationToken:
          backendStatus?.mobileVerificationToken || mobileVerificationToken || undefined,
        emailVerificationToken:
          backendStatus?.emailVerificationToken || emailVerificationToken || undefined,
      };

      const res = await fetch("/api/auth/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to register school.");
      }

      // Clear draft upon successful registration
      try {
        localStorage.removeItem("school_registration_draft");
      } catch {}

      setRegistrationSuccess({
        schoolId: data.data.schoolId,
        schoolName: data.data.schoolName,
        slug: data.data.slug,
        adminName: data.data.adminName,
        adminEmail: data.data.adminEmail,
      });
      if (data.data?.slug) {
        router.prefetch(`/${data.data.slug}` as Route);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        "school_registration_draft",
        JSON.stringify({
          institution,
          admin,
          selectedPlan,
          billingCycle,
          mobileVerified,
          emailVerified,
          mobileVerificationToken,
          emailVerificationToken,
          verifiedPhoneNumber,
          verifiedEmailAddress,
        }),
      );
      setSaveDraftMessage("Progress saved to your browser!");
      setTimeout(() => setSaveDraftMessage(null), 4000);
    } catch {
      setSaveDraftMessage("Unable to save draft locally.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("File exceeds 2 MB limit");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setInstitution({ ...institution, logoUrl: uploadEvent.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-screen text-[#1B1D45] dark:text-[#F3F5FF]">
      {/* Luminous Atmospheric Aurora & Wave Background */}
      <AtmosphericBackground />

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-[#D6DBF0] dark:border-[#2C3159] bg-white/95 dark:bg-[#141731]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Navigation Links */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4D5072] dark:text-[#B4B9DA] md:flex">
            <Link href="/#features" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Features
            </Link>
            <Link href="/#pricing" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Pricing
            </Link>
            <Link href="/#for-schools" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              For Schools
            </Link>
            <Link href="/#contact" className="transition-colors hover:text-[#663CF6] dark:hover:text-[#C4B5FD]">
              Support
            </Link>
          </nav>

          {/* Theme Toggle & Sign In CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <span className="hidden text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA] sm:inline">
              Already have an account?
            </span>
            <Link href="/login">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-[12px] text-xs font-bold"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT GRID */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={
            currentStep >= 4
              ? "mx-auto max-w-5xl"
              : "grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
          }
        >
          {/* LEFT COLUMN: HERO (Only on Steps 1, 2, 3) */}
          {currentStep < 4 && (
            <div className="space-y-6 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-4xl">
                  Register Your School
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] font-medium">
                  Create your school&apos;s own independent workspace on our School
                  Management Platform.
                </p>
              </div>

              {/* Value Propositions on Desktop */}
              <div className="hidden lg:block space-y-4 pt-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      Your own secure school workspace
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                      Manage students, staff, academics, fees and more
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      Multi-user access for your team
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                      Admin, teachers and other staff with role-based access
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      Quick and easy setup
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                      Get started in minutes and configure your school in the onboarding
                      wizard
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Vector School Illustration */}
              <div className="hidden lg:block pt-2">
                <SchoolIllustration />
              </div>
            </div>
          )}

          {/* CENTER COLUMN: MAIN REGISTRATION FORM */}
          <div
            className={`space-y-6 ${
              currentStep >= 4 ? "w-full" : "lg:col-span-6"
            }`}
          >
            <div className="rounded-[20px] border border-[#D0D6F0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-4 shadow-[0_12px_32px_rgba(24,18,77,0.09)] sm:p-8">
              {/* Stepper Header */}
              <div className="mb-7 sm:mb-8">
                <div
                  role="navigation"
                  aria-label="Registration progress"
                  className="relative grid grid-cols-5 items-start gap-1 sm:gap-2"
                >
                  {/* Connecting Track aligned to the exact center of the step circles */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[10%] right-[10%] top-3.5 sm:top-4 z-0 h-0.5 -translate-y-1/2 rounded-full bg-[#DFE3F5] dark:bg-[#2C3159]"
                  >
                    <div
                      className="h-full rounded-full bg-[#663CF6] transition-all duration-300"
                      style={{
                        width: `${((currentStep - 1) / 4) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Step 1 */}
                  <div className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      aria-label="Step 1: Institution Details"
                      aria-current={currentStep === 1 ? "step" : undefined}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        currentStep === 1
                          ? "bg-[#663CF6] text-white ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35"
                          : currentStep > 1
                            ? "bg-[#663CF6] text-white ring-2 ring-white dark:ring-[#141731]"
                            : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA] ring-2 ring-white dark:ring-[#141731]"
                      }`}
                    >
                      {currentStep > 1 ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : "1"}
                    </button>
                    <span className="mt-1.5 w-full text-center text-[10px] sm:text-[11px] leading-tight font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      <span className="sm:hidden">School</span>
                      <span className="hidden sm:inline">Institution Details</span>
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateStep1()) goToStep(2);
                      }}
                      aria-label="Step 2: Administrator"
                      aria-current={currentStep === 2 ? "step" : undefined}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        currentStep === 2
                          ? "bg-[#663CF6] text-white ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35"
                          : currentStep > 2
                            ? "bg-[#663CF6] text-white ring-2 ring-white dark:ring-[#141731]"
                            : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA] ring-2 ring-white dark:ring-[#141731]"
                      }`}
                    >
                      {currentStep > 2 ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : "2"}
                    </button>
                    <span
                      className={`mt-1.5 w-full text-center text-[10px] sm:text-[11px] leading-tight ${
                        currentStep >= 2
                          ? "font-bold text-[#08093B] dark:text-[#F3F5FF]"
                          : "font-semibold text-[#4D5072] dark:text-[#B4B9DA]"
                      }`}
                    >
                      <span className="sm:hidden">Admin</span>
                      <span className="hidden sm:inline">Administrator</span>
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateStep1() && !validateStep2()) goToStep(3);
                      }}
                      aria-label="Step 3: Verify & Confirm"
                      aria-current={currentStep === 3 ? "step" : undefined}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        currentStep === 3
                          ? "bg-[#663CF6] text-white ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35"
                          : currentStep > 3
                            ? "bg-[#663CF6] text-white ring-2 ring-white dark:ring-[#141731]"
                            : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA] ring-2 ring-white dark:ring-[#141731]"
                      }`}
                    >
                      {currentStep > 3 ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : "3"}
                    </button>
                    <span
                      className={`mt-1.5 w-full text-center text-[10px] sm:text-[11px] leading-tight ${
                        currentStep >= 3
                          ? "font-bold text-[#08093B] dark:text-[#F3F5FF]"
                          : "font-semibold text-[#4D5072] dark:text-[#B4B9DA]"
                      }`}
                    >
                      <span className="sm:hidden">Verify</span>
                      <span className="hidden sm:inline">Verify & Confirm</span>
                    </span>
                  </div>

                  {/* Step 4: Select Plan */}
                  <div className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateStep1() && !validateStep2()) goToStep(4);
                      }}
                      aria-label="Step 4: Select Plan"
                      aria-current={currentStep === 4 ? "step" : undefined}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        currentStep === 4
                          ? "bg-[#663CF6] text-white ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35"
                          : currentStep > 4
                            ? "bg-[#663CF6] text-white ring-2 ring-white dark:ring-[#141731]"
                            : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA] ring-2 ring-white dark:ring-[#141731]"
                      }`}
                    >
                      {currentStep > 4 ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : "4"}
                    </button>
                    <span
                      className={`mt-1.5 w-full text-center text-[10px] sm:text-[11px] leading-tight ${
                        currentStep >= 4
                          ? "font-bold text-[#08093B] dark:text-[#F3F5FF]"
                          : "font-semibold text-[#4D5072] dark:text-[#B4B9DA]"
                      }`}
                    >
                      <span className="sm:hidden">Plan</span>
                      <span className="hidden sm:inline">Select Plan</span>
                    </span>
                  </div>

                  {/* Step 5: Review & Create */}
                  <div className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateStep1() && !validateStep2()) goToStep(5);
                      }}
                      aria-label="Step 5: Review & Create"
                      aria-current={currentStep === 5 ? "step" : undefined}
                      className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        currentStep === 5
                          ? "bg-[#663CF6] text-white ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35"
                          : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA] ring-2 ring-white dark:ring-[#141731]"
                      }`}
                    >
                      5
                    </button>
                    <span
                      className={`mt-1.5 w-full text-center text-[10px] sm:text-[11px] leading-tight ${
                        currentStep === 5
                          ? "font-bold text-[#08093B] dark:text-[#F3F5FF]"
                          : "font-semibold text-[#4D5072] dark:text-[#B4B9DA]"
                      }`}
                    >
                      <span className="sm:hidden">Review</span>
                      <span className="hidden sm:inline">Review & Create</span>
                    </span>
                  </div>
                </div>

                {/* Compact Mobile Current-Step Pill */}
                <div className="mt-3 flex justify-center sm:hidden">
                  <span className="inline-flex items-center rounded-full border border-[#DDD4FC] dark:border-[#3B306E] bg-[#F5F1FE] dark:bg-[#221B44] px-3 py-0.5 text-[11px] font-bold text-[#5A32E6] dark:text-[#B59CFF]">
                    Step {currentStep} of 5 &middot;{" "}
                    {currentStep === 1
                      ? "Institution Details"
                      : currentStep === 2
                        ? "Administrator"
                        : currentStep === 3
                          ? "Verify & Confirm"
                          : currentStep === 4
                            ? "Select Plan"
                            : "Review & Create"}
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 dark:border-rose-800/70 bg-red-50 dark:bg-red-950/45 p-3.5 text-xs font-medium text-red-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Draft Alert */}
              {saveDraftMessage && (
                <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/50 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {saveDraftMessage}
                </div>
              )}

              {/* STEP FORM CONTENTS */}
                  {/* STEP 1: INSTITUTION DETAILS (Screenshot View) */}
                  {currentStep === 1 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleStep1Next();
                      }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                          Institution Details
                        </h2>
                        <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                          Tell us about your school or institution.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* School Name */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            School / Institution Name{" "}
                            <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. Sunrise International School"
                            value={institution.name}
                            onChange={(e) =>
                              setInstitution({ ...institution, name: e.target.value })
                            }
                          />
                        </div>

                        {/* School Category */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            School Type / Category{" "}
                            <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Select
                            value={institution.category}
                            onChange={(e) =>
                              setInstitution({ ...institution, category: e.target.value })
                            }
                            options={SCHOOL_CATEGORIES.map((c) => ({
                              label: c,
                              value: c,
                            }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Board / Affiliation */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            Board / Affiliation
                          </Label>
                          <Select
                            value={institution.affiliationBoard}
                            onChange={(e) =>
                              setInstitution({
                                ...institution,
                                affiliationBoard: e.target.value,
                              })
                            }
                            options={AFFILIATION_BOARDS.map((b) => ({
                              label: b,
                              value: b,
                            }))}
                          />
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            Contact Phone (School){" "}
                            <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <div className="flex rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] shadow-xs focus-within:border-[#663CF6] dark:focus-within:border-[#9D7CFE] focus-within:ring-2 focus-within:ring-[#663CF6]/20 transition-all">
                            <div className="border-r border-[#CAD0EB] dark:border-[#343A68] bg-[#F7F9FE] dark:bg-[#171B38] px-2.5 py-1 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] rounded-l-[10px] shrink-0 flex items-center">
                              <CountryCodeSelect
                                id="register-school-country-code-select"
                                value={schoolCountryCode}
                                onChange={(c) => {
                                  setSchoolCountryCode(c.dialCode);
                                  const digits = institution.contactPhone.replace(/^\+\d+\s*/, "");
                                  setInstitution({
                                    ...institution,
                                    contactPhone: `${c.dialCode} ${digits}`.trim(),
                                  });
                                }}
                              />
                            </div>
                            <input
                              id="register-school-phone-input"
                              type="tel"
                              placeholder="98765 43210"
                              value={institution.contactPhone.replace(/^\+\d+\s*/, "")}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^\d\s]/g, "");
                                setInstitution({
                                  ...institution,
                                  contactPhone: `${schoolCountryCode} ${cleaned}`.trim(),
                                });
                              }}
                              className="w-full rounded-r-[10px] bg-transparent px-3 py-2 text-xs font-semibold text-[#1B1D45] dark:text-[#F3F5FF] placeholder:text-[#999BB2] dark:placeholder:text-[#7A81AC] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Official Website */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          Official Website (Optional)
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                            <Globe className="h-4 w-4" />
                          </span>
                          <Input
                            placeholder="https://www.sunriseis.edu.in"
                            value={institution.website}
                            onChange={(e) =>
                              setInstitution({ ...institution, website: e.target.value })
                            }
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {/* Registered Address Header */}
                      <div className="pt-2">
                        <Label className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                          Registered Address{" "}
                          <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                        </Label>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            Address Line <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Input
                            placeholder="123, Green Valley Road"
                            value={institution.addressLine}
                            onChange={(e) =>
                              setInstitution({
                                ...institution,
                                addressLine: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            Locality / Area{" "}
                            <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Input
                            placeholder="Sector 18"
                            value={institution.locality}
                            onChange={(e) =>
                              setInstitution({ ...institution, locality: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            City <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Input
                            placeholder="Noida"
                            value={institution.city}
                            onChange={(e) =>
                              setInstitution({ ...institution, city: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            State <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Select
                            value={institution.state}
                            onChange={(e) =>
                              setInstitution({ ...institution, state: e.target.value })
                            }
                            options={INDIAN_STATES.map((s) => ({ label: s, value: s }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            PIN Code <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                          </Label>
                          <Input
                            placeholder="201301"
                            maxLength={6}
                            value={institution.pinCode}
                            onChange={(e) =>
                              setInstitution({ ...institution, pinCode: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Country */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          Country <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                        </Label>
                        <Select
                          value={institution.country}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const matchedCountry = COUNTRIES.find((c) => c.name === selectedName);
                            if (matchedCountry) {
                              setSchoolCountryCode(matchedCountry.dialCode);
                              setAdminCountryCode(matchedCountry.dialCode);
                              const schoolDigits = institution.contactPhone.replace(/^\+\d+\s*/, "");
                              const adminDigits = admin.adminPhone.replace(/^\+\d+\s*/, "");
                              setInstitution({
                                ...institution,
                                country: selectedName,
                                contactPhone: `${matchedCountry.dialCode} ${schoolDigits}`.trim(),
                              });
                              setAdmin({
                                ...admin,
                                adminPhone: `${matchedCountry.dialCode} ${adminDigits}`.trim(),
                              });
                            } else {
                              setInstitution({ ...institution, country: selectedName });
                            }
                          }}
                          options={COUNTRIES.map((c) => ({
                            label: `${c.flag} ${c.name} (${c.dialCode})`,
                            value: c.name,
                          }))}
                        />
                      </div>

                      {/* School Logo */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            School Logo (Optional)
                          </Label>
                          <span
                            className="text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]"
                            title="Optional logo"
                          >
                            ⓘ
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          {/* Logo Preview Card */}
                          <div className="relative flex h-24 w-28 flex-col items-center justify-center rounded-[14px] border border-[#CAD0EB] dark:border-[#343A68] bg-[#F5F7FD] dark:bg-[#10132C] p-2 text-center shadow-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setInstitution({ ...institution, logoUrl: "" })
                              }
                              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#08093B] dark:bg-[#1E2248] text-white shadow-xs hover:bg-[#4F27E8]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {institution.logoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={institution.logoUrl}
                                alt="Logo Preview"
                                className="h-16 w-16 object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Building2 className="h-8 w-8 text-[#663CF6] dark:text-[#B59CFF]" />
                                <span className="mt-1 text-[9px] font-bold uppercase tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                                  {institution.name ? institution.name.slice(0, 12).toUpperCase() : "SCHOOL LOGO"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Upload Logo CTA */}
                          <div className="space-y-1.5">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-[#C8B8FF] dark:border-[#4B3D91] bg-[#EDE7FF] dark:bg-[#251D4A] px-4 py-2 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] shadow-xs transition hover:bg-[#DDD2FE] dark:hover:bg-[#3A2D75]">
                              <Upload className="h-4 w-4" />
                              Upload Logo
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </label>
                            <p className="text-[11px] font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                              PNG, JPG or WEBP • Max 2 MB • Recommended: 512 × 512 px
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[#DFE3F5] dark:border-[#2C3159]">
                        <Button
                          id="continue-to-admin-btn"
                          type="submit"
                          variant="gradient"
                          className="w-full sm:w-auto order-1 sm:order-2 rounded-[12px] px-6 py-2.5 text-xs font-bold shadow-md"
                        >
                          Continue to Administrator &rarr;
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleSaveDraft}
                          className="w-full sm:w-auto order-2 sm:order-1 rounded-[12px] px-5 py-2.5 text-xs font-bold shadow-xs"
                        >
                          Save & Continue Later
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: ADMINISTRATOR DETAILS (Screenshot View) */}
                  {currentStep === 2 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleStep2Next();
                      }}
                      className="space-y-5"
                    >
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                          Administrator Details
                        </h2>
                        <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                          Provide details of the main administrator who will manage this
                          school account.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Row 1: Full Name & Designation */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Administrator Full Name{" "}
                              <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                            </Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                                <User className="h-4 w-4" />
                              </span>
                              <Input
                                placeholder="e.g. Rohan Mehta"
                                value={admin.adminName}
                                onChange={(e) =>
                                  setAdmin({ ...admin, adminName: e.target.value })
                                }
                                className="pl-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Designation / Role{" "}
                              <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                            </Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                                <Briefcase className="h-4 w-4" />
                              </span>
                              <Select
                                value={admin.designation}
                                onChange={(e) =>
                                  setAdmin({ ...admin, designation: e.target.value })
                                }
                                options={DESIGNATION_ROLES.map((r) => ({
                                  label: r,
                                  value: r,
                                }))}
                                className="pl-9"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Mobile Number & Email Address */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Mobile Number{" "}
                              <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                            </Label>
                            <div className="flex rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] shadow-xs focus-within:border-[#663CF6] dark:focus-within:border-[#9D7CFE] focus-within:ring-2 focus-within:ring-[#663CF6]/20 transition-all">
                              <div className="border-r border-[#CAD0EB] dark:border-[#343A68] bg-[#F7F9FE] dark:bg-[#171B38] px-2.5 py-1 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] rounded-l-[10px] shrink-0 flex items-center">
                                <CountryCodeSelect
                                  id="register-admin-country-code-select"
                                  value={adminCountryCode}
                                  onChange={(c) => {
                                    setAdminCountryCode(c.dialCode);
                                    const digits = admin.adminPhone.replace(/^\+\d+\s*/, "");
                                    handlePhoneChange(`${c.dialCode} ${digits}`.trim());
                                  }}
                                />
                              </div>
                              <input
                                id="register-admin-phone-input"
                                type="tel"
                                placeholder="98765 43210"
                                value={admin.adminPhone.replace(/^\+\d+\s*/, "")}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/[^\d\s]/g, "");
                                  handlePhoneChange(`${adminCountryCode} ${cleaned}`.trim());
                                }}
                                className="w-full rounded-r-[10px] bg-transparent px-3 py-2 text-xs font-semibold text-[#1B1D45] dark:text-[#F3F5FF] placeholder:text-[#999BB2] dark:placeholder:text-[#7A81AC] focus:outline-none"
                              />
                            </div>
                            <p className="flex items-center gap-1.5 pt-0.5 text-[11px] font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                              <Info className="h-3.5 w-3.5 shrink-0 text-[#663CF6] dark:text-[#B59CFF]" />
                              Mobile verification with OTP is required in the next step.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Email Address <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                            </Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                                <Mail className="h-4 w-4" />
                              </span>
                              <Input
                                id="admin-email"
                                name="adminEmail"
                                autoComplete="username email"
                                type="email"
                                placeholder="principal@sunriseis.edu.in"
                                value={admin.adminEmail}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <p className="flex items-center gap-1.5 pt-0.5 text-[11px] font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                              <Info className="h-3.5 w-3.5 shrink-0 text-[#663CF6] dark:text-[#B59CFF]" />
                              Email verification with OTP is required in the next step.
                            </p>
                          </div>
                        </div>

                        {/* Notice Card: Account Access */}
                        <div className="flex items-start gap-3 rounded-[14px] border border-[#DCD3FC] dark:border-[#3B306E] bg-[#F5F1FE] dark:bg-[#221B44] p-4 text-[#202044] dark:text-[#F3F5FF]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D8CBF9] dark:ring-[#3B306E]">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Account Access
                            </h4>
                            <p className="mt-0.5 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                              Use your verified mobile number to sign in. You&apos;ll
                              receive an OTP at login.
                            </p>
                          </div>
                        </div>

                        {/* Set a Password (Optional) */}
                        <div className="pt-2 space-y-3">
                          <div>
                            <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Set a Password (Optional)
                            </h3>
                            <p className="mt-0.5 text-[11px] font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                              Add a password if your institution prefers password-based
                              login in addition to mobile OTP.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                Password
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                                  <Lock className="h-4 w-4" />
                                </span>
                                <Input
                                  id="admin-password"
                                  name="adminPassword"
                                  autoComplete="new-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={admin.password}
                                  onChange={(e) =>
                                    setAdmin({ ...admin, password: e.target.value })
                                  }
                                  className="pl-9 pr-9"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#666987] dark:text-[#AEB4D8] hover:text-[#08093B] dark:hover:text-white"
                                  tabIndex={-1}
                                  aria-label={
                                    showPassword ? "Hide password" : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                Confirm Password
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#663CF6] dark:text-[#B59CFF]">
                                  <Lock className="h-4 w-4" />
                                </span>
                                <Input
                                  id="admin-confirm-password"
                                  name="adminConfirmPassword"
                                  autoComplete="new-password"
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={admin.confirmPassword}
                                  onChange={(e) =>
                                    setAdmin({
                                      ...admin,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  className="pl-9 pr-9"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#666987] dark:text-[#AEB4D8] hover:text-[#08093B] dark:hover:text-white"
                                  tabIndex={-1}
                                  aria-label={
                                    showConfirmPassword
                                      ? "Hide confirm password"
                                      : "Show confirm password"
                                  }
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Password Criteria Checklist */}
                          <div className="mt-2 space-y-1 text-[11px] font-semibold text-[#15803D] dark:text-[#4ADE80]">
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                              <span>At least 8 characters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                              <span>Include a letter and a number</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                              <span>Use a strong, unique password</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[#DFE3F5] dark:border-[#2C3159]">
                        <Button
                          id="continue-to-verify-mobile-btn"
                          type="submit"
                          variant="gradient"
                          disabled={isSendingMobileOtp || isSendingEmailOtp}
                          className="w-full sm:w-auto order-1 sm:order-2 rounded-[12px] px-6 py-2.5 text-xs font-bold shadow-md"
                        >
                          {isSendingMobileOtp || isSendingEmailOtp ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{" "}
                              Sending Verification Codes...
                            </>
                          ) : (
                            <>Continue to Verification &rarr;</>
                          )}
                        </Button>

                        <Button
                          id="back-to-step1-btn"
                          type="button"
                          variant="secondary"
                          onClick={() => goToStep(1)}
                          className="w-full sm:w-auto order-2 sm:order-1 rounded-[12px] px-5 py-2.5 text-xs font-bold shadow-xs"
                        >
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: DUAL OTP VERIFICATION (Mobile + Email Required) */}
                  {currentStep === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                          Verify & Confirm
                        </h2>
                        <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                          Verify both your mobile number and email address to activate your school account. Both verification steps are required.
                        </p>
                      </div>

                      {/* CARD 1: MOBILE NUMBER OTP VERIFICATION */}
                      <div className="rounded-[14px] sm:rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                              <Smartphone className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                Verify Mobile Number
                              </h3>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#4D5072] dark:text-[#B4B9DA]">
                                <span>
                                  {mobileOtpSent
                                    ? "Enter the 6-digit OTP sent via SMS to"
                                    : "Click Send OTP to receive code at"}
                                </span>
                                <strong className="text-[#08093B] dark:text-[#F3F5FF] break-all">{admin.adminPhone}</strong>
                                {!mobileVerified && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInlineNewPhone(admin.adminPhone);
                                      setIsChangingPhoneInStep3(!isChangingPhoneInStep3);
                                    }}
                                    className="inline-flex items-center gap-1 font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline ml-1"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    <span>{isChangingPhoneInStep3 ? "Cancel" : "Change"}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {mobileVerified ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-3 py-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-2.5 py-0.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        {mobileVerified ? (
                          <div className="rounded-[12px] bg-[#F0FDF4] dark:bg-[#0E261F] border border-[#BBF7D0] dark:border-[#1B5742] p-3 sm:p-3.5 space-y-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="flex items-center gap-2 font-semibold text-[#15803D] dark:text-[#4ADE80]">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="break-all">Mobile number {admin.adminPhone} verified successfully.</span>
                              </span>
                              <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineNewPhone(admin.adminPhone);
                                    setIsChangingPhoneInStep3(!isChangingPhoneInStep3);
                                  }}
                                  className="font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                                >
                                  {isChangingPhoneInStep3 ? "Cancel" : "Change Mobile"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => goToStep(2)}
                                  className="text-[11px] font-semibold text-[#6B7280] dark:text-[#A5ACD2] hover:underline"
                                >
                                  Edit in Step 2
                                </button>
                              </div>
                            </div>
                            {isChangingPhoneInStep3 && (
                              <div className="pt-2 border-t border-[#BBF7D0] dark:border-[#1B5742] flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="tel"
                                  value={inlineNewPhone}
                                  onChange={(e) => setInlineNewPhone(e.target.value)}
                                  placeholder="+91 9876543210"
                                  className="h-9 w-full sm:w-auto sm:min-w-[200px] flex-1 rounded-[8px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3 text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none"
                                />
                                <Button
                                  type="button"
                                  variant="gradient"
                                  size="sm"
                                  onClick={handleApplyNewPhoneInStep3}
                                  className="w-full sm:w-auto justify-center rounded-[8px] text-xs font-bold"
                                >
                                  Update & Verify
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {/* Inline Change Number for Unverified State */}
                            {isChangingPhoneInStep3 && (
                              <div className="rounded-[10px] bg-[#F8F9FE] dark:bg-[#171B38] border border-[#CAD0EB] dark:border-[#343A68] p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="tel"
                                  value={inlineNewPhone}
                                  onChange={(e) => setInlineNewPhone(e.target.value)}
                                  placeholder="+91 9876543210"
                                  className="h-9 w-full sm:w-auto sm:min-w-[200px] flex-1 rounded-[8px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3 text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="gradient"
                                    size="sm"
                                    onClick={handleApplyNewPhoneInStep3}
                                    className="w-full sm:w-auto justify-center rounded-[8px] text-xs font-bold"
                                  >
                                    Update & Send OTP
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setIsChangingPhoneInStep3(false)}
                                    className="px-2.5 py-1 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 6 Digit Inputs & Actions */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-[320px]">
                                {mobileOtp.map((digit, idx) => (
                                  <input
                                    key={idx}
                                    id={`mobile-otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                                    maxLength={idx === 0 ? 6 : 1}
                                    value={digit}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      if (val.length === 6 || (val.length > 1 && !digit)) {
                                        const updated = [...mobileOtp];
                                        for (let i = 0; i < 6 - idx && i < val.length; i++) {
                                          updated[idx + i] = val[i] ?? "";
                                        }
                                        setMobileOtp(updated);
                                        const nextIdx = Math.min(idx + val.length, 5);
                                        document.getElementById(`mobile-otp-${nextIdx}`)?.focus();
                                        return;
                                      }
                                      const updated = [...mobileOtp];
                                      const nextChar = digit && val.length > 1 ? val.slice(-1) : val.slice(-1);
                                      updated[idx] = nextChar;
                                      setMobileOtp(updated);
                                      if (nextChar && idx < 5) {
                                        document.getElementById(`mobile-otp-${idx + 1}`)?.focus();
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Backspace" && !mobileOtp[idx] && idx > 0) {
                                        document.getElementById(`mobile-otp-${idx - 1}`)?.focus();
                                      }
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                      if (pasted) {
                                        const updated = [...mobileOtp];
                                        for (let i = 0; i < 6; i++) {
                                          updated[i] = pasted[i] || "";
                                        }
                                        setMobileOtp(updated);
                                        const nextIdx = Math.min(pasted.length, 5);
                                        document.getElementById(`mobile-otp-${nextIdx}`)?.focus();
                                      }
                                    }}
                                    className="h-11 w-10 sm:h-12 sm:w-11 flex-1 min-w-0 max-w-[48px] rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] text-center text-lg font-black text-[#08093B] dark:text-[#F3F5FF] shadow-xs focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 transition-all"
                                  />
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {/* Verify Action */}
                                <Button
                                  type="button"
                                  variant="gradient"
                                  onClick={handleVerifyMobileOtp}
                                  disabled={isVerifyingMobileOtp || mobileOtp.join("").length !== 6}
                                  className="w-full sm:w-auto justify-center rounded-[10px] px-5 py-2.5 text-xs font-bold shadow-xs flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[150px]"
                                >
                                  {isVerifyingMobileOtp ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-3.5 w-3.5" /> Verify Mobile OTP
                                    </>
                                  )}
                                </Button>

                                {/* Resend Action Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSendMobileOtp()}
                                  disabled={isSendingMobileOtp || mobileResendTimer > 0}
                                  className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3.5 py-2.5 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA] hover:bg-[#F8F9FE] dark:hover:bg-[#1E2248] hover:border-[#B4BBE2] dark:hover:border-[#4B538F] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex-1 sm:flex-initial min-w-[130px]"
                                >
                                  {isSendingMobileOtp ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Sending code...</span>
                                    </>
                                  ) : mobileResendTimer > 0 ? (
                                    <>
                                      <Clock className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Resend in {mobileResendTimer}s</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Resend Code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Notifications / Errors */}
                            {mobileOtpError && (
                              <p className="text-xs font-semibold text-red-600 dark:text-rose-400 flex items-center gap-1.5 break-words">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span>{mobileOtpError}</span>
                              </p>
                            )}
                            {mobileOtpSuccess && (
                              <p className="text-xs font-semibold text-green-600 dark:text-[#4ADE80] flex items-center gap-1.5 break-words">
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                <span>{mobileOtpSuccess}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CARD 2: EMAIL ADDRESS OTP VERIFICATION */}
                      <div className="rounded-[14px] sm:rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E0F2FE] dark:bg-[#132645] text-[#0284C7] dark:text-[#56C2FF]">
                              <Mail className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                                Verify Email Address
                              </h3>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#4D5072] dark:text-[#B4B9DA]">
                                <span>
                                  {emailOtpSent
                                    ? "Enter the 6-digit verification code sent to"
                                    : "Click Send OTP to receive code at"}
                                </span>
                                <strong className="text-[#08093B] dark:text-[#F3F5FF] break-all">{admin.adminEmail}</strong>
                                {!emailVerified && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInlineNewEmail(admin.adminEmail);
                                      setIsChangingEmailInStep3(!isChangingEmailInStep3);
                                    }}
                                    className="inline-flex items-center gap-1 font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline ml-1"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    <span>{isChangingEmailInStep3 ? "Cancel" : "Change"}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {emailVerified ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-3 py-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] px-2.5 py-0.5 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF]">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        {emailVerified ? (
                          <div className="rounded-[12px] bg-[#F0FDF4] dark:bg-[#0E261F] border border-[#BBF7D0] dark:border-[#1B5742] p-3 sm:p-3.5 space-y-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="flex items-center gap-2 font-semibold text-[#15803D] dark:text-[#4ADE80]">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="break-all">Email address {admin.adminEmail} verified successfully.</span>
                              </span>
                              <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineNewEmail(admin.adminEmail);
                                    setIsChangingEmailInStep3(!isChangingEmailInStep3);
                                  }}
                                  className="font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                                >
                                  {isChangingEmailInStep3 ? "Cancel" : "Change Email"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => goToStep(2)}
                                  className="text-[11px] font-semibold text-[#6B7280] dark:text-[#A5ACD2] hover:underline"
                                >
                                  Edit in Step 2
                                </button>
                              </div>
                            </div>
                            {isChangingEmailInStep3 && (
                              <div className="pt-2 border-t border-[#BBF7D0] dark:border-[#1B5742] flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="email"
                                  value={inlineNewEmail}
                                  onChange={(e) => setInlineNewEmail(e.target.value)}
                                  placeholder="new.email@school.com"
                                  className="h-9 w-full sm:w-auto sm:min-w-[220px] flex-1 rounded-[8px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3 text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none"
                                />
                                <Button
                                  type="button"
                                  variant="gradient"
                                  size="sm"
                                  onClick={handleApplyNewEmailInStep3}
                                  className="w-full sm:w-auto justify-center rounded-[8px] text-xs font-bold"
                                >
                                  Update & Verify
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {/* Inline Change Email for Unverified State */}
                            {isChangingEmailInStep3 && (
                              <div className="rounded-[10px] bg-[#F8F9FE] dark:bg-[#171B38] border border-[#CAD0EB] dark:border-[#343A68] p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="email"
                                  value={inlineNewEmail}
                                  onChange={(e) => setInlineNewEmail(e.target.value)}
                                  placeholder="new.email@school.com"
                                  className="h-9 w-full sm:w-auto sm:min-w-[220px] flex-1 rounded-[8px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3 text-xs font-semibold text-[#08093B] dark:text-[#F3F5FF] focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="gradient"
                                    size="sm"
                                    onClick={handleApplyNewEmailInStep3}
                                    className="w-full sm:w-auto justify-center rounded-[8px] text-xs font-bold"
                                  >
                                    Update & Send OTP
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setIsChangingEmailInStep3(false)}
                                    className="px-2.5 py-1 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 6 Digit Inputs & Actions */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-[320px]">
                                {emailOtp.map((digit, idx) => (
                                  <input
                                    key={idx}
                                    id={`email-otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                                    maxLength={idx === 0 ? 6 : 1}
                                    value={digit}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "");
                                      if (val.length === 6 || (val.length > 1 && !digit)) {
                                        const updated = [...emailOtp];
                                        for (let i = 0; i < 6 - idx && i < val.length; i++) {
                                          updated[idx + i] = val[i] ?? "";
                                        }
                                        setEmailOtp(updated);
                                        const nextIdx = Math.min(idx + val.length, 5);
                                        document.getElementById(`email-otp-${nextIdx}`)?.focus();
                                        return;
                                      }
                                      const updated = [...emailOtp];
                                      const nextChar = digit && val.length > 1 ? val.slice(-1) : val.slice(-1);
                                      updated[idx] = nextChar;
                                      setEmailOtp(updated);
                                      if (nextChar && idx < 5) {
                                        document.getElementById(`email-otp-${idx + 1}`)?.focus();
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Backspace" && !emailOtp[idx] && idx > 0) {
                                        document.getElementById(`email-otp-${idx - 1}`)?.focus();
                                      }
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                      if (pasted) {
                                        const updated = [...emailOtp];
                                        for (let i = 0; i < 6; i++) {
                                          updated[i] = pasted[i] || "";
                                        }
                                        setEmailOtp(updated);
                                        const nextIdx = Math.min(pasted.length, 5);
                                        document.getElementById(`email-otp-${nextIdx}`)?.focus();
                                      }
                                    }}
                                    className="h-11 w-10 sm:h-12 sm:w-11 flex-1 min-w-0 max-w-[48px] rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] text-center text-lg font-black text-[#08093B] dark:text-[#F3F5FF] shadow-xs focus:border-[#663CF6] dark:focus:border-[#9D7CFE] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 transition-all"
                                  />
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {/* Verify Action */}
                                <Button
                                  type="button"
                                  variant="gradient"
                                  onClick={handleVerifyEmailOtp}
                                  disabled={isVerifyingEmailOtp || emailOtp.join("").length !== 6}
                                  className="w-full sm:w-auto justify-center rounded-[10px] px-5 py-2.5 text-xs font-bold shadow-xs flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[150px]"
                                >
                                  {isVerifyingEmailOtp ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-3.5 w-3.5" /> Verify Email OTP
                                    </>
                                  )}
                                </Button>

                                {/* Resend Action Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSendEmailOtp()}
                                  disabled={isSendingEmailOtp || emailResendTimer > 0}
                                  className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-white dark:bg-[#141731] px-3.5 py-2.5 text-xs font-semibold text-[#4D5072] dark:text-[#B4B9DA] hover:bg-[#F8F9FE] dark:hover:bg-[#1E2248] hover:border-[#B4BBE2] dark:hover:border-[#4B538F] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex-1 sm:flex-initial min-w-[130px]"
                                >
                                  {isSendingEmailOtp ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Sending code...</span>
                                    </>
                                  ) : emailResendTimer > 0 ? (
                                    <>
                                      <Clock className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Resend in {emailResendTimer}s</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#B59CFF]" />
                                      <span>Resend Code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Notifications / Errors */}
                            {emailOtpError && (
                              <p className="text-xs font-semibold text-red-600 dark:text-rose-400 flex items-center gap-1.5 break-words">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span>{emailOtpError}</span>
                              </p>
                            )}
                            {emailOtpSuccess && (
                              <p className="text-xs font-semibold text-green-600 dark:text-[#4ADE80] flex items-center gap-1.5 break-words">
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                <span>{emailOtpSuccess}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Overall Verification Status Banner */}
                      <div
                        className={`flex items-start gap-3 rounded-[14px] border p-4 ${
                          mobileVerified && emailVerified
                            ? "border-[#BBF7D0] dark:border-[#1B5742] bg-[#F0FDF4] dark:bg-[#0E261F] text-[#166534] dark:text-[#86EFAC]"
                            : "border-[#BAE6FD] dark:border-[#1E4670] bg-[#F0F8FF] dark:bg-[#11203B] text-[#0369A1] dark:text-[#56C2FF]"
                        }`}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]">
                          {mobileVerified && emailVerified ? (
                            <CheckCircle2 className="h-5 w-5 text-[#16A34A] dark:text-[#4ADE80]" />
                          ) : (
                            <Shield className="h-5 w-5 text-[#0284C7] dark:text-[#56C2FF]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">
                            {mobileVerified && emailVerified
                              ? "Identity verification complete!"
                              : "Dual-Verification Requirement"}
                          </h4>
                          <p className="mt-0.5 text-xs font-medium opacity-90">
                            {mobileVerified && emailVerified
                              ? "Both your mobile number and email address have been verified. You may now continue to select your plan."
                              : "To safeguard student and school records, both mobile (+91) and email verifications are mandatory before creating your school account."}
                          </p>
                        </div>
                      </div>

                      {/* Step 3 Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[#DFE3F5] dark:border-[#2C3159]">
                        <Button
                          id="continue-to-plan-btn"
                          type="button"
                          variant="gradient"
                          onClick={handleStep3Next}
                          disabled={!mobileVerified || !emailVerified}
                          className="w-full sm:w-auto order-1 sm:order-2 rounded-[12px] px-6 py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                        >
                          Next: Select Plan &rarr;
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => goToStep(2)}
                          className="w-full sm:w-auto order-2 sm:order-1 rounded-[12px] px-5 py-2.5 text-xs font-bold shadow-xs"
                        >
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: SELECT PLAN (Pricing Page) */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      {/* Header & Billing Toggle */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-2xl">
                              Select a Plan for Your School
                            </h2>
                            <button
                              type="button"
                              onClick={handleSkipPlan}
                              className="text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] hover:text-[#4F27E8] dark:hover:text-[#C4B5FD] hover:underline"
                            >
                              Skip later &rarr;
                            </button>
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA] sm:text-sm">
                            Choose the plan that best fits your school&apos;s size and needs.
                            You can upgrade anytime.
                          </p>
                        </div>

                        {/* Toggle Monthly / Yearly */}
                        <div className="inline-flex items-center self-start sm:self-auto rounded-full bg-[#F1F3F9] dark:bg-[#1B1F40] p-1 border border-[#DFE3F5] dark:border-[#2C3159]">
                          <button
                            type="button"
                            onClick={() => setBillingCycle("monthly")}
                            className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                              billingCycle === "monthly"
                                ? "bg-[#663CF6] text-white shadow-xs"
                                : "text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingCycle("yearly")}
                            className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
                              billingCycle === "yearly"
                                ? "bg-[#663CF6] text-white shadow-xs"
                                : "text-[#4D5072] dark:text-[#B4B9DA] hover:text-[#08093B] dark:hover:text-white"
                            }`}
                          >
                            <span>Yearly</span>
                            <span className="rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-2 py-0.5 text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                              Save up to 20%
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* 3 Pricing Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-4 items-stretch pt-2">
                        {PLANS.map((plan) => {
                          const isSelected = selectedPlan === plan.id;
                          return (
                            <div
                              key={plan.id}
                              onClick={() => setSelectedPlan(plan.id)}
                              className={`relative rounded-[20px] bg-white dark:bg-[#141731] p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "border-[3.5px] border-[#663CF6] dark:border-[#8B5CF6] shadow-[0_16px_36px_rgba(102,60,246,0.16)] ring-4 ring-[#EDE7FF] dark:ring-[#663CF6]/35 scale-[1.01]"
                                  : "border border-[#E6E8F5] dark:border-[#2A2F56] shadow-xs hover:border-[#8B5CF6]/50 dark:hover:border-[#A78BFA]/70"
                              }`}
                            >
                              {/* Popular badge */}
                              {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#663CF6] px-3 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shadow-sm">
                                  <Crown className="h-3 w-3" /> Most Popular
                                </div>
                              )}

                              <div>
                                {/* Icon */}
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${plan.iconBg}`}
                                >
                                  {plan.id === "enterprise" ? (
                                    <Building2 className="h-5 w-5" />
                                  ) : (
                                    <GraduationCap className="h-5 w-5" />
                                  )}
                                </div>

                                {/* Plan Title & Tagline */}
                                <h3 className="mt-3 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                                  {plan.name}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-[#666987] dark:text-[#AEB4D8] min-h-[32px]">
                                  {plan.tagline}
                                </p>

                                {/* Price */}
                                <div className="mt-3 flex items-baseline">
                                  <span
                                    className={`text-2xl font-black ${
                                      plan.popular ? "text-[#4F27E8] dark:text-[#C4B5FD]" : "text-[#08093B] dark:text-[#F3F5FF]"
                                    }`}
                                  >
                                    {billingCycle === "yearly"
                                      ? plan.yearlyPrice
                                      : plan.monthlyPrice}
                                  </span>
                                  <span className="ml-1 text-xs font-normal text-[#666987] dark:text-[#AEB4D8]">
                                    /month
                                  </span>
                                </div>

                                {/* Features Checklist */}
                                <div className="mt-5 space-y-2.5 text-xs text-[#202044] dark:text-[#F3F5FF]">
                                  {plan.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                                      <span className="leading-snug">{feat}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Select Button */}
                              <div className="pt-6">
                                {isSelected ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 flex items-center justify-center gap-1.5 transition-all"
                                  >
                                    <Check className="h-4 w-4" /> Selected
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className="w-full rounded-xl border border-[#8B5CF6] dark:border-[#9D7CFE] bg-white dark:bg-[#141731] py-2.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD] hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] transition-colors"
                                  >
                                    Select Plan
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Not sure which plan to choose? Callout */}
                      <div className="rounded-[14px] border border-[#DCEAF8] dark:border-[#1E3B60] bg-[#F4F8FD] dark:bg-[#171B38] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Info className="h-4 w-4 shrink-0 text-[#2563EB] dark:text-[#60A5FA] mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Not sure which plan to choose?{" "}
                            </span>
                            <span className="text-xs text-[#4D5072] dark:text-[#B4B9DA]">
                              You can start with the Starter plan and upgrade later, or
                              contact our team for a recommendation.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => alert("Our sales team will contact you shortly!")}
                          className="flex items-center gap-1.5 rounded-lg border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] px-3.5 py-1.5 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] shadow-xs hover:bg-slate-50 dark:hover:bg-[#1D2145] shrink-0 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#B59CFF]" />
                          <span>Talk to Sales</span>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[#DFE3F5] dark:border-[#2C3159]">
                        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                          <Button
                            id="skip-plan-btn"
                            type="button"
                            variant="secondary"
                            onClick={handleSkipPlan}
                            className="w-full sm:w-auto rounded-[12px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] px-5 py-2.5 text-xs font-bold text-[#4D5072] dark:text-[#B4B9DA] hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] hover:text-[#663CF6] dark:hover:text-[#C4B5FD] shadow-xs transition-colors"
                          >
                            Skip for Now
                          </Button>

                          <Button
                            id="continue-to-review-step4-btn"
                            type="button"
                            variant="gradient"
                            onClick={() => {
                              setIsPlanSkipped(false);
                              goToStep(5);
                            }}
                            className="w-full sm:w-auto rounded-[12px] px-7 py-2.5 text-xs font-bold shadow-md"
                          >
                            Continue to Review &rarr;
                          </Button>
                        </div>

                        <Button
                          id="back-to-step3-btn"
                          type="button"
                          variant="secondary"
                          onClick={() => goToStep(3)}
                          className="w-full sm:w-auto order-2 sm:order-1 rounded-[12px] px-5 py-2.5 text-xs font-bold shadow-xs"
                        >
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: REVIEW & CREATE (Screenshot View) */}
                  {currentStep === 5 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                          Review & Create
                        </h2>
                        <p className="mt-1 text-xs font-medium text-[#4D5072] dark:text-[#B4B9DA]">
                          Please review your information below before creating your school
                          account.
                        </p>
                      </div>

                      {/* Section 1: Institution Details */}
                      <div className="rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#F0F2FA] dark:border-[#23284A] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Institution Details
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => goToStep(1)}
                            className="flex items-center gap-1 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                          {/* Left Column */}
                          <div className="md:col-span-7 space-y-2 text-[#4D5072] dark:text-[#B4B9DA]">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
                              <span>School / Institution Name</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {institution.name}
                              </strong>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
                              <span>School Type / Category</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {institution.category}
                              </strong>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
                              <span>Board / Affiliation</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {institution.affiliationBoard}
                              </strong>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
                              <span>Contact Phone (School)</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {institution.contactPhone}
                              </strong>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-2">
                              <span>Website</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold truncate max-w-[200px]">
                                {institution.website || "Not provided"}
                              </strong>
                            </div>
                          </div>

                          {/* Right Column: Address, Country, Logo */}
                          <div className="md:col-span-5 space-y-2 text-[#4D5072] dark:text-[#B4B9DA]">
                            <div>
                              <span>Address</span>
                              <p className="mt-0.5 text-xs font-bold text-[#08093B] dark:text-[#F3F5FF] leading-relaxed">
                                {institution.addressLine}, {institution.locality},{" "}
                                {institution.city}, {institution.state} –{" "}
                                {institution.pinCode}, {institution.country}
                              </p>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span>Country</span>
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {institution.country}
                              </strong>
                            </div>
                            <div className="pt-1 flex items-center justify-between">
                              <span>School Logo</span>
                              <div className="flex h-16 w-20 flex-col items-center justify-center rounded-[10px] border border-[#CAD0EB] dark:border-[#343A68] bg-[#F7F9FE] dark:bg-[#171B38] p-1 text-center shadow-xs">
                                {institution.logoUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={institution.logoUrl}
                                    alt="Logo"
                                    className="h-10 w-10 object-contain"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF3FF] dark:bg-[#142542] text-[#1683E8] dark:text-[#56C2FF]">
                                      <GraduationCap className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="mt-0.5 text-[7px] font-black uppercase tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
                                      {institution.name ? institution.name.slice(0, 10).toUpperCase() : "SCHOLONIX"}
                                    </span>
                                    <span className="text-[5px] font-bold text-[#666987] dark:text-[#AEB4D8]">
                                      {institution.category || "INSTITUTION"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Administrator Details */}
                      <div className="rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#F0F2FA] dark:border-[#23284A] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                              <User className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Administrator Details
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => goToStep(2)}
                            className="flex items-center gap-1 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[#4D5072] dark:text-[#B4B9DA]">
                              Administrator Full Name
                            </span>
                            <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                              {admin.adminName}
                            </strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#4D5072] dark:text-[#B4B9DA]">Mobile Number</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                                {admin.adminPhone}
                              </strong>
                              {mobileVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-2 py-0.5 text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                                  <Check className="h-3 w-3" /> Verified
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => goToStep(3)}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] dark:bg-[#331624] px-2 py-0.5 text-[10px] font-bold text-[#DC2626] dark:text-[#FB7185] hover:bg-[#FECACA] dark:hover:bg-rose-900/50"
                                >
                                  <X className="h-3 w-3" /> Verify now
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#4D5072] dark:text-[#B4B9DA]">Designation / Role</span>
                            <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold">
                              {admin.designation}
                            </strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#4D5072] dark:text-[#B4B9DA]">Email Address</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-[#08093B] dark:text-[#F3F5FF] font-bold truncate max-w-[150px]">
                                {admin.adminEmail || "Not provided"}
                              </strong>
                              {emailVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-2 py-0.5 text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80]">
                                  <Check className="h-3 w-3" /> Verified
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => goToStep(3)}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] dark:bg-[#331624] px-2 py-0.5 text-[10px] font-bold text-[#DC2626] dark:text-[#FB7185] hover:bg-[#FECACA] dark:hover:bg-rose-900/50"
                                >
                                  <X className="h-3 w-3" /> Verify now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Selected Plan */}
                      <div className="rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-[#F0F2FA] dark:border-[#23284A] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                              <Crown className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                              Selected Plan
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => goToStep(4)}
                            className="flex items-center gap-1 text-xs font-bold text-[#663CF6] dark:text-[#B59CFF] hover:underline"
                          >
                            <Pencil className="h-3 w-3" /> {isPlanSkipped ? "Choose Plan" : "Edit"}
                          </button>
                        </div>

                        {isPlanSkipped ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-[#F8F7FE] dark:bg-[#171B38] p-3.5 text-xs gap-2">
                            <div>
                              <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] text-sm">
                                14-Day Free Trial
                              </span>
                              <span className="ml-2.5 text-[10px] font-bold text-[#663CF6] dark:text-[#B59CFF] bg-[#EDE7FF] dark:bg-[#251D4A] px-2 py-0.5 rounded-full">
                                Plan Selection Skipped
                              </span>
                              <p className="mt-1 text-[11px] text-[#4D5072] dark:text-[#B4B9DA]">
                                You can choose a paid plan later anytime from your school settings.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => goToStep(4)}
                              className="rounded-lg border border-[#8B5CF6] dark:border-[#9D7CFE] text-[#663CF6] dark:text-[#B59CFF] text-xs font-bold hover:bg-[#F2EEFD] dark:hover:bg-[#261E52] shrink-0"
                            >
                              Select Plan Now
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between rounded-xl bg-[#F8F7FE] dark:bg-[#171B38] p-3.5 text-xs">
                            <div>
                              <span className="font-extrabold text-[#08093B] dark:text-[#F3F5FF] capitalize text-sm">
                                {selectedPlan} Plan
                              </span>
                              <span className="ml-2.5 text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#0F2C24] px-2 py-0.5 rounded-full">
                                {billingCycle === "yearly" ? "Billed Annually (20% off)" : "Billed Monthly"}
                              </span>
                            </div>
                            <span className="text-sm font-black text-[#4F27E8] dark:text-[#C4B5FD]">
                              {selectedPlan === "starter"
                                ? billingCycle === "yearly" ? "₹1,599/mo" : "₹1,999/mo"
                                : selectedPlan === "enterprise"
                                  ? billingCycle === "yearly" ? "₹6,399/mo" : "₹7,999/mo"
                                  : billingCycle === "yearly" ? "₹3,199/mo" : "₹3,999/mo"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Verification Status */}
                      <div className="flex items-center justify-between flex-wrap gap-2 rounded-[14px] border border-[#D4C4FE] dark:border-[#42357D] bg-[#F8F6FE] dark:bg-[#191C3B] px-4 py-3 text-xs">
                        <span className="flex items-center gap-2 font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          <Shield className="h-4 w-4 text-[#663CF6] dark:text-[#B59CFF]" />
                          Verification Status
                        </span>
                        <div className="flex items-center flex-wrap gap-2">
                          {mobileVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-3 py-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                              <Check className="h-3.5 w-3.5" /> Mobile Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => goToStep(3)}
                              className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] dark:bg-[#331624] px-3 py-1 text-xs font-bold text-[#DC2626] dark:text-[#FB7185] hover:bg-[#FECACA] dark:hover:bg-rose-900/50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" /> Mobile Required &mdash; Verify
                            </button>
                          )}
                          {emailVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] dark:bg-[#0F2C24] px-3 py-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                              <Check className="h-3.5 w-3.5" /> Email Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => goToStep(3)}
                              className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] dark:bg-[#331624] px-3 py-1 text-xs font-bold text-[#DC2626] dark:text-[#FB7185] hover:bg-[#FECACA] dark:hover:bg-rose-900/50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" /> Email Required &mdash; Verify
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Section 4: Terms and Consent */}
                      <div className="rounded-[16px] border border-[#D9DDF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-[#F0F2FA] dark:border-[#23284A]">
                          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                            <FileText className="h-4 w-4" />
                          </div>
                          <h3 className="text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                            Terms and Consent
                          </h3>
                        </div>

                        <div className="space-y-2 pt-1 text-xs text-[#4D5072] dark:text-[#B4B9DA]">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={agreeTerms}
                              onChange={(e) => setAgreeTerms(e.target.checked)}
                              className="mt-0.5 rounded border-[#CAD0EB] dark:border-[#343A68] text-[#663CF6] dark:text-[#B59CFF] focus:ring-[#663CF6]/30 accent-[#663CF6]"
                            />
                            <span>
                              I agree to the{" "}
                              <a
                                href="#terms"
                                className="font-bold text-[#663CF6] dark:text-[#B59CFF] underline"
                              >
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a
                                href="#privacy"
                                className="font-bold text-[#663CF6] dark:text-[#B59CFF] underline"
                              >
                                Privacy Policy
                              </a>
                              . <span className="text-red-500 dark:text-rose-400 font-bold">*</span>
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={receiveUpdates}
                              onChange={(e) => setReceiveUpdates(e.target.checked)}
                              className="mt-0.5 rounded border-[#CAD0EB] dark:border-[#343A68] text-[#663CF6] dark:text-[#B59CFF] focus:ring-[#663CF6]/30 accent-[#663CF6]"
                            />
                            <span>
                              I&apos;d like to receive product updates and helpful
                              resources (optional).
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Step 4 Actions */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-[#DFE3F5] dark:border-[#2C3159]">
                        <Button
                          id="final-create-school-btn"
                          type="button"
                          variant="gradient"
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto order-1 sm:order-2 rounded-[12px] px-7 py-2.5 text-xs font-bold shadow-md"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating School Workspace...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Create School
                              Account
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => goToStep(4)}
                          className="w-full sm:w-auto order-2 sm:order-1 rounded-[12px] px-5 py-2.5 text-xs font-bold shadow-xs"
                        >
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                        </Button>
                      </div>
                    </div>
                  )}
            </div>

            {/* Value Proposition: Placed at the bottom of the Registration Form on mobile to avoid distracting users (Only on Steps 1, 2, 3) */}
            {currentStep < 4 && (
              <div className="block lg:hidden rounded-[16px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.06)]">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        Your own secure school workspace
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                        Manage students, staff, academics, fees and more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        Multi-user access for your team
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                        Admin, teachers and other staff with role-based access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF] ring-1 ring-[#D4C4FE] dark:ring-[#42357D] shadow-xs">
                      <Zap className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                        Quick and easy setup
                      </h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                        Get started in minutes and configure your school in the onboarding
                        wizard
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: REGISTRATION PROGRESS & CONTEXT (Only on Steps 1, 2, 3) */}
          {currentStep < 4 && (
            <div className="space-y-5 lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
              {/* Card 1: What Happens Next? */}
              <div className="rounded-[16px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-5 shadow-[0_8px_24px_rgba(24,18,77,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EDE7FF] dark:bg-[#251D4A] text-[#663CF6] dark:text-[#B59CFF]">
                    <Flag className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    What Happens Next?
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  {NEXT_STEPS.map((item) => {
                    const isCompleted = item.step < currentStep;
                    const isCurrent = item.step === currentStep;

                    return (
                      <div key={item.step} className="flex items-start gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            isCompleted
                              ? "bg-[#663CF6] text-white shadow-xs"
                              : isCurrent
                                ? "bg-[#663CF6] text-white ring-2 ring-[#EDE7FF] dark:ring-[#663CF6]/35 shadow-xs"
                                : "bg-[#ECEEF7] dark:bg-[#232748] text-[#4D5072] dark:text-[#B4B9DA]"
                          }`}
                        >
                          {isCompleted ? <Check className="h-3.5 w-3.5" /> : item.step}
                        </span>
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              isCurrent || isCompleted ? "text-[#08093B] dark:text-[#F3F5FF]" : "text-[#4D5072] dark:text-[#B4B9DA]"
                            }`}
                          >
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Your data is secure */}
              <div className="rounded-[16px] border border-[#D6DBF0] dark:border-[#2C3159] bg-white dark:bg-[#141731] p-4 shadow-[0_8px_24px_rgba(24,18,77,0.08)]">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#15803D] dark:text-[#4ADE80]" />
                  <div>
                    <h4 className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                      Your data is secure
                    </h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#4D5072] dark:text-[#B4B9DA]">
                      We keep your information safe and use it only to set up and operate
                      your school&apos;s workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. PAGE FOOTER */}
      <footer className="border-t border-[#D6DBF0]/70 dark:border-[#2C3159]/80 bg-white/70 dark:bg-[#1A1E3E]/80 py-6 mt-12 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs font-semibold text-[#666987] dark:text-[#AEB4D8] sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} ScholoNix. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] transition-colors">
              Pricing
            </Link>
            <Link href="/#for-schools" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] transition-colors">
              For Schools
            </Link>
            <Link href="/#contact" className="hover:text-[#663CF6] dark:hover:text-[#C4B5FD] transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* SUCCESS MODAL POPUP DIALOG                                    */}
      {/* ============================================================== */}
      {registrationSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#08093B]/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/80 dark:border-[#2C3159] bg-white dark:bg-[#141731] p-7 sm:p-9 shadow-[0_24px_60px_-15px_rgba(8,9,59,0.25)] text-center animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setRegistrationSuccess(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 sm:top-6 sm:right-6 flex h-8 w-8 items-center justify-center rounded-full text-[#666987] dark:text-[#AEB4D8] hover:bg-[#F1F2F7] dark:hover:bg-[#232748] hover:text-[#08093B] dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5 stroke-[2.2]" />
            </button>

            {/* Glowing Green Check Badge & Confetti */}
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center pt-1">
              {/* Confetti Particles SVG */}
              <svg
                className="pointer-events-none absolute -top-5 -left-9 h-34 w-42 sm:-top-6 sm:-left-11 sm:h-38 sm:w-46"
                viewBox="0 0 170 140"
                fill="none"
              >
                {/* Left side confetti */}
                <rect
                  x="28"
                  y="30"
                  width="5"
                  height="11"
                  rx="2.5"
                  fill="#8B5CF6"
                  transform="rotate(-35 28 30)"
                />
                <circle cx="20" cy="56" r="3" fill="#06B6D4" />
                <rect
                  x="36"
                  y="50"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#EC4899"
                  transform="rotate(20 36 50)"
                />
                <rect
                  x="22"
                  y="72"
                  width="8"
                  height="4"
                  rx="2"
                  fill="#F59E0B"
                  transform="rotate(-15 22 72)"
                />
                <circle cx="42" cy="86" r="2.5" fill="#8B5CF6" />

                {/* Right side confetti */}
                <rect
                  x="138"
                  y="26"
                  width="5"
                  height="11"
                  rx="2.5"
                  fill="#663CF6"
                  transform="rotate(35 138 26)"
                />
                <circle cx="150" cy="46" r="3" fill="#06B6D4" />
                <rect
                  x="128"
                  y="42"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill="#F59E0B"
                  transform="rotate(-20 128 42)"
                />
                <rect
                  x="140"
                  y="64"
                  width="8"
                  height="4"
                  rx="2"
                  fill="#EC4899"
                  transform="rotate(30 140 64)"
                />
                <circle cx="134" cy="84" r="2.5" fill="#8B5CF6" />
              </svg>

              {/* Outer halo */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5F9ED] dark:bg-[#0E261F] ring-8 ring-[#ECFDF3] dark:ring-[#164234]">
                {/* Inner green circle */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16B84E] shadow-[0_8px_20px_rgba(22,184,78,0.35)]">
                  <Check className="h-8 w-8 text-white stroke-[3.5]" />
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2
              id="success-modal-title"
              className="mt-5 text-center text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-[28px]"
            >
              School Account Created Successfully!
            </h2>

            {/* Subtitle */}
            <p className="mt-2 text-center text-sm font-medium leading-relaxed text-[#4D5072] dark:text-[#B4B9DA] sm:text-base">
              {registrationSuccess.schoolName || institution.name} has been registered on
              <br className="hidden sm:inline" /> ScholoNix.
            </p>

            {/* 3-Feature Card Container */}
            <div className="mt-7 rounded-2xl border border-[#EAE6FD] dark:border-[#372E66] bg-[#F7F6FE] dark:bg-[#191C3B] p-4 sm:p-5">
              <div className="grid grid-cols-3 divide-x divide-[#E5E0FA] dark:divide-[#2A2F56]">
                {/* Feature 1 */}
                <div className="flex flex-col items-center px-1 text-center sm:px-3">
                  <div className="flex h-10 w-10 items-center justify-center text-[#663CF6] dark:text-[#B59CFF]">
                    <Building2 className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="mt-1 block max-w-[110px] text-xs font-bold leading-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-[13px]">
                    School Account Created
                  </span>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-center px-1 text-center sm:px-3">
                  <div className="flex h-10 w-10 items-center justify-center text-[#663CF6] dark:text-[#B59CFF]">
                    <Rocket className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="mt-1 block max-w-[110px] text-xs font-bold leading-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-[13px]">
                    Onboarding Wizard Ready
                  </span>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-center px-1 text-center sm:px-3">
                  <div className="flex h-10 w-10 items-center justify-center text-[#663CF6] dark:text-[#B59CFF]">
                    <Monitor className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="mt-1 block max-w-[120px] text-xs font-bold leading-tight text-[#08093B] dark:text-[#F3F5FF] sm:text-[13px]">
                    Access Your School Web Panel
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button and Dashboard Link */}
            <div className="mt-7 flex flex-col items-center">
              <Link
                href={`/${registrationSuccess.slug || "workspace"}?onboarding=true` as Route}
                className="w-full max-w-sm"
              >
                <Button
                  id="start-onboarding-wizard-btn"
                  className="w-full rounded-xl bg-gradient-to-r from-[#663CF6] to-[#4F27E8] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(102,60,246,0.3)] transition-all hover:opacity-95 sm:text-base flex items-center justify-center gap-2"
                >
                  <span>Start Onboarding Wizard</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </Link>

              <Link
                href={`/${registrationSuccess.slug || "workspace"}` as Route}
                className="mt-3.5 text-sm font-bold text-[#4F27E8] dark:text-[#C4B5FD] underline hover:text-[#381AB5] dark:hover:text-[#D8B4FE] transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Bottom decorative wave */}
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-16 overflow-hidden rounded-b-[28px] opacity-40">
              <svg
                viewBox="0 0 500 80"
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <path
                  d="M0,40 C150,80 350,0 500,40 L500,80 L0,80 Z"
                  fill="url(#success-modal-wave)"
                />
                <defs>
                  <linearGradient
                    id="success-modal-wave"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#663CF6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
