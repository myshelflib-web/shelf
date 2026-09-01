import { ShelfBone } from "@/components/dashboard/DashboardSkeletons";

export function LearnReaderSkeleton() {
  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]"
      aria-busy
      aria-label="Opening document"
    >
      <div className="h-14 shrink-0 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3">
        <ShelfBone className="h-8 w-8 rounded-lg shrink-0" />
        <ShelfBone className="h-3.5 w-40 rounded" />
        <div className="flex-1" />
        <ShelfBone className="h-8 w-24 rounded-lg shrink-0" />
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="hidden md:block w-72 shrink-0 border-r border-[var(--border-subtle)] p-3 space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ShelfBone key={i} className="h-7 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-4">
          <div className="flex items-center gap-2">
            <ShelfBone className="h-7 w-32 rounded-md" />
            <ShelfBone className="h-7 w-20 rounded-md" />
          </div>
          <div className="flex-1 min-h-0 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">
            <ShelfBone className="h-4 w-2/3 max-w-md rounded" />
            <ShelfBone className="h-3 w-full rounded" />
            <ShelfBone className="h-3 w-full rounded" />
            <ShelfBone className="h-3 w-5/6 rounded" />
            <div className="pt-4 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <ShelfBone key={i} className="h-3 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
