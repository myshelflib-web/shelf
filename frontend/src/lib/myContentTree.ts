import { UserSubject, UserPageSummary, UserTopicGroup } from "@/types";

export function getTopicGroups(subject: UserSubject) {
  return subject.topicGroups ?? [];
}

/** Pages on the notebook with no topic */
export function getNotebookPages(subject: UserSubject): UserPageSummary[] {
  return subject.pages ?? [];
}

export function countPages(subject: UserSubject): number {
  return (
    getTopicGroups(subject).reduce((n, g) => n + g.pages.length, 0) +
    getNotebookPages(subject).length
  );
}

/** Reader URL for a page at root, notebook, or topic scope. */
export function pageHref(
  notebookSlug: string | null | undefined,
  topicSlug: string | null | undefined,
  pageSlug: string
): string {
  if (!notebookSlug) return `/my-content/file/${pageSlug}`;
  if (!topicSlug) return `/my-content/${notebookSlug}/file/${pageSlug}`;
  return `/my-content/${notebookSlug}/${topicSlug}/${pageSlug}`;
}

export function flattenPages(subject: UserSubject) {
  const fromTopics = getTopicGroups(subject).flatMap((group) =>
    group.pages.map((page) => ({
      page,
      topicSlug: group.slug as string | null,
      topicTitle: group.title as string | null,
      notebookSlug: subject.slug as string | null,
      href: pageHref(subject.slug, group.slug, page.slug),
    }))
  );
  const loose = getNotebookPages(subject).map((page) => ({
    page,
    topicSlug: null as string | null,
    topicTitle: null as string | null,
    notebookSlug: subject.slug as string | null,
    href: pageHref(subject.slug, null, page.slug),
  }));
  return [...loose, ...fromTopics];
}

export function findNotebook(
  subjects: UserSubject[],
  notebookSlug: string
): UserSubject | undefined {
  return subjects.find((s) => s.slug === notebookSlug);
}

export function insertPageInTree(
  subjects: UserSubject[],
  page: UserPageSummary,
  notebookId?: string,
  topicId?: string
): UserSubject[] {
  if (!notebookId) return subjects;
  return subjects.map((notebook) => {
    if (notebook.id !== notebookId) return notebook;
    if (topicId) {
      return {
        ...notebook,
        topicGroups: getTopicGroups(notebook).map((group) => {
          if (group.id !== topicId) return group;
          if (group.pages.some((p) => p.id === page.id)) return group;
          return { ...group, pages: [...group.pages, page] };
        }),
      };
    }
    const pages = getNotebookPages(notebook);
    if (pages.some((p) => p.id === page.id)) return notebook;
    return { ...notebook, pages: [...pages, page] };
  });
}

export function insertTopicInTree(
  subjects: UserSubject[],
  notebookId: string,
  topic: UserTopicGroup
): UserSubject[] {
  return subjects.map((notebook) => {
    if (notebook.id !== notebookId) return notebook;
    const groups = getTopicGroups(notebook);
    if (groups.some((g) => g.id === topic.id)) return notebook;
    return {
      ...notebook,
      topicGroups: [...groups, { ...topic, pages: topic.pages ?? [] }],
    };
  });
}

export function syncRootPages(
  pages: UserPageSummary[],
  pageId: string,
  patch: Partial<UserPageSummary>
): UserPageSummary[] {
  return pages.map((page) =>
    page.id === pageId ? { ...page, ...patch } : page
  );
}

export function syncPageInTree(
  subjects: UserSubject[],
  pageId: string,
  patch: Partial<UserPageSummary>
): UserSubject[] {
  return subjects.map((notebook) => ({
    ...notebook,
    pages: getNotebookPages(notebook).map((page) =>
      page.id === pageId ? { ...page, ...patch } : page
    ),
    topicGroups: getTopicGroups(notebook).map((group) => ({
      ...group,
      pages: group.pages.map((page) =>
        page.id === pageId ? { ...page, ...patch } : page
      ),
    })),
  }));
}
