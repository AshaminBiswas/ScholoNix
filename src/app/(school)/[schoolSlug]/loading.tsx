import { Skeleton } from "@/components/ui/skeleton";

export default function SchoolWorkspaceLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading school workspace"
      className="min-h-screen bg-[#F4F6FC] flex flex-col font-sans"
    >
      <span className="sr-only">Loading school workspace...</span>
      <header className="sticky top-0 z-40 border-b border-[#D6DBF0] bg-white px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-36 hidden sm:block" />
            <Skeleton className="h-7 w-44 rounded-full bg-[#EDE7FF]" />
          </div>
          <Skeleton className="h-8 w-80 hidden md:block rounded-[10px]" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-64 border-r border-[#D6DBF0] bg-white p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-[12px] bg-[#EDE7FF]" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-[10px]" />
          ))}
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 space-y-3"
              >
                <Skeleton className="h-10 w-10 rounded-[12px] bg-[#EDE7FF]" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
