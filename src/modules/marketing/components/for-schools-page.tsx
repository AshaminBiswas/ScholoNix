"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Calendar,
  Coins,
  UserCheck,
  MessageSquare,
  BarChart3,
  BookOpen,
  Cloud,
  Check,
  ArrowRight,
  Menu,
  X,
  Send,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  Star,
  Zap,
  ShieldCheck,
  Landmark,
  Globe,
  School,
  Quote,
  Sparkles,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Button } from "@/components/ui/button";
import { ResourcesDropdown, MobileResourcesMenu } from "./resources-dropdown";
import { BrandLogo } from "@/components/ui/brand-logo";

/* =========================================================================
   CUSTOM SCHOOL BUILDING SVG ILLUSTRATION
   Faithfully inspired by the user's design mockup
   ========================================================================= */
export function SchoolBuildingIllustration({
  className = "w-full max-w-lg mx-auto",
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 640 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl select-none"
        aria-label="Modern School Building Illustration"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="skyGlow" x1="320" y1="0" x2="320" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#EDE7FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="lawnHill" x1="320" y1="280" x2="320" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D1FAE5" />
            <stop offset="40%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>

          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="roofSideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="facadeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>

          <linearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          <linearGradient id="windowGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="50%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="treeGreen1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>

          <linearGradient id="treeGreen2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>

          <linearGradient id="flagGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Shadows */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Atmospheric Clouds in Background */}
        <ellipse cx="320" cy="200" rx="280" ry="160" fill="url(#skyGlow)" />
        <ellipse cx="140" cy="90" rx="70" ry="24" fill="url(#cloudGrad)" />
        <ellipse cx="180" cy="80" rx="50" ry="28" fill="url(#cloudGrad)" />
        <ellipse cx="480" cy="100" rx="80" ry="26" fill="url(#cloudGrad)" />
        <ellipse cx="520" cy="90" rx="50" ry="30" fill="url(#cloudGrad)" />

        {/* Soft Hill Lawn Pedestal */}
        <path
          d="M 20 380 Q 320 310 620 380 L 620 420 L 20 420 Z"
          fill="url(#lawnHill)"
        />
        {/* Subtle Path to Door */}
        <path
          d="M 285 360 L 355 360 L 380 415 L 260 415 Z"
          fill="#E2E8F0"
          opacity="0.75"
        />

        {/* Left Lush Trees */}
        <g filter="url(#softShadow)">
          {/* Back Tree Left */}
          <rect x="72" y="240" width="12" height="70" rx="6" fill="#78350F" />
          <circle cx="78" cy="225" r="38" fill="url(#treeGreen1)" />
          <circle cx="68" cy="210" r="26" fill="url(#treeGreen2)" opacity="0.9" />

          {/* Front Tree Left */}
          <rect x="108" y="255" width="14" height="65" rx="7" fill="#78350F" />
          <circle cx="115" cy="240" r="44" fill="url(#treeGreen2)" />
          <circle cx="100" cy="225" r="30" fill="#BBF7D0" opacity="0.8" />
        </g>

        {/* Right Lush Trees */}
        <g filter="url(#softShadow)">
          {/* Back Tree Right */}
          <rect x="548" y="240" width="12" height="70" rx="6" fill="#78350F" />
          <circle cx="554" cy="225" r="38" fill="url(#treeGreen1)" />
          <circle cx="564" cy="210" r="26" fill="url(#treeGreen2)" opacity="0.9" />

          {/* Front Tree Right */}
          <rect x="512" y="255" width="14" height="65" rx="7" fill="#78350F" />
          <circle cx="519" cy="240" r="44" fill="url(#treeGreen2)" />
          <circle cx="530" cy="225" r="30" fill="#BBF7D0" opacity="0.8" />
        </g>

        {/* MAIN SCHOOL BUILDING (Centered from x=160 to x=480, Width=320) */}
        <g filter="url(#softShadow)">
          {/* Building Base Shadow */}
          <rect x="165" y="348" width="310" height="14" rx="4" fill="#64748B" opacity="0.25" />

          {/* Left Wing Facade */}
          <rect x="175" y="195" width="105" height="155" rx="4" fill="url(#facadeGrad)" stroke="#CBD5E1" strokeWidth="2" />
          {/* Left Wing Roof */}
          <polygon points="160,198 285,198 275,155 170,155" fill="url(#roofSideGrad)" />
          {/* Left Wing Roof Trim */}
          <rect x="156" y="194" width="133" height="7" rx="2" fill="#1E40AF" />

          {/* Right Wing Facade */}
          <rect x="360" y="195" width="105" height="155" rx="4" fill="url(#facadeGrad)" stroke="#CBD5E1" strokeWidth="2" />
          {/* Right Wing Roof */}
          <polygon points="355,198 480,198 470,155 365,155" fill="url(#roofSideGrad)" />
          {/* Right Wing Roof Trim */}
          <rect x="351" y="194" width="133" height="7" rx="2" fill="#1E40AF" />

          {/* Center Main Pavilion (Slightly Forward & Taller) */}
          <rect x="255" y="145" width="130" height="205" rx="4" fill="url(#facadeGrad)" stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Center Triangular Pediment Roof */}
          <polygon points="245,147 395,147 320,85" fill="url(#roofGrad)" />
          <polygon points="252,144 388,144 320,89" fill="#1D4ED8" opacity="0.2" />
          <line x1="242" y1="147" x2="398" y2="147" stroke="#1E40AF" strokeWidth="6" strokeLinecap="round" />

          {/* Flagpole & Waving Flag on Central Roof Peak */}
          <line x1="320" y1="85" x2="320" y2="42" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="320" cy="40" r="3" fill="#F59E0B" />
          <path
            d="M 320 44 Q 345 36 360 48 Q 345 56 320 54 Z"
            fill="url(#flagGrad)"
          />

          {/* "SCHOOL" Header Plaque on Central Front */}
          <rect x="272" y="156" width="96" height="24" rx="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
          <text
            x="320"
            y="173"
            textAnchor="middle"
            fill="#1D4ED8"
            fontSize="13"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2"
          >
            SCHOOL
          </text>

          {/* Central Upper Windows (2 Square Windows) */}
          <g>
            {/* Window Left */}
            <rect x="280" y="194" width="32" height="34" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="296" y1="194" x2="296" y2="228" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="280" y1="211" x2="312" y2="211" stroke="#FFFFFF" strokeWidth="2" />

            {/* Window Right */}
            <rect x="328" y="194" width="32" height="34" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="344" y1="194" x2="344" y2="228" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="328" y1="211" x2="360" y2="211" stroke="#FFFFFF" strokeWidth="2" />
          </g>

          {/* Grand Front Entrance Portal */}
          <rect x="282" y="250" width="76" height="100" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          {/* Arch Canopy above Door */}
          <path d="M 288 280 Q 320 256 352 280 L 352 280 L 288 280 Z" fill="#2563EB" />
          {/* Double Arched Doors */}
          <rect x="292" y="280" width="26" height="70" rx="3" fill="url(#doorGrad)" />
          <rect x="322" y="280" width="26" height="70" rx="3" fill="url(#doorGrad)" />
          {/* Door Panels & Handles */}
          <rect x="296" y="286" width="18" height="26" rx="2" fill="#E0F2FE" opacity="0.4" />
          <rect x="326" y="286" width="18" height="26" rx="2" fill="#E0F2FE" opacity="0.4" />
          <rect x="296" y="318" width="18" height="26" rx="2" fill="#1D4ED8" opacity="0.2" />
          <rect x="326" y="318" width="18" height="26" rx="2" fill="#1D4ED8" opacity="0.2" />
          <circle cx="314" cy="315" r="2" fill="#F8FAFC" />
          <circle cx="326" cy="315" r="2" fill="#F8FAFC" />

          {/* Portico Entrance Steps */}
          <rect x="270" y="350" width="100" height="6" rx="2" fill="#E2E8F0" />
          <rect x="264" y="356" width="112" height="6" rx="2" fill="#CBD5E1" />

          {/* Left Wing Windows (4 Windows: 2 upper, 2 lower) */}
          <g>
            {/* Top Left 1 */}
            <rect x="190" y="215" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="204" y1="215" x2="204" y2="247" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="190" y1="231" x2="218" y2="231" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Top Left 2 */}
            <rect x="232" y="215" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="246" y1="215" x2="246" y2="247" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="232" y1="231" x2="260" y2="231" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Bottom Left 1 */}
            <rect x="190" y="275" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="204" y1="275" x2="204" y2="307" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="190" y1="291" x2="218" y2="291" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Bottom Left 2 */}
            <rect x="232" y="275" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="246" y1="275" x2="246" y2="307" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="232" y1="291" x2="260" y2="291" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>

          {/* Right Wing Windows (4 Windows: 2 upper, 2 lower) */}
          <g>
            {/* Top Right 1 */}
            <rect x="380" y="215" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="394" y1="215" x2="394" y2="247" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="380" y1="231" x2="408" y2="231" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Top Right 2 */}
            <rect x="422" y="215" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="436" y1="215" x2="436" y2="247" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="422" y1="231" x2="450" y2="231" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Bottom Right 1 */}
            <rect x="380" y="275" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="394" y1="275" x2="394" y2="307" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="380" y1="291" x2="408" y2="291" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Bottom Right 2 */}
            <rect x="422" y="275" width="28" height="32" rx="4" fill="url(#windowGlass)" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="436" y1="275" x2="436" y2="307" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="422" y1="291" x2="450" y2="291" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* =========================================================================
   FOR SCHOOLS DATA STRUCTURES
   ========================================================================= */

