import { findTopicLocation } from "@/lib/libraryMove";
import { pageHref } from "@/lib/myContentTree";
import type { UserSubject } from "@/types";
import type { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import { scopeHref } from "@/components/my-content/reader/types";

/** Build reader scope/href after a page lands in a new explorer location. */
export function readerLocationAfterPageMove(
  subjects: UserSubject[],
  subjectId: string | null,
  topicGroupId: string | null,
  pageSlug: string
): { href: string; scope: PersonalPageReaderScope } {
  if (!subjectId) {
    const scope: PersonalPageReaderScope = {
      kind: "root-file",
      pageSlug,
    };
    return { href: scopeHref(scope), scope };
  }

  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) {
    const scope: PersonalPageReaderScope = {
      kind: "root-file",
      pageSlug,
    };
    return { href: pageHref(null, null, pageSlug), scope };
  }

  if (!topicGroupId) {
    const scope: PersonalPageReaderScope = {
      kind: "notebook-file",
      notebookSlug: subject.slug,
      pageSlug,
    };
    return { href: scopeHref(scope), scope };
  }

  const topic = findTopicLocation([subject], topicGroupId)?.group;
  if (!topic) {
    const scope: PersonalPageReaderScope = {
      kind: "notebook-file",
      notebookSlug: subject.slug,
      pageSlug,
    };
    return { href: scopeHref(scope), scope };
  }

  const scope: PersonalPageReaderScope = {
    kind: "topic",
    notebookSlug: subject.slug,
    topicSlug: topic.slug,
    pageSlug,
  };
  return { href: scopeHref(scope), scope };
}
