import { ShelfBone } from "@/components/dashboard/DashboardSkeletons";

export function LearnCatalogSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-hidden>
      <div>
        <ShelfBone className="h-3 w-24 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: cards }, (_, i) => (
            <div
              key={i}
              className="min-h-[6.1rem] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <ShelfBone className="w-7 h-7 rounded-md" />
                <ShelfBone className="h-3.5 w-32 rounded" />
              </div>
              <ShelfBone className="h-2.5 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LearnCollectionSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div>
        <ShelfBone className="w-10 h-10 rounded-[10px] mb-4" />
        <ShelfBone className="h-6 w-64 rounded mb-2" />
        <ShelfBone className="h-3.5 w-80 max-w-full rounded mb-3" />
        <ShelfBone className="h-3 w-28 rounded" />
      </div>
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <ShelfBone className="w-8 h-8 rounded-md shrink-0" />
            <span className="flex-1 min-w-0">
              <ShelfBone className="h-3.5 w-40 rounded mb-1.5" />
              <ShelfBone className="h-2.5 w-20 rounded" />
            </span>
          </div>
        ))}
      </div>
      <div>
        <ShelfBone className="h-3 w-36 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="min-h-[6.1rem] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
            >
              <ShelfBone className="h-3.5 w-28 rounded mb-4" />
              <ShelfBone className="h-2.5 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
