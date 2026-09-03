import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import { isCacheFresh } from "@/lib/cacheTtl";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";
import type { buildBulkDeletePayload } from "@/lib/explorerSelection";
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

type MemoryLibrary = ListSubjectsResult & { cachedAt: number };

let memoryLibrary: MemoryLibrary | null = null;

export function peekCachedLibrary(): ListSubjectsResult | null {
  if (!memoryLibrary || !isCacheFresh(memoryLibrary.cachedAt)) {
    memoryLibrary = null;
    return null;
  }
  const { cachedAt: _cachedAt, ...rest } = memoryLibrary;
  return rest;
}

export function findCachedSubject(slug: string): UserSubject | null {
  if (!slug) return null;
  return peekCachedLibrary()?.subjects.find((s) => s.slug === slug) ?? null;
}

function rememberLibrary(res: ListSubjectsResult, cachedAt = Date.now()) {
  memoryLibrary = { ...res, cachedAt };
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

function cacheAsListResult(cache: LibraryCache, opts?: {
  page?: number;
  pageSize?: number;
}): ListSubjectsResult {
  const pageSize = opts?.pageSize ?? (cache.subjects.length || 1);
  const page = opts?.page ?? 1;
  return {
    subjects: cache.subjects,
    rootPages: cache.rootPages,
    page,
    pageSize,
    total: cache.subjects.length,
    totalPages: Math.max(1, Math.ceil(cache.subjects.length / pageSize)),
  };
}

export async function listSubjects(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  filter?: string;
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
        if (res.subjects.length >= res.total) rememberLibrary(res, cachedAt);
        await putLibraryCache({
          userId,
          subjects: res.subjects,
          rootPages: res.rootPages ?? [],
          cachedAt,
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

  const result = cacheAsListResult(
    { ...cache, subjects },
    { page: opts?.page, pageSize: opts?.pageSize },
  );
  if (!opts?.q && result.subjects.length >= result.total) {
    rememberLibrary(result, cache.cachedAt);
  }
  return result;
}

/**
 * Drop deleted ids from memory + IndexedDB so offline/reload fallback
 * cannot resurrect items the API already removed.
 */
export async function patchLibraryCacheAfterDelete(
  payload: DeletePayload
): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) return;

  let subjects = memoryLibrary?.subjects;
  let rootPages = memoryLibrary?.rootPages;
  if (!subjects || !rootPages) {
    const cached = await readFreshLibraryCache(userId);
    if (!cached) return;
    subjects = cached.subjects;
    rootPages = cached.rootPages;
  }

  const next = applyBulkDeleteToTree(payload, subjects, rootPages);
  const nextCachedAt = Date.now();
  rememberLibrary(
    {
      subjects: next.subjects,
      rootPages: next.rootPages,
      page: 1,
      pageSize: Math.max(next.subjects.length, 1),
      total: next.subjects.length,
      totalPages: 1,
    },
    nextCachedAt,
  );
  await putLibraryCache({
    userId,
    subjects: next.subjects,
    rootPages: next.rootPages,
    cachedAt: nextCachedAt,
  });
}

export async function hasCachedLibrary(): Promise<boolean> {
  const userId = getStoredUserId();
  if (!userId) return false;
  const cache = await readFreshLibraryCache(userId);
  return Boolean(cache && cache.subjects.length > 0);
}
