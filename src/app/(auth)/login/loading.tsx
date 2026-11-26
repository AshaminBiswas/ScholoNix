import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sign In Page Loading Skeleton Body
 * Displayed automatically by Next.js when navigating to /login.
 */
export default function LoginLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading sign in page"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#F3E8FE]/60 via-[#F0EBFE]/50 to-[#DDF5FE]/60 p-4 dark:from-[#070917] dark:via-[#0D1027] dark:to-[#0B192E]"
    >
      <span className="sr-only">Loading sign in page...</span>

      <div className="w-full max-w-md rounded-[20px] border border-[#D6DBF0] bg-white p-8 shadow-xl shadow-[#663CF6]/8 space-y-6 dark:border-[#272B4D] dark:bg-[#141731] dark:shadow-black/50">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-[14px] bg-[#EDE7FF] dark:bg-[#251D4A]" />
          <Skeleton className="mt-2 h-7 w-56" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>

        {/* Inputs */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>

          {/* Button */}
          <Skeleton className="h-11 w-full rounded-[12px] bg-[#EDE7FF] mt-2" />
        </div>

        {/* Footer */}
        <div className="pt-2 text-center border-t border-[#DFE3F5]">
          <Skeleton className="mx-auto h-3.5 w-60" />
        </div>
      </div>
    </div>
  );
}
