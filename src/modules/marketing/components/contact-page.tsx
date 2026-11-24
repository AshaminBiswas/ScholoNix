"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Building2,
  User,
  ShieldCheck,
  Headphones,
  Calendar,
  AlertCircle,
  Loader2,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  HelpCircle,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";

interface ContactChannel {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  desc: string;
  primaryValue: string;
  secondaryValue?: string;
  actionText: string;
  actionHref: string;
  gradientBg: string;
  borderColor: string;
  hoverShadow: string;
  iconBg: string;
  iconColor: string;
  iconRing: string;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: Phone,
    title: "Direct Sales & Demo",
    badge: "Fast Response",
    badgeBg: "bg-[#EDE7FF]",
    badgeText: "text-[#663CF6]",
    desc: "Speak directly with an education tech consultant to tailor a solution for your institution.",
    primaryValue: "+91 98765 43210",
    secondaryValue: "sales@scholonix.com",
    actionText: "Call Sales Now",
    actionHref: "tel:+919876543210",
    gradientBg: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/90 to-[#EDE7FF]/75",
    borderColor: "border-[#DDD6FE]/80",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(102,60,246,0.14)]",
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
    iconRing: "ring-[#DDD6FE]",
  },
  {
    icon: Headphones,
    title: "Support & Helpdesk",
    badge: "24/7 Available",
    badgeBg: "bg-[#E0F2FE]",
    badgeText: "text-[#0284C7]",
    desc: "For existing schools, principals, and teachers needing assistance with daily operations.",
    primaryValue: "support@scholonix.com",
    secondaryValue: "+91 (800) 456-7890 (Toll Free)",
    actionText: "Email Support Team",
    actionHref: "mailto:support@scholonix.com",
    gradientBg: "bg-gradient-to-br from-white/98 via-[#F0F5FE]/95 to-[#EDE7FF]/85",
    borderColor: "border-[#BAE6FD]/80",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(2,132,199,0.14)]",
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
    iconRing: "ring-[#BAE6FD]",
  },
  {
    icon: Building2,
    title: "Headquarters & Visits",
    badge: "Campus Center",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#D97706]",
    desc: "Visit our innovation center or book an in-person workshop for your school management board.",
    primaryValue: "Tech Park, Outer Ring Road",
    secondaryValue: "Bengaluru, Karnataka 560103, India",
    actionText: "View on Map",
    actionHref: "https://maps.google.com",
    gradientBg: "bg-gradient-to-br from-white/95 via-[#FFFBEB]/90 to-[#FEF3C7]/75",
    borderColor: "border-[#FDE68A]/80",
    hoverShadow: "hover:shadow-[0_16px_32px_rgba(217,119,6,0.14)]",
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
    iconRing: "ring-[#FDE68A]",
  },
];

const CONTACT_FAQS = [
  {
    question: "How quickly does our school get onboarded?",
    answer:
      "Most schools are fully configured and ready for live operations within 48 to 72 hours. Our dedicated onboarding specialist assists with bulk teacher and student data imports, fee schedule setup, and staff orientation.",
  },
  {
    question: "Can we schedule an online walkthrough for our management board?",
    answer:
      "Absolutely. Our team provides interactive video demonstrations tailored to your school board (CBSE, ICSE, IB, State Board) and addresses specific questions from your principal, trustees, and administrative coordinators.",
  },
  {
    question: "Is data migration from our existing software included?",
    answer:
      "Yes! We provide complete CSV and Excel migration tools along with complimentary data validation support to ensure historical student records, attendance, and fee ledgers transfer securely without data loss.",
  },
  {
    question: "Do you offer emergency technical assistance on examination days?",
    answer:
      "Yes, we assign priority support channels and standby hotline access during scheduled examination periods, report card generation windows, and admission peak seasons.",
  },
];

