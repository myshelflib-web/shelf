import { applyPendingDeletesToSubjects } from "@/lib/pendingExplorerDeletes";
import { subjectTreeLoaded } from "@/lib/libraryTreeMerge";
import type { UserSubject } from "@/types";

/**
 * Preserve API (sorted) page order; append pinned/open folders that aren't on
 * this page so they stay reachable without jumping the sort.
 */
export function mergeExplorerSubjectsForDisplay(
  subjects: UserSubject[],
  pinnedExtra: UserSubject[],
  notebook?: UserSubject | null
): UserSubject[] {
  const byId = new Map<string, UserSubject>();
  const ordered: UserSubject[] = [];
  const pageSubjects = applyPendingDeletesToSubjects(subjects);
  const pinned = applyPendingDeletesToSubjects([
    ...pinnedExtra,
    ...(notebook ? [notebook] : []),
  ]);
  for (const nb of pageSubjects) {
    const richer =
      pinned.find((p) => p.id === nb.id && subjectTreeLoaded(p)) ?? nb;
    byId.set(richer.id, richer);
    ordered.push(richer);
  }
  for (const nb of pinned) {
    if (byId.has(nb.id)) continue;
    byId.set(nb.id, nb);
    ordered.push(nb);
  }
  return ordered;
}
