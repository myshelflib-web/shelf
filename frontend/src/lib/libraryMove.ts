import {
  UserPageSummary,
  UserSubject,
  UserTopicGroup,
} from "@/types";
import {
  getNotebookPages,
  getTopicChildren,
  getTopicGroups,
} from "@/lib/myContentTree";

export type PageLocation = {
  subjectId: string | null;
  topicGroupId: string | null;
};

function findPageInGroups(
  groups: UserTopicGroup[],
  pageId: string,
  subjectId: string
): PageLocation | null {
  for (const group of groups) {
    for (const page of group.pages) {
      if (page.id === pageId) {
        return { subjectId, topicGroupId: group.id };
      }
    }
    const nested = findPageInGroups(
      getTopicChildren(group),
      pageId,
      subjectId
    );
    if (nested) return nested;
  }
  return null;
}

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
    const inGroups = findPageInGroups(
      getTopicGroups(subject),
      pageId,
      subject.id
    );
    if (inGroups) return inGroups;
  }
  return null;
}

function findTopicInGroups(
  groups: UserTopicGroup[],
  groupId: string
): UserTopicGroup | null {
  for (const group of groups) {
    if (group.id === groupId) return group;
    const nested = findTopicInGroups(getTopicChildren(group), groupId);
    if (nested) return nested;
  }
  return null;
}

export function findTopicLocation(
  subjects: UserSubject[],
  groupId: string
): { subjectId: string; group: UserTopicGroup } | null {
  for (const subject of subjects) {
    const group = findTopicInGroups(getTopicGroups(subject), groupId);
    if (group) return { subjectId: subject.id, group };
  }
  return null;
}

function stripPageFromGroups(
  groups: UserTopicGroup[],
  pageId: string
): { groups: UserTopicGroup[]; page: UserPageSummary | null } {
  let found: UserPageSummary | null = null;
  const next = groups.map((group) => {
    const pages = group.pages.filter((p) => {
      if (p.id === pageId) {
        found = p;
        return false;
      }
      return true;
    });
    const children = stripPageFromGroups(getTopicChildren(group), pageId);
    if (children.page) found = children.page;
    return { ...group, pages, children: children.groups };
  });
  return { groups: next, page: found };
}

function insertPageIntoGroups(
  groups: UserTopicGroup[],
  topicGroupId: string,
  pages: UserPageSummary[],
  insert: (pages: UserPageSummary[]) => UserPageSummary[]
): UserTopicGroup[] {
  return groups.map((group) => {
    if (group.id === topicGroupId) {
      return { ...group, pages: insert(group.pages) };
    }
    return {
      ...group,
      children: insertPageIntoGroups(
        getTopicChildren(group),
        topicGroupId,
        pages,
        insert
      ),
    };
  });
}

export function movePageInTree(
  subjects: UserSubject[],
  rootPages: UserPageSummary[],
  pageId: string,
  target: PageLocation & { page: UserPageSummary; beforePageId: string | null }
): { subjects: UserSubject[]; rootPages: UserPageSummary[] } {
  let page: UserPageSummary | null = null;

  const strippedSubjects = subjects.map((subject) => {
    const notebookPages = getNotebookPages(subject).filter((p) => {
      if (p.id === pageId) {
        page = p;
        return false;
      }
      return true;
    });
    const stripped = stripPageFromGroups(getTopicGroups(subject), pageId);
    if (stripped.page) page = stripped.page;
    return {
      ...subject,
      pages: notebookPages,
      topicGroups: stripped.groups,
    };
  });

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
        topicGroups: insertPageIntoGroups(
          getTopicGroups(subject),
          target.topicGroupId,
          [],
          (pages) => insertPages(pages, target.beforePageId)
        ),
      };
    }
    return {
      ...subject,
      pages: insertPages(getNotebookPages(subject), target.beforePageId),
    };
  });

  return { subjects: nextSubjects, rootPages: nextRoot };
}

function stripTopicFromGroups(
  groups: UserTopicGroup[],
  groupId: string
): { groups: UserTopicGroup[]; moving: UserTopicGroup | null } {
  let moving: UserTopicGroup | null = null;
  const next: UserTopicGroup[] = [];
  for (const group of groups) {
    if (group.id === groupId) {
      moving = group;
      continue;
    }
    const nested = stripTopicFromGroups(getTopicChildren(group), groupId);
    if (nested.moving) moving = nested.moving;
    next.push({ ...group, children: nested.groups });
  }
  return { groups: next, moving };
}

export function moveTopicInTree(
  subjects: UserSubject[],
  groupId: string,
  targetSubjectId: string,
  topicGroup: UserTopicGroup,
  beforeGroupId: string | null
): UserSubject[] {
  let moving: UserTopicGroup | null = null;

  const stripped = subjects.map((subject) => {
    const result = stripTopicFromGroups(getTopicGroups(subject), groupId);
    if (result.moving) moving = result.moving;
    return { ...subject, topicGroups: result.groups };
  });

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
