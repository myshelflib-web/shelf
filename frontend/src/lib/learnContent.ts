import { PersonalPageReaderScope } from "@/components/my-content/reader/types";

export function learnHref(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
): string {
  return `/learn/${subjectSlug}/${topicSlug}/${articleSlug}`;
}

export function learnScope(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
): Extract<PersonalPageReaderScope, { kind: "learn" }> {
  return {
    kind: "learn",
    subjectSlug,
    topicSlug,
    articleSlug,
  };
}

export function isLearnReaderHref(href: string): boolean {
  return Boolean(href.match(/^\/learn\/[^/]+\/[^/]+\/[^/]+$/));
}

export function isCurriculumScope(
  scope: PersonalPageReaderScope
): scope is Extract<PersonalPageReaderScope, { kind: "learn" }> {
  return scope.kind === "learn";
}
