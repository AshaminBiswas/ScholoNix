import { Skeleton } from "@/components/ui/skeleton";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

/**
 * Registration Wizard Loading Skeleton Body
 * Displayed automatically by Next.js when navigating to /register.
 */
export default function RegisterLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading registration wizard"
      className="relative min-h-screen overflow-x-hidden bg-[#FCFDFE] text-[#1B1D45]"
    >
      <span className="sr-only">Loading registration wizard...</span>
      <AtmosphericBackground />

      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 border-b border-[#D6DBF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-[12px] bg-[#EDE7FF]" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-4 w-36 sm:block" />
            <Skeleton className="h-9 w-20 rounded-[12px]" />
          </div>
        </div>
      </header>

      {/* Main 2-Column Content Skeleton */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Title + Stepper + Form Card (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Title & Description Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-60 sm:h-9" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>

            {/* Stepper Tabs Skeleton */}
            <div className="rounded-[16px] border border-[#D6DBF0] bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1.5 text-center"
                  >
                    <Skeleton className="h-7 w-7 rounded-full bg-[#EDE7FF]" />
                    <Skeleton className="h-3 w-16 sm:w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Form Container Card Skeleton */}
            <div className="rounded-[20px] border border-[#D0D6F0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_rgba(24,18,77,0.09)] space-y-6">
              {/* Form Title & Subtitle */}
              <div className="border-b border-[#DFE3F5] pb-4 space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-3.5 w-72 max-w-full" />
              </div>

              {/* Input Fields Grid (2 columns) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
              </div>

              {/* Full Width Field */}
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-10 w-full rounded-[10px]" />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between border-t border-[#DFE3F5]">
                <Skeleton className="h-11 w-full sm:w-44 rounded-[12px]" />
                <Skeleton className="h-11 w-full sm:w-56 rounded-[12px] bg-[#EDE7FF]" />
              </div>
            </div>
          </div>

          {/* Right Column: Guide & Help Cards Skeleton (4 cols) */}
          <div className="space-y-5 lg:col-span-4">
            {/* What Happens Next Card Skeleton */}
            <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-5 shadow-[0_8px_24px_rgba(24,18,77,0.08)] space-y-4">
              <Skeleton className="h-5 w-44" />
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full bg-[#EDE7FF]" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary Card Skeleton */}
            <div className="rounded-[16px] border border-[#CDC2F7] bg-[#F5F1FE]/80 p-5 space-y-3 shadow-xs">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-28 bg-[#EDE7FF]" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-10 w-full rounded-[12px] mt-2" />
            </div>

            {/* Security Assurance Skeleton */}
            <div className="rounded-[16px] border border-[#D6DBF0] bg-white p-4 flex items-center gap-3 shadow-xs">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-[#DCFCE7]" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