// 1. "Why for Schools?" 4 Value Cards
interface ValueCard {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
  topStripe: string;
  titleHover: string;
  blobColor: string;
}

const WHY_FOR_SCHOOLS: ValueCard[] = [
  {
    id: "streamline",
    title: "Streamline Operations",
    desc: "Manage admissions, academics, attendance, fees and more from one place.",
    icon: Zap,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
    iconRing: "ring-[#DDD6FE]",
    borderColor: "border-[#DDD6FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/90 to-[#EDE7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(102,60,246,0.06)]",
    hoverBorder: "hover:border-[#7C3AED]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(102,60,246,0.18)]",
    topStripe: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    titleHover: "group-hover:text-[#663CF6]",
    blobColor: "bg-[#8B5CF6]/15",
  },
  {
    id: "collaboration",
    title: "Improve Collaboration",
    desc: "Keep teachers, staff, students and parents connected seamlessly.",
    icon: Users,
    iconBg: "bg-[#E0E7FF]",
    iconColor: "text-[#4338CA]",
    iconRing: "ring-[#C7D2FE]",
    borderColor: "border-[#C7D2FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#EEF2FF]/90 to-[#E0E7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(67,56,202,0.06)]",
    hoverBorder: "hover:border-[#4338CA]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(67,56,202,0.18)]",
    topStripe: "from-[#4338CA] via-[#6366F1] to-[#A5B4FC]",
    titleHover: "group-hover:text-[#4338CA]",
    blobColor: "bg-[#4338CA]/15",
  },
  {
    id: "decisions",
    title: "Make Data-Driven Decisions",
    desc: "Get real-time reports and insights to track performance and growth.",
    icon: BarChart3,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
    iconRing: "ring-[#BAE6FD]",
    borderColor: "border-[#BAE6FD]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0F8FF]/90 to-[#E0F2FE]/80",
    shadow: "shadow-[0_8px_24px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(2,132,199,0.18)]",
    topStripe: "from-[#0284C7] via-[#38BDF8] to-[#7DD3FC]",
    titleHover: "group-hover:text-[#0284C7]",
    blobColor: "bg-[#0284C7]/15",
  },
  {
    id: "security",
    title: "Secure & Reliable",
    desc: "Cloud-based, secure and always available for your school team.",
    icon: ShieldCheck,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
    iconRing: "ring-[#BBF7D0]",
    borderColor: "border-[#BBF7D0]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDF4]/90 to-[#DCFCE7]/80",
    shadow: "shadow-[0_8px_24px_rgba(21,128,61,0.06)]",
    hoverBorder: "hover:border-[#15803D]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(21,128,61,0.18)]",
    topStripe: "from-[#15803D] via-[#22C55E] to-[#86EFAC]",
    titleHover: "group-hover:text-[#15803D]",
    blobColor: "bg-[#15803D]/15",
  },
];

