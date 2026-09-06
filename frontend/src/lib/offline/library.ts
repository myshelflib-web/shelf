import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import { isCacheFresh } from "@/lib/cacheTtl";
import type { ContentChange } from "@/lib/contentEvents";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";
import {
  buildBulkDeletePayload,
  pageSelectionKey,
} from "@/lib/explorerSelection";
import {
  insertPageInTree,
  insertTopicInTree,
  syncPageInTree,
  syncRootPages,
} from "@/lib/myContentTree";
import type { UserPageSummary, UserSubject } from "@/types";
import { type LibraryCache, OFFLINE_STORES, withStore } from "./db";
import { isOnline } from "./network";

export type ListSubjectsResult = {
  subjects: UserSubject[];
  rootPages: UserPageSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DeletePayload = ReturnType<typeof buildBulkDeletePayload>;

type MemoryLibrary = ListSubjectsResult & {
  cachedAt: number;
  listSort?: string;
  listPage?: number;
};

let memoryLibrary: MemoryLibrary | null = null;

export function peekCachedLibrary(opts?: {
  sort?: string;
  page?: number;
}): ListSubjectsResult | null {
  if (!memoryLibrary || !isCacheFresh(memoryLibrary.cachedAt)) {
    memoryLibrary = null;
    return null;
  }
  if (opts) {
    const sort = opts.sort ?? "recent";
    const page = opts.page ?? 1;
    if ((memoryLibrary.listSort ?? "recent") !== sort) return null;
    if ((memoryLibrary.listPage ?? 1) !== page) return null;
  }
  const {
    cachedAt: _cachedAt,
    listSort: _ls,
    listPage: _lp,
    ...rest
  } = memoryLibrary;
  return rest;
}

export function findCachedSubject(slug: string): UserSubject | null {
  if (!slug) return null;
  return peekCachedLibrary()?.subjects.find((s) => s.slug === slug) ?? null;
}

function rememberLibrary(
  res: ListSubjectsResult,
  cachedAt = Date.now(),
  meta?: { sort?: string; page?: number }
) {
  memoryLibrary = {
    ...res,
    cachedAt,
    listSort: meta?.sort ?? memoryLibrary?.listSort,
    listPage: meta?.page ?? memoryLibrary?.listPage,
  };
}

function cacheMetaFromMemory(): Pick<
  LibraryCache,
  "sort" | "page" | "pageSize" | "total" | "totalPages"
> {
  return {
    sort: memoryLibrary?.listSort,
    page: memoryLibrary?.listPage ?? memoryLibrary?.page,
    pageSize: memoryLibrary?.pageSize,
    total: memoryLibrary?.total,
    totalPages: memoryLibrary?.totalPages,
  };
}

async function getLibraryCache(userId: string): Promise<LibraryCache | null> {
  return withStore(OFFLINE_STORES.library, "readonly", async (store) => {
    const row = await new Promise<LibraryCache | undefined>((resolve, reject) => {
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result as LibraryCache | undefined);
      req.onerror = () => reject(req.error ?? new Error("IDB get failed"));
    });
    return row ?? null;
  });
}

async function deleteLibraryCache(userId: string): Promise<void> {
  await withStore(OFFLINE_STORES.library, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(userId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    });
  });
}

