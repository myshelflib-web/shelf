"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { UserSubject } from "@/types";
import { api } from "@/lib/api";
import { applyPendingDeletesToSubjects } from "@/lib/pendingExplorerDeletes";
import {
  SIDEBAR_MAX_PINNED,
  pushPinnedSlug,
  readPinnedSlugs,
  removePinnedSlug,
} from "@/lib/myContentSidebarPrefs";

type Args = {
  subjects: UserSubject[];
  notebookSlug: string | null | undefined;
  setPinnedExtra: Dispatch<SetStateAction<UserSubject[]>>;
  markHydrated: (id: string, slug?: string) => void;
  treeMutationInFlightRef: MutableRefObject<boolean>;
};

function sameSubjectIds(a: UserSubject[], b: UserSubject[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.id === b[i]?.id && s.slug === b[i]?.slug);
}

/** Keep opened notebooks visible across paginated list pages. */
export function usePinnedExplorerSubjects({
  subjects,
  notebookSlug,
  setPinnedExtra,
  markHydrated,
  treeMutationInFlightRef,
}: Args) {
  /** Avoid re-GETting the same pinned slug on every subjects refresh. */
  const fetchedSlugsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!notebookSlug) return;
    pushPinnedSlug(notebookSlug);
    // Allow one more attempt when navigating to this notebook.
    fetchedSlugsRef.current.delete(notebookSlug);
  }, [notebookSlug]);

  useEffect(() => {
    const slugs = readPinnedSlugs()
      .filter((s) => !subjects.some((nb) => nb.slug === s))
      .filter((s) => !fetchedSlugsRef.current.has(s));
    if (!slugs.length) return;

    let cancelled = false;
    Promise.all(
      slugs.slice(0, SIDEBAR_MAX_PINNED).map((slug) =>
        api.myContent
          .getSubject(slug)
          .then((r) => {
            fetchedSlugsRef.current.add(slug);
            return r.subject as UserSubject;
          })
          .catch(() => {
            fetchedSlugsRef.current.add(slug);
            removePinnedSlug(slug);
            return null;
          })
      )
    ).then((rows) => {
      if (cancelled || treeMutationInFlightRef.current) return;
      const incoming = applyPendingDeletesToSubjects(
        rows.filter((r): r is UserSubject => r != null)
      );
      if (!incoming.length) return;
      setPinnedExtra((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        for (const s of incoming) byId.set(s.id, s);
        const next = [...byId.values()];
        return sameSubjectIds(prev, next) ? prev : next;
      });
      for (const s of incoming) markHydrated(s.id, s.slug);
    });
    return () => {
      cancelled = true;
    };
  }, [subjects, markHydrated, setPinnedExtra, treeMutationInFlightRef]);
}