// 2. "All Features" / Key Capabilities for Schools (8 Feature Cards with Seamless Gradients)
interface CapabilityCard {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconRing: string;
  href: string;
  borderColor: string;
  bgGradient: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
  topStripe: string;
  titleHover: string;
  blobColor: string;
}

const KEY_CAPABILITIES: CapabilityCard[] = [
  {
    id: "admissions",
    title: "Admissions",
    desc: "Manage enquiries, applications, document verification and student admissions online.",
    icon: Users,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
    iconRing: "ring-[#DDD6FE]",
    href: "/register?step=1&feature=admissions",
    borderColor: "border-[#DDD6FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F6F2FF]/90 to-[#EDE7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(102,60,246,0.06)]",
    hoverBorder: "hover:border-[#7C3AED]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(102,60,246,0.18)]",
    topStripe: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    titleHover: "group-hover:text-[#663CF6]",
    blobColor: "bg-[#8B5CF6]/15",
  },
  {
    id: "academics",
    title: "Academics",
    desc: "Set up classes, sections, subjects, timetables, syllabus and lesson plans.",
    icon: GraduationCap,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
    iconRing: "ring-[#BAE6FD]",
    href: "/register?step=1&feature=academics",
    borderColor: "border-[#BAE6FD]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0F8FF]/90 to-[#E0F2FE]/80",
    shadow: "shadow-[0_8px_24px_rgba(2,132,199,0.06)]",
    hoverBorder: "hover:border-[#0284C7]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(2,132,199,0.18)]",
    topStripe: "from-[#0284C7] via-[#38BDF8] to-[#7DD3FC]",
    titleHover: "group-hover:text-[#0284C7]",
    blobColor: "bg-[#0284C7]/15",
  },
  {
    id: "attendance",
    title: "Attendance",
    desc: "Track daily attendance for students and staff with real-time sync and reports.",
    icon: Calendar,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
    iconRing: "ring-[#BBF7D0]",
    href: "/register?step=1&feature=attendance",
    borderColor: "border-[#BBF7D0]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#F0FDF4]/90 to-[#DCFCE7]/80",
    shadow: "shadow-[0_8px_24px_rgba(21,128,61,0.06)]",
    hoverBorder: "hover:border-[#15803D]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(21,128,61,0.18)]",
    topStripe: "from-[#15803D] via-[#22C55E] to-[#86EFAC]",
    titleHover: "group-hover:text-[#15803D]",
    blobColor: "bg-[#15803D]/15",
  },
  {
    id: "fees",
    title: "Fees & Payments",
    desc: "Collect fees online, manage fee structures, track dues and generate receipts.",
    icon: Coins,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
    iconRing: "ring-[#FDE68A]",
    href: "/register?step=1&feature=fees",
    borderColor: "border-[#FDE68A]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFFBEB]/90 to-[#FEF3C7]/80",
    shadow: "shadow-[0_8px_24px_rgba(217,119,6,0.06)]",
    hoverBorder: "hover:border-[#D97706]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(217,119,6,0.18)]",
    topStripe: "from-[#D97706] via-[#F59E0B] to-[#FCD34D]",
    titleHover: "group-hover:text-[#D97706]",
    blobColor: "bg-[#D97706]/15",
  },
  {
    id: "staff",
    title: "Staff Management",
    desc: "Maintain staff profiles, roles, leaves, attendance and administrative duties.",
    icon: UserCheck,
    iconBg: "bg-[#FFE4E6]",
    iconColor: "text-[#E11D48]",
    iconRing: "ring-[#FECDD3]",
    href: "/register?step=1&feature=staff",
    borderColor: "border-[#FECDD3]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FFF1F2]/90 to-[#FFE4E6]/80",
    shadow: "shadow-[0_8px_24px_rgba(225,29,72,0.06)]",
    hoverBorder: "hover:border-[#E11D48]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(225,29,72,0.18)]",
    topStripe: "from-[#E11D48] via-[#F43F5E] to-[#FDA4AF]",
    titleHover: "group-hover:text-[#E11D48]",
    blobColor: "bg-[#E11D48]/15",
  },
  {
    id: "communication",
    title: "Parents & Communication",
    desc: "Send notices, circulars, automated alerts and real-time updates to parents.",
    icon: MessageSquare,
    iconBg: "bg-[#CFFAFE]",
    iconColor: "text-[#0891B2]",
    iconRing: "ring-[#A5F3FC]",
    href: "/register?step=1&feature=communication",
    borderColor: "border-[#A5F3FC]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#ECFEFF]/90 to-[#CFFAFE]/80",
    shadow: "shadow-[0_8px_24px_rgba(8,145,178,0.06)]",
    hoverBorder: "hover:border-[#0891B2]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(8,145,178,0.18)]",
    topStripe: "from-[#0891B2] via-[#06B6D4] to-[#67E8F9]",
    titleHover: "group-hover:text-[#0891B2]",
    blobColor: "bg-[#0891B2]/15",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    desc: "Get comprehensive reports on academics, attendance, fees and overall performance.",
    icon: BarChart3,
    iconBg: "bg-[#FAE8FF]",
    iconColor: "text-[#C026D3]",
    iconRing: "ring-[#F5D0FE]",
    href: "/register?step=1&feature=reports",
    borderColor: "border-[#F5D0FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#FDF4FF]/90 to-[#FAE8FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(192,38,211,0.06)]",
    hoverBorder: "hover:border-[#C026D3]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(192,38,211,0.18)]",
    topStripe: "from-[#C026D3] via-[#D946EF] to-[#F0ABFC]",
    titleHover: "group-hover:text-[#C026D3]",
    blobColor: "bg-[#C026D3]/15",
  },
  {
    id: "cloud",
    title: "Cloud & Security",
    desc: "Access your school data anytime, anywhere with enterprise 256-bit encryption.",
    icon: Cloud,
    iconBg: "bg-[#E0E7FF]",
    iconColor: "text-[#4338CA]",
    iconRing: "ring-[#C7D2FE]",
    href: "/register?step=1&feature=security",
    borderColor: "border-[#C7D2FE]/80",
    bgGradient: "bg-gradient-to-br from-white/95 via-[#EEF2FF]/90 to-[#E0E7FF]/80",
    shadow: "shadow-[0_8px_24px_rgba(67,56,202,0.06)]",
    hoverBorder: "hover:border-[#4338CA]",
    hoverShadow: "hover:shadow-[0_20px_36px_rgba(67,56,202,0.18)]",
    topStripe: "from-[#4338CA] via-[#6366F1] to-[#A5B4FC]",
    titleHover: "group-hover:text-[#4338CA]",
    blobColor: "bg-[#4338CA]/15",
  },
];