export function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "",
    role: "Principal / Administrator",
    subject: "Request a Product Demonstration",
    message: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [serverError, setServerError] = useState("");

  // Newsletter state
  const [footerEmail, setFooterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    if (serverError) setServerError("");
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Please enter your full name (minimum 2 characters)";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid work or school email address";
    }
    if (!formData.subject.trim()) {
      errors.subject = "Please select or enter an inquiry topic";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters long";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          const mappedErrors: Record<string, string> = {};
          for (const key in data.errors) {
            mappedErrors[key] = data.errors[key][0];
          }
          setFormErrors(mappedErrors);
        }
        setServerError(data.message || "Failed to submit. Please try again.");
      } else {
        setSubmitSuccess(true);
        setReferenceId(data.referenceId || `CNTC-${Date.now().toString().slice(-6)}`);
      }
    } catch {
      setServerError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      schoolName: "",
      role: "Principal / Administrator",
      subject: "Request a Product Demonstration",
      message: "",
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setReferenceId("");
  };

  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setFooterEmail("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      {/* Background Ambience */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <BrandLogo className="h-8 sm:h-9" />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4D5072] md:flex">
            <Link href="/features" className="transition-colors hover:text-[#663CF6]">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-[#663CF6]">
              Pricing
            </Link>
            <Link href="/for-schools" className="transition-colors hover:text-[#663CF6]">
              For Schools
            </Link>
            <ResourcesDropdown />
            {/* Active Contact Pill */}
            <Link
              href="/contact"
              className="rounded-full bg-[#8B5CF6] px-4 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED]"
            >
              Contact
            </Link>
            <Link href="/feedback" className="transition-colors hover:text-[#663CF6]">
              Feedback
            </Link>
          </nav>

          {/* Action CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4F27E8] shadow-xs transition hover:border-[#4F27E8] hover:bg-[#F7F4FF]"
            >
              Sign In
            </Link>
            <Link
              href="/register?step=1"
              className="hidden sm:inline-flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-[#6D28D9] hover:to-[#3730A3]"
            >
              Get Started Free
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D6DBF0] bg-white text-[#08093B] shadow-sm transition hover:bg-[#F2EEFD] hover:text-[#663CF6] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D6DBF0] bg-white/98 px-4 pt-3 pb-6 shadow-xl backdrop-blur-lg md:hidden">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#1B1D45]">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                Pricing
              </Link>
              <Link
                href="/for-schools"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                For Schools
              </Link>

              {/* Mobile Resources Menu */}
              <div className="rounded-[10px] bg-[#FAF8FE] p-2">
                <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
              </div>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] bg-[#EDE7FF] px-3 py-2 font-bold text-[#663CF6]"
              >
                Contact Us
              </Link>
              <Link
                href="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2 transition hover:bg-[#F2EEFD] hover:text-[#663CF6]"
              >
                Share Feedback
              </Link>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-[12px] border border-[#7C3AED] bg-white text-sm font-bold text-[#4F27E8]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register?step=1"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] to-[#4F27E8] text-sm font-bold text-white shadow-md"
                >
                  Get Started Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          ========================================================================= */}
      <section className="relative px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-gradient-to-r from-[#EDE7FF] via-[#F6F2FF] to-[#EDE7FF] px-3.5 py-1.5 shadow-xs transition-all duration-300 hover:scale-105">
            <Sparkles className="h-4 w-4 text-[#663CF6]" />
            <span className="text-xs font-bold text-[#4F27E8]">
              We&apos;re Here to Help Your School Thrive
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl md:text-5xl lg:text-[2.75rem] leading-tight">
            Get in Touch with Our{" "}
            <span className="bg-gradient-to-r from-[#663CF6] via-[#7C3AED] to-[#4F27E8] bg-clip-text text-transparent">
              School Solutions Team
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm leading-relaxed text-[#4D5072] sm:text-base md:text-lg max-w-2xl mx-auto font-medium">
            Have questions about custom workflows, pricing plans, or want to schedule a live
            tailored demo for your leadership team? Send us a message or call us anytime.
          </p>
        </div>
      </section>

      {/* =========================================================================
          3. DIRECT CONTACT CARDS
          ========================================================================= */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
            {CONTACT_CHANNELS.map((channel, idx) => {
              const Icon = channel.icon;
              return (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-[20px] border ${channel.borderColor} ${channel.gradientBg} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 ${channel.hoverShadow}`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${channel.iconBg} ${channel.iconColor} ring-1 ${channel.iconRing} transition-transform duration-300 group-hover:scale-110 shadow-xs`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${channel.badgeBg} ${channel.badgeText}`}
                    >
                      {channel.badge}
                    </span>
                  </div>

                  {/* Body Content */}
                  <h3 className="mt-4 text-lg font-bold text-[#08093B] group-hover:text-[#663CF6] transition-colors">
                    {channel.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#4D5072] leading-relaxed font-medium">
                    {channel.desc}
                  </p>

                  {/* Contact Values */}
                  <div className="mt-4 border-t border-[#DFE3F5]/80 pt-3.5 space-y-1">
                    <p className="text-sm font-bold text-[#08093B]">{channel.primaryValue}</p>
                    {channel.secondaryValue && (
                      <p className="text-xs text-[#5A5E7A] font-medium">{channel.secondaryValue}</p>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="mt-4 pt-1">
                    <a
                      href={channel.actionHref}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] transition-transform duration-200 group-hover:translate-x-1"
                    >
                      <span>{channel.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MAIN INTERACTIVE FORM + TRUST ADVISORY
          ========================================================================= */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Left: Contact Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-[24px] border border-[#D6DBF0] bg-white p-6 sm:p-8 md:p-10 shadow-[0_12px_36px_rgba(24,18,77,0.06)] transition-all">
                {/* Subtle top brand glow accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#663CF6] via-[#8B5CF6] to-[#0284C7]" />

                {submitSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D] ring-8 ring-[#DCFCE7]/40 animate-bounce">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#08093B]">Message Received!</h3>
                    <p className="mx-auto max-w-md text-sm text-[#4D5072] leading-relaxed">
                      Thank you for contacting us, <strong>{formData.name}</strong>. Your inquiry has
                      been dispatched to our institutional coordinator.
                    </p>
                    <div className="inline-block rounded-[12px] border border-[#DDD6FE] bg-[#F6F2FF] px-4 py-2 text-xs font-mono font-bold text-[#663CF6]">
                      Reference ID: {referenceId}
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="inline-flex items-center gap-2 rounded-[12px] border border-[#CAD0EB] bg-white px-5 py-2.5 text-xs font-bold text-[#4F27E8] shadow-xs transition hover:bg-[#F2EEFD]"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#08093B]">
                        Send Us an Inquiry
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#4D5072] font-medium">
                        Fill in the details below. Our education advisers typically reply in less
                        than 2 business hours.
                      </p>
                    </div>

                    {serverError && (
                      <div className="mb-5 flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                        <span>{serverError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                      {/* Name & Email Row */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="e.g. Dr. Rajesh Sharma"
                              required
                              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all placeholder:text-[#76799C] focus:outline-none focus:ring-2 ${
                                formErrors.name
                                  ? "border-red-400 bg-red-50/30 focus:ring-red-400/30"
                                  : "border-[#CAD0EB] bg-white hover:border-[#9B76FF] focus:border-[#663CF6] focus:ring-[#663CF6]/20"
                              }`}
                            />
                            <User className="absolute right-3 top-3 h-4 w-4 text-[#76799C] pointer-events-none" />
                          </div>
                          {formErrors.name && (
                            <p className="mt-1 text-[11px] font-semibold text-red-600">
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            School / Work Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="principal@modernschool.edu"
                              required
                              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all placeholder:text-[#76799C] focus:outline-none focus:ring-2 ${
                                formErrors.email
                                  ? "border-red-400 bg-red-50/30 focus:ring-red-400/30"
                                  : "border-[#CAD0EB] bg-white hover:border-[#9B76FF] focus:border-[#663CF6] focus:ring-[#663CF6]/20"
                              }`}
                            />
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-[#76799C] pointer-events-none" />
                          </div>
                          {formErrors.email && (
                            <p className="mt-1 text-[11px] font-semibold text-red-600">
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Phone & School Name Row */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            Phone Number
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+91 98765 00000"
                              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all placeholder:text-[#76799C] hover:border-[#9B76FF] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                            />
                            <Phone className="absolute right-3 top-3 h-4 w-4 text-[#76799C] pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="schoolName"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            School / Institution Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="schoolName"
                              name="schoolName"
                              value={formData.schoolName}
                              onChange={handleInputChange}
                              placeholder="e.g. St. Xavier's International"
                              className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all placeholder:text-[#76799C] hover:border-[#9B76FF] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                            />
                            <Building2 className="absolute right-3 top-3 h-4 w-4 text-[#76799C] pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Role & Subject Row */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="role"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            Your Role at the School
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all hover:border-[#9B76FF] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 cursor-pointer"
                          >
                            <option>Principal / Head of School</option>
                            <option>School Trustee / Board Member</option>
                            <option>Administrative / IT Director</option>
                            <option>Senior Teacher / Coordinator</option>
                            <option>Accountant / Finance Manager</option>
                            <option>Other Educational Stakeholder</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="subject"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B] mb-1.5"
                          >
                            Primary Interest <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all hover:border-[#9B76FF] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 cursor-pointer"
                          >
                            <option>Request a Product Demonstration</option>
                            <option>Pricing & Multi-Branch Licensing</option>
                            <option>Data Migration from Old ERP</option>
                            <option>Fee Collection & Payment Gateway</option>
                            <option>General Support or Question</option>
                          </select>
                        </div>
                      </div>

                      {/* Message Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="message"
                            className="block text-xs font-bold uppercase tracking-wider text-[#08093B]"
                          >
                            How can we help your school? <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[11px] text-[#76799C]">
                            {formData.message.length}/2000
                          </span>
                        </div>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          value={formData.message}
                          onChange={handleInputChange}
                          maxLength={2000}
                          placeholder="Tell us about your student strength, current pain points, or specific questions..."
                          required
                          className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs sm:text-sm text-[#1B1D45] transition-all placeholder:text-[#76799C] focus:outline-none focus:ring-2 ${
                            formErrors.message
                              ? "border-red-400 bg-red-50/30 focus:ring-red-400/30"
                              : "border-[#CAD0EB] bg-white hover:border-[#9B76FF] focus:border-[#663CF6] focus:ring-[#663CF6]/20"
                          }`}
                        />
                        {formErrors.message && (
                          <p className="mt-1 text-[11px] font-semibold text-red-600">
                            {formErrors.message}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 hover:from-[#6D28D9] hover:to-[#3730A3] hover:shadow-lg disabled:opacity-70 active:scale-[0.99] cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Sending Inquiry...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Inquiry</span>
                              <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </>
                          )}
                        </button>
                        <p className="mt-2 text-center text-[11px] text-[#76799C]">
                          🔒 We respect institutional confidentiality. Your details will never be
                          shared with third parties.
                        </p>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Why Schools Trust ScholoNix & Next Steps (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              {/* Guarantee / SLA Card */}
              <div className="rounded-[22px] border border-[#DDD6FE] bg-gradient-to-br from-[#EDE7FF]/60 via-white to-[#F6F2FF]/80 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#663CF6] text-white shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#08093B]">
                      Our Commitment to Your School
                    </h3>
                    <p className="text-xs text-[#5A5E7A]">What happens once you reach out</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6]">
                      1
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Immediate Acknowledgment</h4>
                      <p className="text-xs text-[#4D5072] leading-relaxed">
                        You receive a dedicated ticket reference and our team reviews your school
                        profile within 2 hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6]">
                      2
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Personalized Demonstration</h4>
                      <p className="text-xs text-[#4D5072] leading-relaxed">
                        A focused session covering only the workflows you need—exams, fees, or
                        parent engagement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6]">
                      3
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B]">Zero-Obligation Trial</h4>
                      <p className="text-xs text-[#4D5072] leading-relaxed">
                        Full sandbox environment with sample data ready so your teachers can test
                        real ease-of-use.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Principal Quote / Testimonial Card */}
              <div className="rounded-[22px] border border-[#D6DBF0] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {"★".repeat(5)}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#1B1D45] italic font-medium">
                  &ldquo;Transitioning 2,200 students to ScholoNix was seamless. The support team
                  set up our fee structures and ran training for all 80 teachers in just two days.
                  Our administrative overhead dropped by nearly 60%.&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 border-t border-[#DFE3F5] pt-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE7FF] text-xs font-bold text-[#663CF6]">
                    SM
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#08093B]">Sister Mary Thomas</h5>
                    <p className="text-[11px] text-[#76799C]">
                      Principal, St. Joseph Academy
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp / Quick Demo CTA */}
              <div className="rounded-[22px] border border-[#BAE6FD] bg-gradient-to-r from-[#F0F5FE] to-[#EDE7FF]/60 p-5 text-center">
                <p className="text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                  Need an urgent answer?
                </p>
                <h4 className="mt-1 text-sm font-extrabold text-[#08093B]">
                  Chat directly with our Technical Lead
                </h4>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#10B981] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#059669]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Start WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. QUICK FAQS ACCORDION
          ========================================================================= */}
      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <span className="rounded-full bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6]">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#08093B] sm:text-3xl">
              Common Questions Before Contacting Us
            </h2>
          </div>

          <div className="space-y-3">
            {CONTACT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[16px] border border-[#D6DBF0] bg-white transition-all duration-200 overflow-hidden shadow-xs hover:border-[#9B76FF]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-[#08093B] transition hover:text-[#663CF6]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#663CF6] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#DFE3F5]/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 text-xs text-[#4D5072] leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOOTER
          ========================================================================= */}
      <footer
        id="support"
        className="border-t border-[#D6DBF0] bg-[#FAFBFF] pt-12 pb-8 sm:pt-16 sm:pb-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 sm:gap-10">
            {/* Brand column */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs leading-relaxed text-[#4D5072] font-medium">
                A comprehensive, cloud-based school management platform to simplify and streamline
                your school operations.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2.5 pt-1 text-[#4D5072]">
                <a
                  href="#linkedin"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#youtube"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8CCFD] bg-[#F2EEFD] text-[#4F27E8] transition hover:bg-[#663CF6] hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Product
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="/features" className="hover:text-[#663CF6]">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#663CF6]">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/for-schools" className="hover:text-[#663CF6]">
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="#integrations" className="hover:text-[#663CF6]">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Resources
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="/blog" className="hover:text-[#663CF6]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-[#663CF6]">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="hover:text-[#663CF6]">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="hover:text-[#663CF6]">
                    Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Company
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-[#4D5072]">
                <li>
                  <Link href="#about" className="hover:text-[#663CF6]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#663CF6] text-[#663CF6] font-bold">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="hover:text-[#663CF6]">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="#privacy" className="hover:text-[#663CF6]">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated Column */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Stay Updated
              </h4>
              <p className="text-xs font-medium text-[#4D5072]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleFooterSubscribe} className="flex gap-1.5 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#1B1D45] shadow-xs placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                />
                <button
                  type="submit"
                  aria-label="Submit newsletter"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#663CF6] text-white shadow-sm transition hover:bg-[#4F27E8]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              {newsletterSubscribed && (
                <p className="text-[10px] font-bold text-[#15803D]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DFE3F5] pt-6 text-xs text-[#4D5072] sm:flex-row">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} ScholoNix. All rights reserved.
            </p>
            <div className="flex items-center gap-1 font-bold text-[#1B1D45]">
              <span className="text-red-500">❤️</span> Made for Schools
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
