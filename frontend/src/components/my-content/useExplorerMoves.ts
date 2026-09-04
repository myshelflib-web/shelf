"use client";

import {
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { api } from "@/lib/api";
import {
  findTopicLocation,
  movePageInTree,
  moveTopicInTree,
  topicContainsId,
} from "@/lib/libraryMove";
import {
  pageSelectionKey,
  topicSelectionKey,
} from "@/lib/explorerSelection";
import {
  useDeleteProgress,
} from "@/components/DeleteProgressProvider";
import { useAppDialog } from "@/hooks/useAppDialog";
import { getTopicGroups } from "@/lib/myContentTree";

type UseExplorerMovesArgs = {
  subjects: UserSubject[];
  pinnedExtra: UserSubject[];
  rootPages: UserPageSummary[];
  treeSubjects: UserSubject[];
  setSubjects: Dispatch<SetStateAction<UserSubject[]>>;
  setPinnedExtra: Dispatch<SetStateAction<UserSubject[]>>;
  setRootPages: Dispatch<SetStateAction<UserPageSummary[]>>;
  setExpandedNotebooks: Dispatch<SetStateAction<Record<string, boolean>>>;
  setExpandedTopics: Dispatch<SetStateAction<Record<string, boolean>>>;
};

function findPageSummary(
  rootPages: UserPageSummary[],
  treeSubjects: UserSubject[],
  pageId: string
): UserPageSummary | null {
  for (const page of rootPages) {
    if (page.id === pageId) return page;
  }
  const walk = (groups: UserTopicGroup[]): UserPageSummary | null => {
    for (const group of groups) {
      for (const page of group.pages) {
        if (page.id === pageId) return page;
      }
      const nested = walk(group.children ?? []);
      if (nested) return nested;
    }
    return null;
  };
  for (const subject of treeSubjects) {
    for (const page of subject.pages ?? []) {
      if (page.id === pageId) return page;
    }
    const found = walk(subject.topicGroups ?? []);
    if (found) return found;
  }
  return null;
}

function applyMovedTree(
  nextSubjects: UserSubject[],
  currentSubjectIds: Set<string>,
  setSubjects: Dispatch<SetStateAction<UserSubject[]>>,
  setPinnedExtra: Dispatch<SetStateAction<UserSubject[]>>
) {
  setSubjects((prev) =>
    prev.map((s) => nextSubjects.find((n) => n.id === s.id) ?? s)
  );
  setPinnedExtra((prev) => {
    const mapped = prev.map(
      (s) => nextSubjects.find((n) => n.id === s.id) ?? s
    );
    const have = new Set([...mapped.map((s) => s.id), ...currentSubjectIds]);
    const missing = nextSubjects.filter((s) => !have.has(s.id));
    return missing.length > 0 ? [...mapped, ...missing] : mapped;
  });
}

function findGroupById(
  groups: UserTopicGroup[],
  id: string
): UserTopicGroup | undefined {
  for (const group of groups) {
    if (group.id === id) return group;
    const nested = findGroupById(group.children ?? [], id);
    if (nested) return nested;
  }
  return undefined;
}

export function useExplorerMoves({
  subjects,
  pinnedExtra,
  rootPages,
  treeSubjects,
  setSubjects,
  setPinnedExtra,
  setRootPages,
  setExpandedNotebooks,
  setExpandedTopics,
}: UseExplorerMovesArgs) {
  const { alert } = useAppDialog();
  const progress = useDeleteProgress();

  const expandTarget = useCallback(
    (subjectId: string | null, topicGroupId: string | null) => {
      if (!subjectId) return;
      const combined = [...treeSubjects, ...pinnedExtra];
      const target = combined.find((s) => s.id === subjectId);
      if (!target) return;
      setExpandedNotebooks((prev) => ({ ...prev, [target.slug]: true }));
      if (!topicGroupId) return;
      const group = findGroupById(getTopicGroups(target), topicGroupId);
      if (group) {
        setExpandedTopics((prev) => ({
          ...prev,
          [`${target.slug}:${group.slug}`]: true,
        }));
      }
    },
    [pinnedExtra, setExpandedNotebooks, setExpandedTopics, treeSubjects]
  );

  const handleMovePage = useCallback(
    (payload: {
      pageId: string;
      subjectId: string | null;
      topicGroupId: string | null;
      beforePageId: string | null;
    }) => {
      const page = findPageSummary(rootPages, treeSubjects, payload.pageId);
      if (!page) return;
      if (payload.beforePageId === payload.pageId) return;

      const prevSubjects = subjects;
      const prevPinned = pinnedExtra;
      const prevRoot = rootPages;
      const subjectIds = new Set(subjects.map((s) => s.id));

      const next = movePageInTree(treeSubjects, rootPages, payload.pageId, {
        ...payload,
        page,
      });

      setRootPages(next.rootPages);
      applyMovedTree(next.subjects, subjectIds, setSubjects, setPinnedExtra);
      expandTarget(payload.subjectId, payload.topicGroupId);

      const keys = [pageSelectionKey(payload.pageId)];
      const jobId = progress.start(`Moving "${page.title}"…`, keys);
      void api.myContent
        .movePage(payload.pageId, {
          subjectId: payload.subjectId,
          topicGroupId: payload.topicGroupId,
          beforePageId: payload.beforePageId,
        })
        .catch(async () => {
          setSubjects(prevSubjects);
          setPinnedExtra(prevPinned);
          setRootPages(prevRoot);
          await alert({
            title: "Move failed",
            message: `Could not move "${page.title}". It was put back where it was.`,
          });
        })
        .finally(() => {
          progress.finish(jobId, keys);
        });
    },
    [
      alert,
      expandTarget,
      pinnedExtra,
      progress,
      rootPages,
      setPinnedExtra,
      setRootPages,
      setSubjects,
      subjects,
      treeSubjects,
    ]
  );

  const handleMoveTopic = useCallback(
    (payload: {
      groupId: string;
      sourceSubjectId: string;
      targetSubjectId: string;
      targetParentId: string | null;
      beforeGroupId: string | null;
    }) => {
      const loc =
        findTopicLocation(treeSubjects, payload.groupId) ??
        findTopicLocation(pinnedExtra, payload.groupId);
      if (!loc) return;
      if (payload.targetParentId === payload.groupId) return;
      if (
        payload.targetParentId &&
        topicContainsId(loc.group, payload.targetParentId)
      ) {
        void alert({
          title: "Move failed",
          message: `Cannot move folder "${loc.group.title}" into its own subfolder.`,
        });
        return;
      }

      const prevSubjects = subjects;
      const prevPinned = pinnedExtra;
      const subjectIds = new Set(subjects.map((s) => s.id));

      const next = moveTopicInTree(
        treeSubjects,
        payload.groupId,
        payload.targetSubjectId,
        loc.group,
        payload.beforeGroupId,
        payload.targetParentId
      );

      applyMovedTree(next, subjectIds, setSubjects, setPinnedExtra);

      const nestId =
        payload.targetParentId &&
        payload.targetParentId !== payload.targetSubjectId
          ? payload.targetParentId
          : null;
      expandTarget(payload.targetSubjectId, nestId);

      const keys = [
        topicSelectionKey(payload.sourceSubjectId, payload.groupId),
        topicSelectionKey(payload.targetSubjectId, payload.groupId),
      ];
      const jobId = progress.start(
        `Moving folder "${loc.group.title}"…`,
        keys
      );
      void api.myContent
        .moveTopicGroup(payload.sourceSubjectId, payload.groupId, {
          targetSubjectId: payload.targetSubjectId,
          targetParentId: payload.targetParentId,
          beforeGroupId: payload.beforeGroupId,
        })
        .catch(async () => {
          setSubjects(prevSubjects);
          setPinnedExtra(prevPinned);
          await alert({
            title: "Move failed",
            message: `Could not move folder "${loc.group.title}". It was put back where it was.`,
          });
        })
        .finally(() => {
          progress.finish(jobId, keys);
        });
    },
    [
      alert,
      expandTarget,
      pinnedExtra,
      progress,
      setPinnedExtra,
      setSubjects,
      subjects,
      treeSubjects,
    ]
  );

  return { handleMovePage, handleMoveTopic };
}