// 3. "For Every Type of School" 4 Categories
interface SchoolTypeItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const SCHOOL_TYPES: SchoolTypeItem[] = [
  {
    id: "k12",
    title: "K-12 Schools",
    icon: GraduationCap,
    iconBg: "bg-[#EDE7FF]",
    iconColor: "text-[#663CF6]",
  },
  {
    id: "cbse",
    title: "CBSE / ICSE Schools",
    icon: BookOpen,
    iconBg: "bg-[#FCE7F3]",
    iconColor: "text-[#DB2777]",
  },
  {
    id: "state",
    title: "State Board Schools",
    icon: Landmark,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#15803D]",
  },
  {
    id: "international",
    title: "International Schools",
    icon: Globe,
    iconBg: "bg-[#E0E7FF]",
    iconColor: "text-[#4338CA]",
  },
];

// 4. "Loved by School Leaders" 3 Testimonials
interface SchoolLeaderTestimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  schoolName: string;
  stars: number;
  initials: string;
  accentBg: string;
}

const SCHOOL_TESTIMONIALS: SchoolLeaderTestimonial[] = [
  {
    id: "t1",
    quote:
      "The platform has simplified our entire school operations — from admissions to fees. It's easy to use and highly reliable.",
    authorName: "Mr. Anil Sharma",
    authorRole: "Principal",
    schoolName: "Sunrise International School",
    stars: 5,
    initials: "AS",
    accentBg: "bg-[#EDE7FF] text-[#663CF6]",
  },
  {
    id: "t2",
    quote:
      "A complete and user-friendly solution for our school. The support team is responsive and truly helpful.",
    authorName: "Ms. Priya Verma",
    authorRole: "Director",
    schoolName: "Green Valley Public School",
    stars: 5,
    initials: "PV",
    accentBg: "bg-[#E0F2FE] text-[#0284C7]",
  },
  {
    id: "t3",
    quote:
      "We can now manage academics, attendance and communication in one place. It has made our work much more efficient.",
    authorName: "Mr. Rajesh Mehta",
    authorRole: "Principal",
    schoolName: "Riverside Academy",
    stars: 5,
    initials: "RM",
    accentBg: "bg-[#DCFCE7] text-[#15803D]",
  },
];

