import { Skeleton } from "@/components/ui/skeleton";

export default function AdmissionsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading admissions workspace"
      className="min-h-screen bg-[#F4F6FC] flex flex-col font-sans dark:bg-[#090B1A]"
    >
      <span className="sr-only">Loading admissions workspace...</span>
      <header className="sticky top-0 z-40 h-14 border-b border-[#D6DBF0] bg-white px-4 sm:px-6 flex items-center dark:border-[#272B4D] dark:bg-[#0E1026]">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-44 rounded-full bg-[#EDE7FF] dark:bg-[#251D4A]" />
          </div>
          <Skeleton className="h-8 w-80 hidden md:block rounded-[10px]" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-64 border-r border-[#D6DBF0] bg-white p-4 space-y-2 dark:border-[#272B4D] dark:bg-[#0E1026]">
          <Skeleton className="h-10 w-full rounded-[12px]" />
          <Skeleton className="h-10 w-full rounded-[12px] bg-[#EDE7FF] dark:bg-[#251D4A]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-[10px]" />
          ))}
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-44" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36 rounded-[12px] bg-[#EDE7FF] dark:bg-[#251D4A]" />
              <Skeleton className="h-10 w-36 rounded-[12px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-[20px]" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Skeleton className="lg:col-span-5 h-60 rounded-[20px]" />
            <Skeleton className="lg:col-span-7 h-60 rounded-[20px]" />
          </div>
        </main>
      </div>
    </div>
  );
}
