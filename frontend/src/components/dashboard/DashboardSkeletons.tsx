export function ShelfBone({ className = "" }: { className?: string }) {
  return <span className={`shelf-skeleton inline-block ${className}`} />;
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex flex-1 sm:flex-none items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 min-w-0 sm:min-w-[9.5rem]"
        >
          <ShelfBone className="w-7 h-7 rounded-lg" />
          <span className="leading-tight min-w-0 flex-1">
            <ShelfBone className="h-2.5 w-16 rounded mb-1.5" />
            <ShelfBone className="h-3.5 w-12 rounded" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardContinueSkeleton() {
  return (
    <section aria-hidden>
      <ShelfBone className="h-4 w-48 rounded mb-3" />
      <div className="flex items-center gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4">
        <ShelfBone className="w-10 h-12 rounded-lg shrink-0" />
        <span className="min-w-0 flex-1">
          <ShelfBone className="h-2.5 w-28 rounded mb-2" />
          <ShelfBone className="h-4 w-40 rounded mb-2" />
          <ShelfBone className="h-2.5 w-36 rounded" />
        </span>
        <ShelfBone className="h-8 w-[5.5rem] rounded-lg shrink-0" />
      </div>
    </section>
  );
}

export function DashboardNextUpSkeleton() {
  return (
    <section aria-hidden>
      <div className="flex items-center justify-between mb-3">
        <ShelfBone className="h-4 w-20 rounded" />
        <ShelfBone className="h-3 w-24 rounded" />
      </div>
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8rem_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <ShelfBone className="h-3 w-20 rounded" />
            <ShelfBone className="h-3.5 w-36 rounded" />
            <ShelfBone className="hidden sm:inline-block h-4 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardNotebooksSkeleton() {
  return (
    <section aria-hidden>
      <div className="flex items-center justify-between mb-3">
        <ShelfBone className="h-4 w-32 rounded" />
        <ShelfBone className="h-3 w-24 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-h-[6.1rem] rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <ShelfBone className="w-[26px] h-[26px] rounded-md" />
              <ShelfBone className="h-3.5 w-24 rounded" />
            </div>
            <ShelfBone className="h-2.5 w-28 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardStarterSkeleton() {
  return (
    <section aria-hidden>
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
        <ShelfBone className="h-2.5 w-16 rounded mb-3" />
        <ShelfBone className="h-5 w-56 rounded mb-2" />
        <ShelfBone className="h-3 w-full max-w-md rounded mb-1.5" />
        <ShelfBone className="h-3 w-2/3 max-w-sm rounded" />
      </div>
    </section>
  );
}

export function DashboardAddMaterialSkeleton() {
  return (
    <div className="mt-2.5 flex items-center gap-2" aria-hidden>
      <ShelfBone className="h-3.5 w-28 rounded" />
      <ShelfBone className="hidden sm:inline-block h-3 w-64 rounded" />
    </div>
  );
}

export function ExplorerSidebarSkeleton() {
  return (
    <div className="px-2 py-1 space-y-0.5" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md px-1.5 py-1.5"
        >
          <ShelfBone className="w-3.5 h-3.5 rounded shrink-0" />
          <ShelfBone
            className={`h-3 rounded ${
              i % 4 === 0 ? "w-[70%]" : i % 3 === 0 ? "w-[55%]" : "w-[42%]"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function LibraryResumeSkeleton() {
  return (
    <div
      className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)]"
      aria-hidden
    >
      <ShelfBone className="w-5 h-5 rounded shrink-0" />
      <span className="min-w-0 flex-1">
        <ShelfBone className="h-3.5 w-32 rounded mb-1.5" />
        <ShelfBone className="h-2.5 w-40 rounded" />
      </span>
    </div>
  );
}

export function LibrarySearchHitsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-4 py-2.5" aria-hidden>
          <ShelfBone className="h-3.5 w-40 rounded mb-1.5" />
          <ShelfBone className="h-2.5 w-56 rounded" />
        </li>
      ))}
    </>
  );
}

export function DashboardAchievementsSkeleton() {
  return (
    <section aria-hidden>
      <div className="flex items-center justify-between mb-3">
        <ShelfBone className="h-4 w-28 rounded" />
        <ShelfBone className="h-3 w-10 rounded" />
      </div>
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <ShelfBone key={i} className="aspect-square w-full rounded-[10px]" />
        ))}
      </div>
    </section>
  );
}
