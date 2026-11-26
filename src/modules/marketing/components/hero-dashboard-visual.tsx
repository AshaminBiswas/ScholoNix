"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  RotateCw,
} from "lucide-react";

interface BarData {
  month: string;
  height: number;
  amount: string;
}

const BARS: BarData[] = [
  { month: "Apr", height: 40, amount: "₹4.0L" },
  { month: "May", height: 65, amount: "₹6.5L" },
  { month: "Jun", height: 50, amount: "₹5.0L" },
  { month: "Jul", height: 75, amount: "₹7.5L" },
  { month: "Aug", height: 60, amount: "₹6.0L" },
  { month: "Sep", height: 90, amount: "₹9.0L" },
  { month: "Oct", height: 85, amount: "₹8.5L" },
  { month: "Nov", height: 95, amount: "₹9.5L" },
  { month: "Dec", height: 70, amount: "₹7.0L" },
  { month: "Jan", height: 80, amount: "₹8.0L" },
  { month: "Feb", height: 100, amount: "₹10.0L" },
];

export function HeroDashboardVisual() {
  const [isMounted, setIsMounted] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [metrics, setMetrics] = useState({
    students: 1248,
    staff: 86,
    admissions: 37,
    fees: 548000,
    attendance: 96.4,
  });
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Silky smooth animation runner using requestAnimationFrame & hardware-accelerated transitions
  const runAnimation = useCallback(() => {
    // If prefers-reduced-motion is active, set final values immediately
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMetrics({
        students: 1248,
        staff: 86,
        admissions: 37,
        fees: 548000,
        attendance: 96.4,
      });
      setBarsAnimated(true);
      return;
    }

    // Reset metrics for clean count-up
    setMetrics({
      students: 0,
      staff: 0,
      admissions: 0,
      fees: 0,
      attendance: 0,
    });
    setBarsAnimated(false);

    // Trigger SVG gauge and fee bars growth via hardware-accelerated CSS transition
    const barTimeout = setTimeout(() => {
      setBarsAnimated(true);
    }, 80);

    // Animate numbers smoothly using requestAnimationFrame with quintic ease-out deceleration
    let rafId: number;
    const startTime = performance.now();
    const duration = 1150;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic easeOut curve: ultra-smooth, organic deceleration
      const ease = 1 - Math.pow(1 - progress, 4);

      setMetrics({
        students: Math.round(ease * 1248),
        staff: Math.round(ease * 86),
        admissions: Math.round(ease * 37),
        fees: Math.round(ease * 548000),
        attendance: Number((ease * 96.4).toFixed(1)),
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setMetrics({
          students: 1248,
          staff: 86,
          admissions: 37,
          fees: 548000,
          attendance: 96.4,
        });
        setIsRefreshing(false);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      clearTimeout(barTimeout);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const cleanup = runAnimation();
    return () => {
      if (cleanup) cleanup();
    };
  }, [runAnimation, animationKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="relative mx-auto w-full max-w-lg lg:col-span-6 lg:max-w-none">
      {/* =========================================================================
          1. 5 FLOATING AMBIENT PILL ICONS (Visible on sm+ screens)
          Each chip features an independent organic floating keyframe & smooth hover
          ========================================================================= */}
      {/* 1. Cap Pill (Top-Left) */}
      <div
        className="hidden sm:flex absolute -top-5 -left-3 z-20 h-11 w-11 items-center justify-center rounded-[14px] bg-[#DDF0FF] text-[#0E74CE] shadow-lg ring-1 ring-white/90 animate-float-chip-1 cursor-pointer transition-transform duration-300 hover:scale-125 hover:shadow-xl hover:ring-2 hover:ring-[#0E74CE]/40 active:scale-95 dark:bg-[#133252] dark:text-[#7DD3FC] dark:ring-[#1E547A]"
        title="Academics"
      >
        <GraduationCap className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
      </div>

      {/* 2. Users Pill (Top-Right) */}
      <div
        className="hidden sm:flex absolute -top-3 right-12 z-20 h-11 w-11 items-center justify-center rounded-[14px] bg-[#EDE7FF] text-[#5824EE] shadow-lg ring-1 ring-white/90 animate-float-chip-2 cursor-pointer transition-transform duration-300 hover:scale-125 hover:shadow-xl hover:ring-2 hover:ring-[#5824EE]/40 active:scale-95 dark:bg-[#2A2056] dark:text-[#CBB8FF] dark:ring-[#4A3B8F]"
        title="Students & Staff"
      >
        <Users className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
      </div>

      {/* 3. Calendar Pill (Middle-Left) */}
      <div
        className="hidden sm:flex absolute top-1/2 -left-5 z-20 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[14px] bg-[#DCFCE7] text-[#15803D] shadow-lg ring-1 ring-white/90 animate-float-chip-3 cursor-pointer transition-transform duration-300 hover:scale-125 hover:shadow-xl hover:ring-2 hover:ring-[#15803D]/40 active:scale-95 dark:bg-[#102E20] dark:text-[#6EE7B7] dark:ring-[#1E603A]"
        title="Attendance & Timetable"
      >
        <Calendar className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
      </div>

      {/* 4. CreditCard Pill (Middle-Right) */}
      <div
        className="hidden sm:flex absolute top-1/3 -right-5 z-20 h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFF0D5] text-[#B45309] shadow-lg ring-1 ring-white/90 animate-float-chip-4 cursor-pointer transition-transform duration-300 hover:scale-125 hover:shadow-xl hover:ring-2 hover:ring-[#B45309]/40 active:scale-95 dark:bg-[#2B1F0B] dark:text-[#FCD34D] dark:ring-[#784915]"
        title="Fee Management"
      >
        <CreditCard className="h-5 w-5 transition-transform duration-300 hover:rotate-6" />
      </div>

      {/* 5. BarChart3 Pill (Bottom-Right) */}
      <div
        className="hidden sm:flex absolute -bottom-3 right-8 z-20 h-11 w-11 items-center justify-center rounded-[14px] bg-[#E0E7FF] text-[#4338CA] shadow-lg ring-1 ring-white/90 animate-float-chip-5 cursor-pointer transition-transform duration-300 hover:scale-125 hover:shadow-xl hover:ring-2 hover:ring-[#4338CA]/40 active:scale-95 dark:bg-[#1E2352] dark:text-[#A5B4FC] dark:ring-[#3B428F]"
        title="Reports & Analytics"
      >
        <BarChart3 className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
      </div>

      {/* =========================================================================
          2. AMBIENT GLOWING AURORA HALO
          ========================================================================= */}
      <div className="absolute -inset-2 z-0 rounded-[24px] bg-gradient-to-tr from-[#DBF2FE]/70 via-[#EDE4FF]/60 to-[#F0E6FE]/50 blur-2xl sm:-inset-3 animate-aura-breath pointer-events-none dark:from-[#0EA5E9]/20 dark:via-[#663CF6]/25 dark:to-[#4C1D95]/20" />

      {/* =========================================================================
          3. DASHBOARD WINDOW CONTAINER
          ========================================================================= */}
      <div className="relative z-10 overflow-hidden rounded-[20px] border border-[#D0D6F0] bg-white shadow-[0_20px_48px_rgba(79,39,232,0.16),0_4px_14px_rgba(8,9,59,0.08)] transition-all duration-300 hover:shadow-[0_24px_54px_rgba(79,39,232,0.22)] hover:-translate-y-0.5 dark:border-[#2C325B] dark:bg-[#141731] dark:shadow-[0_24px_56px_rgba(3,5,18,0.65)]">
        {/* Window Header Bar */}
        <div className="flex items-center justify-between border-b border-[#DFE3F5] bg-[#F5F7FD] px-3.5 py-2.5 sm:px-4 dark:border-[#232746] dark:bg-[#10142C]">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-icon-clean.png"
              alt="ScholoNix"
              width={20}
              height={20}
              style={{ width: "auto", height: "auto" }}
              className="h-5 w-5 object-contain"
            />
            <span className="truncate text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
              ScholoNix Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Interactive Refresh / Re-animate CTA */}
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Replay live dashboard animations"
              title="Click to replay live metrics animation"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#666987] hover:bg-[#EAEFFD] hover:text-[#4F27E8] transition-all dark:text-[#9DA6CC] dark:hover:bg-[#1F2447] dark:hover:text-[#C4B5FD]"
            >
              <RotateCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin text-[#663CF6] dark:text-[#A78BFA]" : "transition-transform hover:rotate-180"}`}
              />
            </button>

            {/* Window control dots */}
            <div className="flex items-center gap-1.5 pl-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#CBD5E1] transition-colors hover:bg-red-400 dark:bg-[#353C66]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#CBD5E1] transition-colors hover:bg-amber-400 dark:bg-[#353C66]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#CBD5E1] transition-colors hover:bg-emerald-400 dark:bg-[#353C66]" />
            </div>
          </div>
        </div>

        {/* Dashboard Inner App Content */}
        <div className="p-3.5 sm:p-5">
          {/* Welcome Row with Live Radar Beacon */}
          <div className="mb-3.5 flex items-center justify-between sm:mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#08093B] dark:text-[#F3F5FF]">
                Good Morning, Principal 👋
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#4D5072] font-medium dark:text-[#9DA6CC]">
                Sunrise International School • 2026-27
              </p>
            </div>

            {/* Pulsing Live Campus Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#86EFAC] bg-[#DCFCE7] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#15803D] shadow-xs dark:border-[#1E603A] dark:bg-[#102E20] dark:text-[#6EE7B7]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Live Campus</span>
            </span>
          </div>

          {/* =====================================================================
              4 KPI METRIC CARDS (With Smooth Animated Count-Up & Color Accents)
              ===================================================================== */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {/* 1. Total Students */}
            <div className="group rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2 sm:rounded-[12px] sm:p-2.5 transition-all duration-200 hover:bg-white hover:border-[#663CF6]/50 hover:shadow-md hover:-translate-y-0.5 cursor-default dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-[#8B5CF6]">
              <div className="text-[9px] sm:text-[10px] font-semibold text-[#4D5072] transition-colors group-hover:text-[#663CF6] dark:text-[#9DA6CC] dark:group-hover:text-[#C4B5FD]">
                Total Students
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="h-3.5 w-1 shrink-0 rounded bg-[#663CF6] transition-transform duration-300 group-hover:scale-y-125" />
                <span className="text-sm font-extrabold text-[#08093B] sm:text-base tabular-nums dark:text-[#F3F5FF]">
                  {isMounted ? metrics.students.toLocaleString("en-IN") : "1,248"}
                </span>
              </div>
            </div>

            {/* 2. Total Staff */}
            <div className="group rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2 sm:rounded-[12px] sm:p-2.5 transition-all duration-200 hover:bg-white hover:border-[#0E74CE]/50 hover:shadow-md hover:-translate-y-0.5 cursor-default dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-[#38BDF8]">
              <div className="text-[9px] sm:text-[10px] font-semibold text-[#4D5072] transition-colors group-hover:text-[#0E74CE] dark:text-[#9DA6CC] dark:group-hover:text-[#7DD3FC]">
                Total Staff
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="h-3.5 w-1 shrink-0 rounded bg-[#0E74CE] transition-transform duration-300 group-hover:scale-y-125" />
                <span className="text-sm font-extrabold text-[#08093B] sm:text-base tabular-nums dark:text-[#F3F5FF]">
                  {isMounted ? metrics.staff : "86"}
                </span>
              </div>
            </div>

            {/* 3. Pending Admissions */}
            <div className="group rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2 sm:rounded-[12px] sm:p-2.5 transition-all duration-200 hover:bg-white hover:border-[#DB2777]/50 hover:shadow-md hover:-translate-y-0.5 cursor-default dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-[#F472B6]">
              <div className="text-[9px] sm:text-[10px] font-semibold text-[#4D5072] transition-colors group-hover:text-[#DB2777] dark:text-[#9DA6CC] dark:group-hover:text-[#F9A8D4]">
                Pending Adm.
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="h-3.5 w-1 shrink-0 rounded bg-[#DB2777] transition-transform duration-300 group-hover:scale-y-125" />
                <span className="text-sm font-extrabold text-[#08093B] sm:text-base tabular-nums dark:text-[#F3F5FF]">
                  {isMounted ? metrics.admissions : "37"}
                </span>
              </div>
            </div>

            {/* 4. Fees Dues */}
            <div className="group rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2 sm:rounded-[12px] sm:p-2.5 transition-all duration-200 hover:bg-white hover:border-[#B45309]/50 hover:shadow-md hover:-translate-y-0.5 cursor-default dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-[#FBBF24]">
              <div className="text-[9px] sm:text-[10px] font-semibold text-[#4D5072] transition-colors group-hover:text-[#B45309] dark:text-[#9DA6CC] dark:group-hover:text-[#FCD34D]">
                Fees Dues
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="h-3.5 w-1 shrink-0 rounded bg-[#B45309] transition-transform duration-300 group-hover:scale-y-125" />
                <span className="text-sm font-extrabold text-[#08093B] sm:text-base tabular-nums dark:text-[#F3F5FF]">
                  ₹{isMounted ? metrics.fees.toLocaleString("en-IN") : "5,48,000"}
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              CHARTS ROW: Circular Attendance Progress & Fee Collection Bars
              ===================================================================== */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-3.5 sm:grid-cols-12 sm:gap-3">
            {/* Donut Attendance Chart with Smooth Animated Progress Ring */}
            <div className="group flex flex-col items-center justify-center rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2.5 text-center sm:col-span-4 sm:rounded-[12px] sm:p-3 transition-all duration-200 hover:bg-white hover:border-emerald-300 hover:shadow-md cursor-default dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-emerald-600/60">
              <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Track Circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-[#DFE3F5] dark:stroke-[#272B4D]"
                    strokeWidth="3.5"
                  />
                  {/* Animated Progress Circle - Fills smoothly via GPU transition, never closing into a full loop */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#16B84E"
                    strokeWidth="3.5"
                    pathLength="100"
                    strokeDasharray={`${barsAnimated ? 72.3 : 0} 100`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dasharray 1.15s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] sm:text-xs font-black text-[#08093B] tabular-nums dark:text-[#F3F5FF]">
                    {isMounted ? `${metrics.attendance.toFixed(1)}%` : "96.4%"}
                  </span>
                  <span className="block text-[7px] sm:text-[8px] font-bold text-[#15803D] uppercase tracking-wide dark:text-emerald-400">
                    Present
                  </span>
                </div>
              </div>
              <span className="mt-1.5 text-[9px] sm:text-[10px] font-semibold text-[#4D5072] group-hover:text-[#08093B] transition-colors dark:text-[#9DA6CC] dark:group-hover:text-[#F3F5FF]">
                Today&apos;s Attendance
              </span>
            </div>

            {/* Fee Collection Trend Bars with Staggered Growth & Interactive Tooltips */}
            <div className="flex flex-col justify-between rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2.5 sm:col-span-8 sm:rounded-[12px] sm:p-3 transition-all duration-200 hover:bg-white hover:border-purple-300 hover:shadow-md dark:border-[#272B4D] dark:bg-[#10142C] dark:hover:bg-[#191E3F] dark:hover:border-[#8B5CF6]/60">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#08093B] dark:text-[#F3F5FF]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#4F27E8] to-[#8B5CF6]" />
                  <span>Fee Collection Trend</span>
                </span>
                <span className="rounded-md bg-[#EDE7FF] px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                  Monthly
                </span>
              </div>

              {/* Bar graph visual with staggered animated entry and hover tooltips */}
              <div className="relative flex h-16 sm:h-20 items-end justify-between gap-1 sm:gap-1.5 pt-2">
                {BARS.map((bar, i) => {
                  const isHovered = hoveredBar === i;
                  return (
                    <div
                      key={bar.month}
                      className="group/bar relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Floating Micro-Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-7 z-30 flex items-center gap-0.5 rounded-md bg-[#08093B] px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap dark:bg-[#251D4A]">
                          <span>{bar.month}:</span>
                          <span className="text-[#A78BFA]">{bar.amount}</span>
                        </div>
                      )}

                      {/* Bar Fill with Staggered Transition */}
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          isHovered
                            ? "bg-gradient-to-t from-[#663CF6] to-[#A78BFA] shadow-[0_0_8px_rgba(102,60,246,0.5)] scale-x-105"
                            : "bg-gradient-to-t from-[#4F27E8] to-[#8B5CF6] hover:brightness-110"
                        }`}
                        style={{
                          height: barsAnimated ? `${bar.height}%` : "0%",
                          transition: "height 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
                          transitionDelay: `${i * 35}ms`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Month Axis Labels */}
              <div className="flex justify-between pt-1 text-[7px] sm:text-[8px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">
                <span>Apr</span>
                <span>Jun</span>
                <span>Aug</span>
                <span>Oct</span>
                <span>Dec</span>
                <span>Feb</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
