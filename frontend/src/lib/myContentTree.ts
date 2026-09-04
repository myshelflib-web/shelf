import { UserSubject, UserPageSummary, UserTopicGroup } from "@/types";

export function getTopicGroups(subject: UserSubject) {
  return subject.topicGroups ?? [];
}

export function getTopicChildren(group: UserTopicGroup): UserTopicGroup[] {
  return group.children ?? [];
}

/** Pages on the notebook with no topic */
export function getNotebookPages(subject: UserSubject): UserPageSummary[] {
  return subject.pages ?? [];
}

function countGroupPages(group: UserTopicGroup): number {
  return (
    group.pages.length +
    getTopicChildren(group).reduce((n, child) => n + countGroupPages(child), 0)
  );
}

export function countPages(subject: UserSubject): number {
  return (
    getTopicGroups(subject).reduce((n, g) => n + countGroupPages(g), 0) +
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

export type FlattenedPage = {
  page: UserPageSummary;
  topicSlug: string | null;
  topicTitle: string | null;
  notebookSlug: string | null;
  href: string;
};

function flattenGroupPages(
  subject: UserSubject,
  group: UserTopicGroup
): FlattenedPage[] {
  const own: FlattenedPage[] = group.pages.map((page) => ({
    page,
    topicSlug: group.slug,
    topicTitle: group.title,
    notebookSlug: subject.slug,
    href: pageHref(subject.slug, group.slug, page.slug),
  }));
  const nested = getTopicChildren(group).flatMap((child) =>
    flattenGroupPages(subject, child)
  );
  return [...own, ...nested];
}

export function flattenPages(subject: UserSubject): FlattenedPage[] {
  const fromTopics = getTopicGroups(subject).flatMap((group) =>
    flattenGroupPages(subject, group)
  );
  const loose: FlattenedPage[] = getNotebookPages(subject).map((page) => ({
    page,
    topicSlug: null,
    topicTitle: null,
    notebookSlug: subject.slug,
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

function insertPageIntoGroups(
  groups: UserTopicGroup[],
  page: UserPageSummary,
  topicId: string
): { groups: UserTopicGroup[]; inserted: boolean } {
  let inserted = false;
  const next = groups.map((group) => {
    if (group.id === topicId) {
      if (group.pages.some((p) => p.id === page.id)) {
        inserted = true;
        return group;
      }
      inserted = true;
      return { ...group, pages: [...group.pages, page] };
    }
    const children = getTopicChildren(group);
    if (children.length === 0) return group;
    const nested = insertPageIntoGroups(children, page, topicId);
    if (nested.inserted) {
      inserted = true;
      return { ...group, children: nested.groups };
    }
    return group;
  });
  return { groups: next, inserted };
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
      const { groups } = insertPageIntoGroups(
        getTopicGroups(notebook),
        page,
        topicId
      );
      return { ...notebook, topicGroups: groups };
    }
    const pages = getNotebookPages(notebook);
    if (pages.some((p) => p.id === page.id)) return notebook;
    return { ...notebook, pages: [...pages, page] };
  });
}

function insertTopicIntoGroups(
  groups: UserTopicGroup[],
  topic: UserTopicGroup,
  parentTopicId: string
): { groups: UserTopicGroup[]; inserted: boolean } {
  let inserted = false;
  const next = groups.map((group) => {
    if (group.id === parentTopicId) {
      const children = getTopicChildren(group);
      if (children.some((c) => c.id === topic.id)) {
        inserted = true;
        return group;
      }
      inserted = true;
      return {
        ...group,
        children: [...children, { ...topic, pages: topic.pages ?? [], children: topic.children ?? [] }],
      };
    }
    const children = getTopicChildren(group);
    if (children.length === 0) return group;
    const nested = insertTopicIntoGroups(children, topic, parentTopicId);
    if (nested.inserted) {
      inserted = true;
      return { ...group, children: nested.groups };
    }
    return group;
  });
  return { groups: next, inserted };
}

export function insertTopicInTree(
  subjects: UserSubject[],
  notebookId: string,
  topic: UserTopicGroup,
  parentTopicId?: string | null
): UserSubject[] {
  return subjects.map((notebook) => {
    if (notebook.id !== notebookId) return notebook;
    if (parentTopicId) {
      const { groups } = insertTopicIntoGroups(
        getTopicGroups(notebook),
        topic,
        parentTopicId
      );
      return { ...notebook, topicGroups: groups };
    }
    const groups = getTopicGroups(notebook);
    if (groups.some((g) => g.id === topic.id)) return notebook;
    return {
      ...notebook,
      topicGroups: [
        ...groups,
        { ...topic, pages: topic.pages ?? [], children: topic.children ?? [] },
      ],
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

function syncPageInGroups(
  groups: UserTopicGroup[],
  pageId: string,
  patch: Partial<UserPageSummary>
): UserTopicGroup[] {
  return groups.map((group) => ({
    ...group,
    pages: group.pages.map((page) =>
      page.id === pageId ? { ...page, ...patch } : page
    ),
    children: syncPageInGroups(getTopicChildren(group), pageId, patch),
  }));
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
    topicGroups: syncPageInGroups(getTopicGroups(notebook), pageId, patch),
  }));
}

function filterGroupsForBulkDelete(
  groups: UserTopicGroup[],
  subjectId: string,
  topicGroupKeys: Set<string>,
  pageIdSet: Set<string>
): UserTopicGroup[] {
  return groups
    .filter((group) => !topicGroupKeys.has(`${subjectId}:${group.id}`))
    .map((group) => ({
      ...group,
      pages: group.pages.filter((page) => !pageIdSet.has(page.id)),
      children: filterGroupsForBulkDelete(
        getTopicChildren(group),
        subjectId,
        topicGroupKeys,
        pageIdSet
      ),
    }));
}

/** Used by explorer bulk-delete optimistic updates for nested folders. */
export function filterTopicGroupsAfterBulkDelete(
  subject: UserSubject,
  topicGroupKeys: Set<string>,
  pageIdSet: Set<string>
): UserTopicGroup[] {
  return filterGroupsForBulkDelete(
    getTopicGroups(subject),
    subject.id,
    topicGroupKeys,
    pageIdSet
  );
}
