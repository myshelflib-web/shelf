import type { UserSubject } from "@/types";

/** True when the subject payload includes nested folders/pages (not a list stub). */
export function subjectTreeLoaded(subject: UserSubject): boolean {
  return (
    (subject.topicGroups?.length ?? 0) > 0 || (subject.pages?.length ?? 0) > 0
  );
}

/**
 * When a slim list refresh arrives, keep trees already hydrated (or marked)
 * so expand state and deletes do not flicker empty.
 */
export function mergeListPreservingHydratedTrees(
  incoming: UserSubject[],
  previous: UserSubject[],
  hydratedIds: ReadonlySet<string>
): UserSubject[] {
  const prevById = new Map(previous.map((s) => [s.id, s]));
  return incoming.map((next) => {
    const prev = prevById.get(next.id);
    if (!prev) return next;
    if (subjectTreeLoaded(next)) return next;
    if (hydratedIds.has(next.id) || subjectTreeLoaded(prev)) {
      return {
        ...next,
        topicGroups: prev.topicGroups,
        pages: prev.pages,
      };
    }
    return next;
  });
}
