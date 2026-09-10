"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { NotebookSort, UserPageSummary, UserSubject } from "@/types";
import { api, ApiError } from "@/lib/api";
import {
  listSubjects,
  loadCachedLibraryForPaint,
  peekCachedLibrary,
} from "@/lib/offline/library";
import { mergeExplorerTreeWithPending } from "@/lib/pendingExplorerDeletes";
import { mergeListPreservingHydratedTrees, subjectTreeLoaded } from "@/lib/libraryTreeMerge";
import { applyExplorerContentChange } from "@/lib/explorerContentChange";
import {
  SHELF_CONTENT_CHANGED,
  contentChangeFromEvent,
} from "@/lib/contentEvents";
import { removePinnedSlug } from "@/lib/myContentSidebarPrefs";

const SIDEBAR_NOTEBOOK_PAGE_SIZE = 15;

type UseMyContentSidebarLibraryArgs = {
  notebookPage: number;
  sort: NotebookSort;
  searching: boolean;
  debouncedQ: string;
  notebookSlug?: string;
  setExpandedNotebooks: Dispatch<SetStateAction<Record<string, boolean>>>;
  setExpandedTopics: Dispatch<SetStateAction<Record<string, boolean>>>;
};

export function useMyContentSidebarLibrary({
  notebookPage,
  sort,
  searching,
  debouncedQ,
  notebookSlug,
  setExpandedNotebooks,
  setExpandedTopics,
}: UseMyContentSidebarLibraryArgs) {
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [rootPages, setRootPages] = useState<UserPageSummary[]>([]);
  const [pinnedExtra, setPinnedExtra] = useState<UserSubject[]>([]);
  const [totalNotebooks, setTotalNotebooks] = useState(0);
  const [totalNotebookPages, setTotalNotebookPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hydratingSlugs, setHydratingSlugs] = useState<Set<string>>(
    () => new Set()
  );

  const loadGen = useRef(0);
  const hydrateGen = useRef(new Map<string, number>());
  const hydratedIdsRef = useRef(new Set<string>());
  const hydratedSlugsRef = useRef(new Set<string>());
  /** Slugs that 404'd — do not re-request until navigation clears them. */
  const missingSlugsRef = useRef(new Set<string>());
  const hydratingSlugsRef = useRef(new Set<string>());
  const subjectsRef = useRef(subjects);
  subjectsRef.current = subjects;

  const applyList = useCallback(
    (
      nextSubjects: UserSubject[],
      nextRoot: UserPageSummary[],
      meta?: { total?: number; totalPages?: number }
    ) => {
      const mergedPending = mergeExplorerTreeWithPending(
        nextSubjects,
        nextRoot
      );
      const mergedTrees = mergeListPreservingHydratedTrees(
        mergedPending.subjects,
        subjectsRef.current,
        hydratedIdsRef.current
      );
      for (const s of mergedTrees) {
        if ((s.topicGroups?.length ?? 0) > 0 || (s.pages?.length ?? 0) > 0) {
          hydratedIdsRef.current.add(s.id);
          hydratedSlugsRef.current.add(s.slug);
        }
      }
      setSubjects(mergedTrees);
      setRootPages((prev) => {
        const server = mergedPending.rootPages;
        const serverIds = new Set(server.map((p) => p.id));
        const extras = prev.filter((p) => !serverIds.has(p.id));
        return extras.length ? [...extras, ...server] : server;
      });
      if (meta?.total != null) setTotalNotebooks(meta.total);
      if (meta?.totalPages != null) {
        setTotalNotebookPages(Math.max(1, meta.totalPages));
      }
    },
    []
  );

  const load = useCallback(
    (opts?: { silent?: boolean }) => {
      const gen = ++loadGen.current;
      const silent = Boolean(opts?.silent);
      const pageSize = SIDEBAR_NOTEBOOK_PAGE_SIZE;

      if (!silent && !searching) {
        const paintOpts = { sort, page: notebookPage };
        const mem = peekCachedLibrary(paintOpts);
        if (mem) {
          applyList(mem.subjects, mem.rootPages ?? [], {
            total: mem.total,
            totalPages: mem.totalPages,
          });
          setLoading(false);
        } else if (subjectsRef.current.length === 0) {
          setLoading(true);
          void loadCachedLibraryForPaint(paintOpts).then((cached) => {
            if (gen !== loadGen.current || !cached) return;
            applyList(cached.subjects, cached.rootPages ?? [], {
              total: cached.total,
              totalPages: cached.totalPages,
            });
            setLoading(false);
          });
        }
        // Sort/page change with data on screen: keep current rows until network returns.
      } else if (!silent) {
        setLoading(true);
      }

      void listSubjects({
        page: searching ? 1 : notebookPage,
        pageSize,
        sort,
        q: searching ? debouncedQ : undefined,
        tree: searching,
      })
        .then((res) => {
          if (gen !== loadGen.current) return;
          applyList(res.subjects, res.rootPages ?? [], {
            total: res.total,
            totalPages: res.totalPages,
          });
        })
        .catch(() => {
          if (gen !== loadGen.current || silent) return;
          if (!peekCachedLibrary()) {
            setSubjects([]);
            setRootPages([]);
            setTotalNotebooks(0);
            setTotalNotebookPages(1);
          }
        })
        .finally(() => {
          if (gen === loadGen.current) setLoading(false);
        });
    },
    [notebookPage, sort, searching, debouncedQ, applyList]
  );

  const hydrateSubject = useCallback(async (slug: string) => {
    if (!slug) return;
    if (missingSlugsRef.current.has(slug)) return;
    if (hydratingSlugsRef.current.has(slug)) return;
    const gen = (hydrateGen.current.get(slug) ?? 0) + 1;
    hydrateGen.current.set(slug, gen);
    hydratingSlugsRef.current.add(slug);
    setHydratingSlugs((prev) => new Set(prev).add(slug));
    try {
      const { subject } = await api.myContent.getSubject(slug);
      if (hydrateGen.current.get(slug) !== gen) return;
      missingSlugsRef.current.delete(slug);
      hydratedIdsRef.current.add(subject.id);
      hydratedSlugsRef.current.add(subject.slug);
      const patch = (prev: UserSubject[]) => {
        const merged = mergeExplorerTreeWithPending([subject], []).subjects[0];
        if (!merged) {
          if (!prev.some((s) => s.slug === slug)) return prev;
          return prev.filter((s) => s.slug !== slug);
        }
        const idx = prev.findIndex((s) => s.id === merged.id || s.slug === slug);
        if (idx < 0) return [...prev, merged];
        const next = prev.slice();
        next[idx] = merged;
        return next;
      };
      setSubjects(patch);
      setPinnedExtra(patch);
    } catch (err) {
      if (hydrateGen.current.get(slug) !== gen) return;
      if (err instanceof ApiError && err.status === 404) {
        missingSlugsRef.current.add(slug);
        removePinnedSlug(slug);
        setSubjects((prev) => {
          if (!prev.some((s) => s.slug === slug)) return prev;
          return prev.filter((s) => s.slug !== slug);
        });
        setPinnedExtra((prev) => {
          if (!prev.some((s) => s.slug === slug)) return prev;
          return prev.filter((s) => s.slug !== slug);
        });
        setExpandedNotebooks((prev) => {
          if (!prev[slug]) return prev;
          const next = { ...prev };
          delete next[slug];
          return next;
        });
      }
    } finally {
      hydratingSlugsRef.current.delete(slug);
      if (hydrateGen.current.get(slug) === gen) {
        setHydratingSlugs((prev) => {
          if (!prev.has(slug)) return prev;
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      }
    }
  }, [setExpandedNotebooks]);

  useEffect(() => {
    load();
    const onChange = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (change?.type === "page-created") {
        // Drop in-flight list responses that started before this insert so they
        // cannot wipe the optimistic explorer row.
        loadGen.current += 1;
        if (change.notebookSlug) {
          hydrateGen.current.set(
            change.notebookSlug,
            (hydrateGen.current.get(change.notebookSlug) ?? 0) + 1
          );
          hydratingSlugsRef.current.delete(change.notebookSlug);
        }
      }
      applyExplorerContentChange(change, {
        setSubjects,
        setPinnedExtra,
        setRootPages,
        setExpandedNotebooks,
        setExpandedTopics,
        setTotalNotebooks,
        reloadSilent: () => load({ silent: true }),
      });
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(SHELF_CONTENT_CHANGED, onChange);
  }, [load, setExpandedNotebooks, setExpandedTopics]);

  /** Clear missing-slug block when the route notebook changes. */
  useEffect(() => {
    if (!notebookSlug) return;
    missingSlugsRef.current.delete(notebookSlug);
  }, [notebookSlug]);

  /** Auto-expand current notebook: ensure its tree is loaded. */
  useEffect(() => {
    if (!notebookSlug) return;
    if (missingSlugsRef.current.has(notebookSlug)) return;
    if (hydratingSlugsRef.current.has(notebookSlug)) return;
    const nb =
      subjectsRef.current.find((s) => s.slug === notebookSlug) ??
      pinnedExtra.find((s) => s.slug === notebookSlug);
    if (!nb) {
      void hydrateSubject(notebookSlug);
      return;
    }
    if (
      !hydratedSlugsRef.current.has(notebookSlug) &&
      !hydratedIdsRef.current.has(nb.id) &&
      !(nb.topicGroups?.length || nb.pages?.length)
    ) {
      void hydrateSubject(notebookSlug);
    }
  }, [notebookSlug, subjects, pinnedExtra, hydrateSubject]);

  const markHydrated = useCallback((id: string, slug?: string) => {
    hydratedIdsRef.current.add(id);
    if (slug) {
      hydratedSlugsRef.current.add(slug);
      missingSlugsRef.current.delete(slug);
    }
  }, []);

  const invalidateHydrate = useCallback((slug: string) => {
    if (!slug) return;
    hydrateGen.current.set(slug, (hydrateGen.current.get(slug) ?? 0) + 1);
    hydratingSlugsRef.current.delete(slug);
  }, []);

  const isSubjectHydrated = useCallback((slug: string) => {
    if (hydratedSlugsRef.current.has(slug)) return true;
    const nb = subjectsRef.current.find((s) => s.slug === slug);
    return Boolean(nb && subjectTreeLoaded(nb));
  }, []);

  return {
    subjects,
    setSubjects,
    rootPages,
    setRootPages,
    pinnedExtra,
    setPinnedExtra,
    totalNotebooks,
    setTotalNotebooks,
    totalNotebookPages,
    loading,
    load,
    hydrateSubject,
    hydratingSlugs,
    markHydrated,
    invalidateHydrate,
    isSubjectHydrated,
  };
}

export { SIDEBAR_NOTEBOOK_PAGE_SIZE };