async function putLibraryCache(cache: LibraryCache): Promise<void> {
  await withStore(OFFLINE_STORES.library, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put(cache);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
}

async function readFreshLibraryCache(userId: string): Promise<LibraryCache | null> {
  const cache = await getLibraryCache(userId);
  if (!cache) return null;
  if (isCacheFresh(cache.cachedAt)) return cache;
  await deleteLibraryCache(userId);
  if (memoryLibrary) memoryLibrary = null;
  return null;
}

function cacheAsListResult(cache: LibraryCache): ListSubjectsResult {
  const pageSize = cache.pageSize ?? (cache.subjects.length || 1);
  const page = cache.page ?? 1;
  const total = cache.total ?? cache.subjects.length;
  const totalPages =
    cache.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  return {
    subjects: cache.subjects,
    rootPages: cache.rootPages,
    page,
    pageSize,
    total,
    totalPages,
  };
}

function writeSnapshot(
  res: ListSubjectsResult,
  cachedAt: number,
  meta?: { sort?: string; page?: number }
) {
  rememberLibrary(res, cachedAt, meta);
  const userId = getStoredUserId();
  if (!userId) return;
  void putLibraryCache({
    userId,
    subjects: res.subjects,
    rootPages: res.rootPages ?? [],
    cachedAt,
    sort: meta?.sort ?? memoryLibrary?.listSort,
    page: meta?.page ?? memoryLibrary?.listPage ?? res.page,
    pageSize: res.pageSize,
    total: res.total,
    totalPages: res.totalPages,
  });
}

export async function listSubjects(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  filter?: string;
  tree?: boolean;
}): Promise<ListSubjectsResult> {
  const userId = getStoredUserId();
  if (!userId) {
    return { subjects: [], rootPages: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  }

  if (isOnline()) {
    try {
      const res = await api.myContent.listSubjects(opts);
      const cachedAt = Date.now();
      if (!opts?.q) {
        writeSnapshot(res, cachedAt, {
          sort: opts?.sort,
          page: opts?.page ?? 1,
        });
      }
      return res;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const cache = await readFreshLibraryCache(userId);
  if (!cache) {
    return { subjects: [], rootPages: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
  }

  let subjects = cache.subjects;
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    subjects = subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }

  const base = cacheAsListResult({ ...cache, subjects });
  const result = {
    ...base,
    page: opts?.page ?? cache.page ?? 1,
    pageSize: opts?.pageSize ?? cache.pageSize ?? base.pageSize,
  };
  if (!opts?.q) {
    rememberLibrary(result, cache.cachedAt, {
      sort: opts?.sort ?? cache.sort,
      page: opts?.page ?? cache.page ?? 1,
    });
  }
  return result;
}

export async function loadCachedLibraryForPaint(opts?: {
  sort?: string;
  page?: number;
}): Promise<ListSubjectsResult | null> {
  const mem = peekCachedLibrary(opts);
  if (mem) return mem;
  const userId = getStoredUserId();
  if (!userId) return null;
  try {
    const cache = await readFreshLibraryCache(userId);
    if (!cache) return null;
    const sort = opts?.sort ?? "recent";
    const page = opts?.page ?? 1;
    if ((cache.sort ?? "recent") !== sort) return null;
    if ((cache.page ?? 1) !== page) return null;
    const result = cacheAsListResult(cache);
    rememberLibrary(result, cache.cachedAt, {
      sort: cache.sort,
      page: cache.page,
    });
    return result;
  } catch {
    return null;
  }
}

export async function patchLibraryCacheAfterDelete(
  payload: DeletePayload
): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) return;

  let subjects = memoryLibrary?.subjects;
  let rootPages = memoryLibrary?.rootPages;
  const meta = cacheMetaFromMemory();
  if (!subjects || !rootPages) {
    const cached = await readFreshLibraryCache(userId);
    if (!cached) return;
    subjects = cached.subjects;
    rootPages = cached.rootPages;
    meta.sort = cached.sort;
    meta.page = cached.page;
    meta.pageSize = cached.pageSize;
    meta.total = cached.total;
    meta.totalPages = cached.totalPages;
  }

  const next = applyBulkDeleteToTree(payload, subjects, rootPages);
  const removedSubjects = payload.subjectIds.length;
  const nextCachedAt = Date.now();
  const total = Math.max(0, (meta.total ?? next.subjects.length) - removedSubjects);
  const pageSize = meta.pageSize ?? Math.max(next.subjects.length, 1);
  writeSnapshot(
    {
      subjects: next.subjects,
      rootPages: next.rootPages,
      page: meta.page ?? 1,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
    },
    nextCachedAt,
    { sort: meta.sort, page: meta.page ?? 1 }
  );
}

export function patchLibraryCachePageFlags(
  pageId: string,
  flags: { completed?: boolean; starred?: boolean }
): void {
  if (!memoryLibrary) return;
  const subjects = syncPageInTree(memoryLibrary.subjects, pageId, flags);
  const rootPages = syncRootPages(memoryLibrary.rootPages, pageId, flags);
  writeSnapshot(
    { ...memoryLibrary, subjects, rootPages },
    memoryLibrary.cachedAt,
    { sort: memoryLibrary.listSort, page: memoryLibrary.listPage }
  );
}

/** Keep offline cache aligned with explorer content events (rename, create, …). */
export function syncLibraryCacheContentChange(change: ContentChange): void {
  if (!memoryLibrary) return;
  const cachedAt = Date.now();
  const meta = {
    sort: memoryLibrary.listSort,
    page: memoryLibrary.listPage,
  };

  if (change.type === "notebook-created") {
    const subjects = memoryLibrary.subjects.some((s) => s.id === change.subject.id)
      ? memoryLibrary.subjects
      : [change.subject, ...memoryLibrary.subjects];
    writeSnapshot(
      {
        ...memoryLibrary,
        subjects,
        total: (memoryLibrary.total ?? memoryLibrary.subjects.length) + 1,
      },
      cachedAt,
      meta
    );
    return;
  }

  if (change.type === "topic-created") {
    writeSnapshot(
      {
        ...memoryLibrary,
        subjects: insertTopicInTree(
          memoryLibrary.subjects,
          change.notebookId,
          change.topicGroup,
          change.parentTopicId
        ),
      },
      cachedAt,
      meta
    );
    return;
  }

  if (change.type === "page-created") {
    if (change.notebookId) {
      writeSnapshot(
        {
          ...memoryLibrary,
          subjects: insertPageInTree(
            memoryLibrary.subjects,
            change.page,
            change.notebookId,
            change.topicId
          ),
        },
        cachedAt,
        meta
      );
    } else {
      const rootPages = memoryLibrary.rootPages.some((p) => p.id === change.page.id)
        ? memoryLibrary.rootPages
        : [change.page, ...memoryLibrary.rootPages];
      writeSnapshot({ ...memoryLibrary, rootPages }, cachedAt, meta);
    }
    return;
  }

  if (change.type === "page-renamed") {
    const patch = { title: change.title };
    writeSnapshot(
      {
        ...memoryLibrary,
        subjects: syncPageInTree(memoryLibrary.subjects, change.pageId, patch),
        rootPages: syncRootPages(memoryLibrary.rootPages, change.pageId, patch),
      },
      cachedAt,
      meta
    );
    return;
  }

  if (change.type === "page-flags") {
    patchLibraryCachePageFlags(change.pageId, {
      completed: change.completed,
      starred: change.starred,
    });
    return;
  }

  if (change.type === "page-deleted") {
    void patchLibraryCacheAfterDelete(
      buildBulkDeletePayload(new Set([pageSelectionKey(change.pageId)]))
    );
  }
}

export async function hasCachedLibrary(): Promise<boolean> {
  const userId = getStoredUserId();
  if (!userId) return false;
  const cache = await readFreshLibraryCache(userId);
  return Boolean(cache && cache.subjects.length > 0);
}
