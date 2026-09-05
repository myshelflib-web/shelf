"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

export type DeleteProgressJob = {
  id: string;
  label: string;
};

type DeleteProgressContextValue = {
  jobs: readonly DeleteProgressJob[];
  /** Selection keys currently being deleted (items stay visible until success). */
  deletingKeys: ReadonlySet<string>;
  start: (label: string, keys?: Iterable<string>) => string;
  finish: (id: string, keys?: Iterable<string>) => void;
};

const DeleteProgressContext = createContext<DeleteProgressContextValue | null>(
  null
);

let jobSeq = 0;

function DeleteProgressChip({ jobs }: { jobs: readonly DeleteProgressJob[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || jobs.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 px-3 w-[min(100%,24rem)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-1.5">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl px-3.5 py-3"
          >
            <Loader2
              className="w-4 h-4 shrink-0 animate-spin text-[var(--accent)]"
              aria-hidden
            />
            <p className="text-sm font-medium text-[var(--text-primary)] min-w-0 flex-1 truncate">
              {job.label}
            </p>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

export function DeleteProgressProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<DeleteProgressJob[]>([]);
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(() => new Set());

  const start = useCallback((label: string, keys?: Iterable<string>) => {
    const id = `del-${++jobSeq}-${Date.now()}`;
    setJobs((prev) => [...prev, { id, label }]);
    if (keys) {
      const add = [...keys];
      if (add.length > 0) {
        setDeletingKeys((prev) => {
          const next = new Set(prev);
          for (const key of add) next.add(key);
          return next;
        });
      }
    }
    return id;
  }, []);

  const finish = useCallback((id: string, keys?: Iterable<string>) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
    if (keys) {
      const remove = [...keys];
      if (remove.length > 0) {
        setDeletingKeys((prev) => {
          const next = new Set(prev);
          for (const key of remove) next.delete(key);
          return next;
        });
      }
    }
  }, []);

  const value = useMemo(
    () => ({ jobs, deletingKeys, start, finish }),
    [jobs, deletingKeys, start, finish]
  );

  return (
    <DeleteProgressContext.Provider value={value}>
      {children}
      <DeleteProgressChip jobs={jobs} />
    </DeleteProgressContext.Provider>
  );
}

export function useDeleteProgress(): DeleteProgressContextValue {
  const ctx = useContext(DeleteProgressContext);
  if (!ctx) {
    throw new Error("useDeleteProgress must be used within DeleteProgressProvider");
  }
  return ctx;
}

/** Safe outside provider (e.g. tests) — no-ops when missing. */
export function useDeleteProgressOptional(): DeleteProgressContextValue | null {
  return useContext(DeleteProgressContext);
}

const MIN_PROGRESS_MS = 700;

/** Show progress chip for at least MIN_PROGRESS_MS so fast actions are visible. */
export async function runWithProgressUi<T>(
  progress: Pick<DeleteProgressContextValue, "start" | "finish">,
  label: string,
  work: () => Promise<T>,
  keys?: Iterable<string>
): Promise<T> {
  const keyList = keys ? [...keys] : undefined;
  const id = progress.start(label, keyList);
  const started = Date.now();
  try {
    return await work();
  } finally {
    const elapsed = Date.now() - started;
    if (elapsed < MIN_PROGRESS_MS) {
      await new Promise((r) => setTimeout(r, MIN_PROGRESS_MS - elapsed));
    }
    progress.finish(id, keyList);
  }
}

/** @deprecated Prefer runWithProgressUi — same helper, kept for existing call sites. */
export const runDeleteWithProgressUi = runWithProgressUi;
