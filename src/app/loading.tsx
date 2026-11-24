import { Skeleton } from "@/components/ui/skeleton";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

/**
 * Global Root Loading Skeleton Body
 * Displayed automatically by Next.js App Router during page suspense and route transitions.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
      className="relative min-h-screen overflow-x-hidden bg-[#FCFDFE]"
    >
      <span className="sr-only">Loading page content...</span>

      {/* Atmospheric Background glow */}
      <AtmosphericBackground />

      {/* 1. Header / Navbar Skeleton */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Brand Skeleton */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-[12px] bg-[#EDE7FF]" />
            <Skeleton className="h-5 w-40 sm:w-48" />
          </div>

          {/* Nav Items Skeleton (hidden on mobile) */}
          <div className="hidden items-center gap-7 md:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-18" />
          </div>

          {/* Action CTAs Skeleton */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="hidden h-9 w-20 rounded-[12px] sm:block" />
            <Skeleton className="h-9 w-28 sm:w-32 rounded-[12px] bg-[#EDE7FF]" />
          </div>
        </div>
      </header>

      {/* 2. Main Body Skeleton */}
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8">
        {/* Hero Section Grid */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Headline & Controls */}
          <div className="space-y-5 sm:space-y-6 lg:col-span-6">
            {/* Pill Badge */}
            <Skeleton className="h-6 w-52 rounded-full bg-[#EDE7FF]" />

            {/* Main Headline lines */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-3/4 sm:h-12" />
              <Skeleton className="h-10 w-4/5 sm:h-12" />
              <Skeleton className="h-10 w-2/3 sm:h-12 bg-[#EDE7FF]" />
            </div>

            {/* Subtitle lines */}
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Skeleton className="h-11 w-full sm:w-40 rounded-[12px] bg-[#EDE7FF]" />
              <Skeleton className="h-11 w-full sm:w-36 rounded-[12px]" />
            </div>

            {/* Checklist items */}
            <div className="flex flex-wrap gap-4 pt-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Right Column: Live Mockup Dashboard Card Skeleton */}
          <div className="mx-auto w-full max-w-lg lg:col-span-6 lg:max-w-none">
            <div className="rounded-[20px] border border-[#D0D6F0] bg-white p-4 sm:p-5 shadow-[0_20px_48px_rgba(79,39,232,0.16),0_4px_14px_rgba(8,9,59,0.08)]">
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-[8px]" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                </div>
              </div>

              {/* Metric Cards Skeleton Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-2.5"
                  >
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="mt-2 h-5 w-16" />
                  </div>
                ))}
              </div>

              {/* Chart Placeholders */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-3 sm:col-span-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
                <div className="flex flex-col justify-between rounded-[10px] border border-[#DDE2F4] bg-[#F5F7FD] p-3 sm:col-span-8">
                  <Skeleton className="h-3 w-28" />
                  <div className="mt-3 flex h-14 items-end justify-between gap-1.5">
                    {[40, 65, 50, 75, 60, 90, 85, 70].map((h, idx) => (
                      <Skeleton
                        key={idx}
                        className="w-full rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Feature Cards Grid Skeleton */}
        <div className="mt-16 sm:mt-24">
          <div className="mx-auto max-w-xl text-center space-y-2">
            <Skeleton className="mx-auto h-5 w-28 rounded-full bg-[#EDE7FF]" />
            <Skeleton className="mx-auto h-8 w-64 sm:w-80" />
            <Skeleton className="mx-auto h-4 w-96 max-w-full" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-[16px] border border-[#D6DBF0] bg-white p-5 shadow-[0_8px_24px_rgba(24,18,77,0.08)] space-y-3"
              >
                <Skeleton className="h-11 w-11 rounded-[12px] bg-[#EDE7FF]" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
