"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { api, ApiError } from "@/lib/api";
import {
  findPageLocation,
  findTopicLocation,
  movePageInTree,
  moveTopicInTree,
  topicContainsId,
} from "@/lib/libraryMove";
import {
  ensureSubjectsForPageMove,
  ensureSubjectsForTopicMove,
} from "@/lib/explorerMovePrepare";
import {
  pageSelectionKey,
  topicSelectionKey,
} from "@/lib/explorerSelection";
import { useDeleteProgress } from "@/components/DeleteProgressProvider";
import { useAppDialog } from "@/hooks/useAppDialog";
import { getTopicGroups, syncPageInTree, syncRootPages } from "@/lib/myContentTree";
import { syncLibraryCacheTrees } from "@/lib/offline/library";
import { emitPageMoved } from "@/lib/contentEvents";
import { readerLocationAfterPageMove } from "@/lib/pageMoveLocation";

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
  markHydrated: (id: string, slug?: string) => void;
  invalidateHydrate: (slug: string) => void;
  /** While true, pinned refetch must not clobber optimistic trees. */
  treeMutationInFlightRef: MutableRefObject<boolean>;
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

function rememberHydrated(
  rows: UserSubject[],
  markHydrated: (id: string, slug?: string) => void,
  invalidateHydrate: (slug: string) => void
) {
  for (const s of rows) {
    markHydrated(s.id, s.slug);
    invalidateHydrate(s.slug);
  }
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
  markHydrated,
  invalidateHydrate,
  treeMutationInFlightRef,
}: UseExplorerMovesArgs) {
  const { alert } = useAppDialog();
  const progress = useDeleteProgress();

  const expandTarget = useCallback(
    (working: UserSubject[], subjectId: string | null, topicGroupId: string | null) => {
      if (!subjectId) return;
      const target =
        working.find((s) => s.id === subjectId) ??
        [...treeSubjects, ...pinnedExtra].find((s) => s.id === subjectId);
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
    async (payload: {
      pageId: string;
      subjectId: string | null;
      topicGroupId: string | null;
      beforePageId: string | null;
    }) => {
      if (payload.beforePageId === payload.pageId) return;

      treeMutationInFlightRef.current = true;
      const keys = [pageSelectionKey(payload.pageId)];
      let jobId: string | null = null;

      try {
        const prepared = await ensureSubjectsForPageMove(
          treeSubjects,
          payload.subjectId,
          payload.topicGroupId
        );
        const working = prepared.subjects;
        const subjectIds = new Set(subjects.map((s) => s.id));
        rememberHydrated(prepared.hydrated, markHydrated, invalidateHydrate);
        if (prepared.hydrated.length > 0) {
          applyMovedTree(working, subjectIds, setSubjects, setPinnedExtra);
        }

        const page = findPageSummary(rootPages, working, payload.pageId);
        if (!page) return;

        const fromLoc = findPageLocation(working, rootPages, payload.pageId);

        jobId = progress.start(`Moving "${page.title}"…`, keys);
        const prevSubjects = subjects;
        const prevPinned = pinnedExtra;
        const prevRoot = rootPages;

        const next = movePageInTree(working, rootPages, payload.pageId, {
          ...payload,
          page,
        });

        const landed = findPageLocation(
          next.subjects,
          next.rootPages,
          payload.pageId
        );
        if (
          !landed ||
          landed.subjectId !== payload.subjectId ||
          landed.topicGroupId !== payload.topicGroupId
        ) {
          await alert({
            title: "Move failed",
            message: `Could not place "${page.title}" in the destination folder. Try expanding the folder, then move again.`,
          });
          return;
        }

        const touched = [fromLoc?.subjectId, payload.subjectId]
          .filter((id): id is string => Boolean(id))
          .map((id) => next.subjects.find((s) => s.id === id))
          .filter((s): s is UserSubject => Boolean(s));
        rememberHydrated(touched, markHydrated, invalidateHydrate);

        setRootPages(next.rootPages);
        applyMovedTree(next.subjects, subjectIds, setSubjects, setPinnedExtra);
        expandTarget(next.subjects, payload.subjectId, payload.topicGroupId);

        try {
          const moved = await api.myContent.movePage(payload.pageId, {
            subjectId: payload.subjectId,
            topicGroupId: payload.topicGroupId,
            beforePageId: payload.beforePageId,
          });
          const serverPage = moved.page;
          let finalSubjects = next.subjects;
          let finalRoot = next.rootPages;
          if (serverPage.slug !== page.slug || serverPage.title !== page.title) {
            const patch = {
              slug: serverPage.slug,
              title: serverPage.title,
            };
            finalSubjects = syncPageInTree(next.subjects, payload.pageId, patch);
            finalRoot = syncRootPages(next.rootPages, payload.pageId, patch);
            applyMovedTree(
              finalSubjects,
              subjectIds,
              setSubjects,
              setPinnedExtra
            );
            setRootPages(finalRoot);
          }
          syncLibraryCacheTrees(finalSubjects, finalRoot);
          const loc = readerLocationAfterPageMove(
            finalSubjects,
            payload.subjectId,
            payload.topicGroupId,
            serverPage.slug
          );
          emitPageMoved({
            pageId: payload.pageId,
            title: serverPage.title,
            slug: serverPage.slug,
            href: loc.href,
            scope: loc.scope,
          });
        } catch (err) {
          setSubjects(prevSubjects);
          setPinnedExtra(prevPinned);
          setRootPages(prevRoot);
          const detail =
            err instanceof ApiError && err.message
              ? err.message
              : `Could not move "${page.title}". It was put back where it was.`;
          await alert({
            title: "Move failed",
            message: detail,
          });
        }
      } finally {
        treeMutationInFlightRef.current = false;
        if (jobId) progress.finish(jobId, keys);
      }
    },
    [
      alert,
      expandTarget,
      invalidateHydrate,
      markHydrated,
      pinnedExtra,
      progress,
      rootPages,
      setPinnedExtra,
      setRootPages,
      setSubjects,
      subjects,
      treeMutationInFlightRef,
      treeSubjects,
    ]
  );

  const handleMoveTopic = useCallback(
    async (payload: {
      groupId: string;
      sourceSubjectId: string;
      targetSubjectId: string;
      targetParentId: string | null;
      beforeGroupId: string | null;
    }) => {
      if (payload.targetParentId === payload.groupId) return;

      treeMutationInFlightRef.current = true;
      const keys = [
        topicSelectionKey(payload.sourceSubjectId, payload.groupId),
        topicSelectionKey(payload.targetSubjectId, payload.groupId),
      ];
      let jobId: string | null = null;

      try {
        const prepared = await ensureSubjectsForTopicMove(
          treeSubjects,
          payload.targetSubjectId,
          payload.targetParentId
        );
        const working = prepared.subjects;
        const subjectIds = new Set(subjects.map((s) => s.id));
        rememberHydrated(prepared.hydrated, markHydrated, invalidateHydrate);
        if (prepared.hydrated.length > 0) {
          applyMovedTree(working, subjectIds, setSubjects, setPinnedExtra);
        }

        const loc =
          findTopicLocation(working, payload.groupId) ??
          findTopicLocation(pinnedExtra, payload.groupId);
        if (!loc) return;
        if (
          payload.targetParentId &&
          topicContainsId(loc.group, payload.targetParentId)
        ) {
          await alert({
            title: "Move failed",
            message: `Cannot move folder "${loc.group.title}" into its own subfolder.`,
          });
          return;
        }

        jobId = progress.start(`Moving folder "${loc.group.title}"…`, keys);
        const prevSubjects = subjects;
        const prevPinned = pinnedExtra;

        const next = moveTopicInTree(
          working,
          payload.groupId,
          payload.targetSubjectId,
          loc.group,
          payload.beforeGroupId,
          payload.targetParentId
        );

        const landed = findTopicLocation(next, payload.groupId);
        if (!landed || landed.subjectId !== payload.targetSubjectId) {
          await alert({
            title: "Move failed",
            message: `Could not place folder "${loc.group.title}" in the destination. Try expanding the folder, then move again.`,
          });
          return;
        }

        rememberHydrated(
          [payload.sourceSubjectId, payload.targetSubjectId]
            .map((id) => next.find((s) => s.id === id))
            .filter((s): s is UserSubject => Boolean(s)),
          markHydrated,
          invalidateHydrate
        );

        applyMovedTree(next, subjectIds, setSubjects, setPinnedExtra);

        const nestId =
          payload.targetParentId &&
          payload.targetParentId !== payload.targetSubjectId
            ? payload.targetParentId
            : null;
        expandTarget(next, payload.targetSubjectId, nestId);

        try {
          await api.myContent.moveTopicGroup(
            payload.sourceSubjectId,
            payload.groupId,
            {
              targetSubjectId: payload.targetSubjectId,
              targetParentId: payload.targetParentId,
              beforeGroupId: payload.beforeGroupId,
            }
          );
          syncLibraryCacheTrees(next, rootPages);
        } catch {
          setSubjects(prevSubjects);
          setPinnedExtra(prevPinned);
          await alert({
            title: "Move failed",
            message: `Could not move folder "${loc.group.title}". It was put back where it was.`,
          });
        }
      } finally {
        treeMutationInFlightRef.current = false;
        if (jobId) progress.finish(jobId, keys);
      }
    },
    [
      alert,
      expandTarget,
      invalidateHydrate,
      markHydrated,
      pinnedExtra,
      progress,
      rootPages,
      setPinnedExtra,
      setSubjects,
      subjects,
      treeMutationInFlightRef,
      treeSubjects,
    ]
  );

  return { handleMovePage, handleMoveTopic };
}