/* =========================================================================
   MAIN FOR SCHOOLS PAGE COMPONENT
   ========================================================================= */
export function ForSchoolsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    schoolName: "",
    email: "",
    phone: "",
  });
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Scroll animations for All Features section & cards
  const [visibleFeatureCards, setVisibleFeatureCards] = useState<boolean[]>(
    Array(KEY_CAPABILITIES.length).fill(false)
  );
  const [sectionHeaderInView, setSectionHeaderInView] = useState(false);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleFeatureCards(Array(KEY_CAPABILITIES.length).fill(true));
      setSectionHeaderInView(true);
      return;
    }

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSectionHeaderInView(true);
        } else if (entry && entry.boundingClientRect.top > 0) {
          setSectionHeaderInView(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (sectionHeaderRef.current) {
      headerObserver.observe(sectionHeaderRef.current);
    }

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute("data-card-index");
          if (indexAttr === null) return;
          const idx = parseInt(indexAttr, 10);
          if (isNaN(idx)) return;

          if (entry.isIntersecting) {
            setVisibleFeatureCards((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          } else if (entry.boundingClientRect.top > 0) {
            setVisibleFeatureCards((prev) => {
              if (!prev[idx]) return prev;
              const next = [...prev];
              next[idx] = false;
              return next;
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    featureCardRefs.current.forEach((el) => {
      if (el) cardObserver.observe(el);
    });

    return () => {
      headerObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setDemoModalOpen(false);
      setDemoForm({ name: "", schoolName: "", email: "", phone: "" });
    }, 2500);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmailInput("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-[#1B1D45]">
      {/* Background Ambience identical to home and other marketing pages */}
      <AtmosphericBackground />

      {/* =========================================================================
          1. HEADER / NAVBAR (For Schools active pill)
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
            {/* Active "For Schools" Pill matching design */}
            <Link
              href="/for-schools"
              className="rounded-full bg-[#8B5CF6] px-4 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#7C3AED]"
            >
              For Schools
            </Link>
            <ResourcesDropdown />
          </nav>

          {/* Action CTAs */}
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
                className="rounded-[10px] bg-[#EDE7FF] px-3 py-2 font-bold text-[#663CF6]"
              >
                For Schools
              </Link>
              <MobileResourcesMenu onItemClick={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-[#DFE3F5] pt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[12px] border-[1.5px] border-[#7C3AED] bg-white py-2.5 text-xs font-bold text-[#4F27E8] shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register?step=1"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] py-2.5 text-xs font-bold text-white shadow-md"
              >
                Get Started Free &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION: BUILT FOR SCHOOLS, TRUSTED BY EDUCATORS
          ========================================================================= */}
      <section className="pt-10 pb-8 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Text & CTAs */}
            <div className="text-center lg:col-span-6 lg:text-left">
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-4 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
                <School className="h-3.5 w-3.5" />
                <span>For Schools</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#08093B] sm:text-4xl md:text-5xl leading-tight">
                Built for Schools, <br className="hidden sm:inline" />
                Trusted by Educators
              </h1>

              {/* Subtitle */}
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#4D5072] sm:text-base max-w-xl mx-auto lg:mx-0">
                A complete school management platform that helps schools streamline operations, improve collaboration and deliver a better learning experience.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register?step=1" className="w-full sm:w-auto">
                  <Button
                    variant="gradient"
                    className="w-full sm:w-auto rounded-[12px] px-6 py-3.5 text-xs font-bold shadow-md hover:opacity-95"
                  >
                    Get Started Free &rarr;
                  </Button>
                </Link>

                <Button
                  id="book-demo-hero-btn"
                  type="button"
                  variant="secondary"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto rounded-[12px] border-[1.5px] border-[#8B5CF6] bg-white px-5 py-3.5 text-xs font-bold text-[#663CF6] shadow-xs hover:bg-[#F5F2FE]"
                >
                  <Calendar className="mr-2 h-4 w-4 text-[#663CF6]" />
                  Book a Demo
                </Button>
              </div>

              {/* 3 Core Value Checks */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-[#08093B] sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#15803D]" strokeWidth={2.5} />
                  <span>All-in-One Platform</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#15803D]" strokeWidth={2.5} />
                  <span>Easy to Set Up</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#15803D]" strokeWidth={2.5} />
                  <span>Trusted by 1,000+ Schools</span>
                </div>
              </div>
            </div>

            {/* Right Column: Illustrated School Building Graphic */}
            <div className="relative mx-auto w-full max-w-lg lg:col-span-6 lg:max-w-none">
              <SchoolBuildingIllustration className="w-full max-w-md lg:max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION: "WHY FOR SCHOOLS?" (4 VALUE CARDS WITH GRADIENTS)
          ========================================================================= */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-4 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
              <span>Why for Schools?</span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl md:text-4xl">
              Everything Your School Needs in One Platform
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-[#4D5072] sm:text-sm">
              Powerful, easy-to-use and designed to simplify daily school operations.
            </p>
          </div>

          {/* 4 Value Cards Grid with Gradients & Micro-interactions */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_FOR_SCHOOLS.map((card) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border ${card.borderColor} ${card.bgGradient} p-6 ${card.shadow} ${card.hoverBorder} ${card.hoverShadow} transition-all duration-300 hover:-translate-y-1.5`}
                >
                  {/* Top Glowing Stripe */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.topStripe} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />

                  {/* Ambient Corner Glow */}
                  <div
                    className={`pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full ${card.blobColor} blur-lg transition-transform duration-500 group-hover:scale-150`}
                  />

                  {/* Shimmer Sweep on Hover */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

                  <div className="relative z-10">
                    {/* Icon Circle */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${card.iconBg} ${card.iconColor} ring-1 ${card.iconRing} shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <IconComp className="h-6 w-6" />
                    </div>

                    {/* Title */}
                    <h3 className={`mt-4 text-base font-extrabold tracking-tight text-[#08093B] ${card.titleHover} transition-colors`}>
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#4D5072]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION: "ALL FEATURES" / KEY CAPABILITIES FOR SCHOOLS (8 FEATURE CARDS)
          ========================================================================= */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header with Scroll Animation */}
          <div
            ref={sectionHeaderRef}
            className={`text-center transition-all duration-700 ${
              sectionHeaderInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-4 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
              <span>All Features</span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl md:text-4xl">
              Manage Your School End-to-End
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-[#4D5072] sm:text-sm">
              All the essential tools and modules your school needs to run efficiently.
            </p>
          </div>

          {/* 8 Feature Cards Grid with Staggered Scroll Animation & Micro-Interactions */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {KEY_CAPABILITIES.map((cap, idx) => {
              const IconComp = cap.icon;
              return (
                <div
                  key={cap.id}
                  ref={(el) => {
                    featureCardRefs.current[idx] = el;
                  }}
                  data-card-index={idx}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border ${cap.borderColor} ${cap.bgGradient} p-5 ${cap.shadow} ${cap.hoverBorder} ${cap.hoverShadow} transition-all duration-500 hover:-translate-y-1.5 will-change-transform ${
                    visibleFeatureCards[idx]
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-8 scale-95"
                  }`}
                  style={{
                    transitionDuration: "600ms",
                    transitionDelay: visibleFeatureCards[idx] ? `${(idx % 4) * 80}ms` : "0ms",
                  }}
                >
                  {/* Glowing Top Accent Stripe */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cap.topStripe} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />

                  {/* Ambient Corner Glow Blob */}
                  <div
                    className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full ${cap.blobColor} blur-xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-80`}
                  />

                  {/* Shimmer Light Sweep on Hover */}
                  <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      {/* Icon Circle with Hover Tilt & Zoom */}
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${cap.iconBg} ${cap.iconColor} ring-1 ${cap.iconRing} shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>

                      {/* Title */}
                      <h3
                        className={`mt-3.5 text-base font-extrabold tracking-tight text-[#08093B] ${cap.titleHover} transition-colors`}
                      >
                        {cap.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#4D5072]">
                        {cap.desc}
                      </p>
                    </div>

                    {/* Explore Now Button / Link (Clean spacing, no unnecessary padding) */}
                    <div className="mt-3.5 pt-3 border-t border-black/[0.05]">
                      <Link
                        href={cap.href}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] group-hover:text-[#4F27E8] transition-colors"
                      >
                        <span>Explore Now</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECTION: "FOR EVERY TYPE OF SCHOOL" (CONTAINER WITH ILLUSTRATION & 4 TYPES)
          ========================================================================= */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-[#D6DBF0] bg-gradient-to-br from-white via-[#FCFDFF] to-[#F5F8FF] p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgba(24,18,77,0.06)]">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              {/* Left Column: Compact School Graphic */}
              <div className="flex items-center justify-center lg:col-span-5">
                <SchoolBuildingIllustration className="w-full max-w-xs sm:max-w-sm" compact />
              </div>

              {/* Right Column: 4 School Categories */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-3.5 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
                  <span>For Every Type of School</span>
                </div>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl">
                  A Perfect Fit for Your School
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-4">
                  {SCHOOL_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className="flex flex-col items-center justify-center rounded-[16px] border border-[#DFE3F5] bg-white p-4 text-center transition-all duration-200 hover:border-[#663CF6]/50 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${type.iconBg} ${type.iconColor} shadow-xs mb-3`}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs font-extrabold text-[#08093B] leading-snug">
                          {type.title}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SECTION: "LOVED BY SCHOOL LEADERS" (3 TESTIMONIAL CARDS)
          ========================================================================= */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-[#D4C4FE] bg-[#EDE7FF] px-4 py-1 text-xs font-bold text-[#663CF6] shadow-xs">
              <span>Trusted by Schools</span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#08093B] sm:text-3xl md:text-4xl">
              Loved by School Leaders
            </h2>
          </div>

          {/* 3 Testimonials Grid */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {SCHOOL_TESTIMONIALS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-[20px] border border-[#D6DBF0] bg-gradient-to-b from-white via-[#FCFDFF] to-[#F5F8FF] p-6 shadow-[0_8px_24px_rgba(24,18,77,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#663CF6]/50 hover:shadow-[0_16px_32px_rgba(102,60,246,0.12)]"
              >
                <div>
                  {/* Purple Quote Mark */}
                  <div className="text-[#663CF6] mb-3">
                    <Quote className="h-7 w-7 rotate-180 opacity-80" />
                  </div>

                  {/* Quote Body */}
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#1B1D45] italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info & 5 Stars */}
                <div className="mt-6 pt-4 border-t border-[#DFE3F5] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Initials Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-xs ${item.accentBg}`}
                    >
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#08093B] leading-tight">
                        {item.authorName}
                      </h4>
                      <p className="text-[11px] font-medium text-[#4D5072] leading-tight mt-0.5">
                        {item.authorRole}, {item.schoolName}
                      </p>
                    </div>
                  </div>

                  {/* 5 Golden Stars */}
                  <div className="flex items-center gap-0.5 shrink-0" aria-label="5 stars rating">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. BOTTOM CTA BANNER: READY TO DIGITIZE YOUR SCHOOL?
          ========================================================================= */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[20px] bg-gradient-to-r from-[#663CF6] via-[#5B30E8] to-[#4F27E8] p-7 sm:p-10 shadow-xl shadow-[#663CF6]/20">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row text-center lg:text-left">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Ready to Digitize Your School?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-white/90">
                  Join thousands of schools that are already managing their operations with School Management SaaS.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  id="book-demo-banner-btn"
                  type="button"
                  variant="secondary"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto rounded-[12px] bg-white px-5 py-3.5 text-xs font-bold text-[#663CF6] shadow-md hover:bg-slate-50 transition active:scale-[0.98]"
                >
                  <Calendar className="mr-2 h-4 w-4 text-[#663CF6]" />
                  Book a Demo
                </Button>

                <Link href="/register?step=1" className="w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto rounded-[12px] border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-bold text-white shadow-md backdrop-blur-sm hover:bg-white/20 transition active:scale-[0.98]"
                  >
                    Get Started Free &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="border-t border-[#D6DBF0] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12">
            {/* Brand and Description */}
            <div className="space-y-4 sm:col-span-2 md:col-span-4">
              <BrandLogo className="h-8 sm:h-9" />
              <p className="max-w-sm text-xs font-medium leading-relaxed text-[#4D5072]">
                A comprehensive, cloud-based school management platform to simplify and
                streamline your school operations.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
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
                  <Link href="/for-schools" className="text-[#663CF6] font-bold">
                    For Schools
                  </Link>
                </li>
                <li>
                  <Link href="/#integrations" className="hover:text-[#663CF6]">
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
                  <Link href="/#about" className="hover:text-[#663CF6]">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#663CF6]">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="hover:text-[#663CF6]">
                    Give Feedback
                  </Link>
                </li>
                <li>
                  <Link href="/#privacy" className="hover:text-[#663CF6]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/#terms" className="hover:text-[#663CF6]">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Stay Updated */}
            <div className="space-y-3 sm:col-span-1 md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#08093B]">
                Stay Updated
              </h4>
              <p className="text-xs font-medium text-[#4D5072]">
                Subscribe to get product updates, tips and school management insights.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-1.5 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
              {subscribed && (
                <p className="text-[10px] font-bold text-[#15803D]">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#DFE3F5] pt-6 text-xs text-[#4D5072] sm:flex-row">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} School Management SaaS. All rights reserved.
            </p>
            <p className="flex items-center gap-1 font-semibold text-[#08093B]">
              <span className="text-red-500">❤️</span> Made for Schools
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          9. INTERACTIVE "BOOK A DEMO" MODAL DIALOG
          ========================================================================= */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#4D5072] hover:bg-slate-200"
              aria-label="Close demo modal"
            >
              <X className="h-4 w-4" />
            </button>

            {demoSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-[#08093B]">Demo Requested!</h3>
                <p className="text-xs text-[#4D5072]">
                  Our school onboarding team will reach out within 24 hours to schedule your personalized walkthrough.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-[#08093B]">Book a Personalized Demo</h3>
                  <p className="text-xs text-[#4D5072] mt-1">
                    See how ScholoNix simplifies operations for your specific school type.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#08093B] mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      placeholder="e.g. Dr. Anil Sharma"
                      className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs text-[#1B1D45] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#08093B] mb-1">
                      School / Institution Name
                    </label>
                    <input
                      type="text"
                      required
                      value={demoForm.schoolName}
                      onChange={(e) => setDemoForm({ ...demoForm, schoolName: e.target.value })}
                      placeholder="e.g. Sunrise International School"
                      className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs text-[#1B1D45] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#08093B] mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        placeholder="principal@school.edu"
                        className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs text-[#1B1D45] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#08093B] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-[10px] border border-[#CAD0EB] px-3 py-2 text-xs text-[#1B1D45] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full rounded-[12px] py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95"
                  >
                    Schedule My School Demo &rarr;
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
