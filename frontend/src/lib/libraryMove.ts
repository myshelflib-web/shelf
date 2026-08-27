import {
  UserPageSummary,
  UserSubject,
  UserTopicGroup,
} from "@/types";
import { getNotebookPages, getTopicGroups } from "@/lib/myContentTree";

export type PageLocation = {
  subjectId: string | null;
  topicGroupId: string | null;
};

export function findPageLocation(
  subjects: UserSubject[],
  rootPages: UserPageSummary[],
  pageId: string
): PageLocation | null {
  for (const page of rootPages) {
    if (page.id === pageId) return { subjectId: null, topicGroupId: null };
  }
  for (const subject of subjects) {
    for (const page of getNotebookPages(subject)) {
      if (page.id === pageId) {
        return { subjectId: subject.id, topicGroupId: null };
      }
    }
    for (const group of getTopicGroups(subject)) {
      for (const page of group.pages) {
        if (page.id === pageId) {
          return { subjectId: subject.id, topicGroupId: group.id };
        }
      }
    }
  }
  return null;
}

export function findTopicLocation(
  subjects: UserSubject[],
  groupId: string
): { subjectId: string; group: UserTopicGroup } | null {
  for (const subject of subjects) {
    const group = getTopicGroups(subject).find((g) => g.id === groupId);
    if (group) return { subjectId: subject.id, group };
  }
  return null;
}

export function movePageInTree(
  subjects: UserSubject[],
  rootPages: UserPageSummary[],
  pageId: string,
  target: PageLocation & { page: UserPageSummary; beforePageId: string | null }
): { subjects: UserSubject[]; rootPages: UserPageSummary[] } {
  let page: UserPageSummary | null = null;

  const strippedSubjects = subjects.map((subject) => ({
    ...subject,
    pages: getNotebookPages(subject).filter((p) => {
      if (p.id === pageId) {
        page = p;
        return false;
      }
      return true;
    }),
    topicGroups: getTopicGroups(subject).map((group) => ({
      ...group,
      pages: group.pages.filter((p) => {
        if (p.id === pageId) {
          page = p;
          return false;
        }
        return true;
      }),
    })),
  }));

  let nextRoot = rootPages.filter((p) => {
    if (p.id === pageId) {
      page = p;
      return false;
    }
    return true;
  });

  if (!page) return { subjects, rootPages };

  const moved = target.page;

  const insertPages = (
    pages: UserPageSummary[],
    beforeId: string | null
  ): UserPageSummary[] => {
    if (!beforeId) return [...pages, moved];
    const idx = pages.findIndex((p) => p.id === beforeId);
    if (idx === -1) return [...pages, moved];
    return [...pages.slice(0, idx), moved, ...pages.slice(idx)];
  };

  if (!target.subjectId) {
    nextRoot = insertPages(nextRoot, target.beforePageId);
    return { subjects: strippedSubjects, rootPages: nextRoot };
  }

  const nextSubjects = strippedSubjects.map((subject) => {
    if (subject.id !== target.subjectId) return subject;
    if (target.topicGroupId) {
      return {
        ...subject,
        topicGroups: getTopicGroups(subject).map((group) => {
          if (group.id !== target.topicGroupId) return group;
          return {
            ...group,
            pages: insertPages(group.pages, target.beforePageId),
          };
        }),
      };
    }
    return {
      ...subject,
      pages: insertPages(getNotebookPages(subject), target.beforePageId),
    };
  });

  return { subjects: nextSubjects, rootPages: nextRoot };
}

export function moveTopicInTree(
  subjects: UserSubject[],
  groupId: string,
  targetSubjectId: string,
  topicGroup: UserTopicGroup,
  beforeGroupId: string | null
): UserSubject[] {
  let moving: UserTopicGroup | null = null;

  const stripped = subjects.map((subject) => ({
    ...subject,
    topicGroups: getTopicGroups(subject).filter((group) => {
      if (group.id === groupId) {
        moving = group;
        return false;
      }
      return true;
    }),
  }));

  const group = moving ?? topicGroup;

  const insertGroups = (
    groups: UserTopicGroup[],
    beforeId: string | null
  ): UserTopicGroup[] => {
    if (!beforeId) return [...groups, group];
    const idx = groups.findIndex((g) => g.id === beforeId);
    if (idx === -1) return [...groups, group];
    return [...groups.slice(0, idx), group, ...groups.slice(idx)];
  };

  return stripped.map((subject) => {
    if (subject.id !== targetSubjectId) return subject;
    return {
      ...subject,
      topicGroups: insertGroups(getTopicGroups(subject), beforeGroupId),
    };
  });
}
