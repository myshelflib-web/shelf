import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
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

let memoryLibrary: ListSubjectsResult | null = null;

export function peekCachedLibrary(): ListSubjectsResult | null {
  return memoryLibrary;
}

export function findCachedSubject(slug: string): UserSubject | null {
  if (!slug) return null;
  return memoryLibrary?.subjects.find((s) => s.slug === slug) ?? null;
}

function rememberLibrary(res: ListSubjectsResult) {
  memoryLibrary = res;
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

async function putLibraryCache(cache: LibraryCache): Promise<void> {
  await withStore(OFFLINE_STORES.library, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put(cache);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
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
      if (!opts?.q) {
        if (res.subjects.length >= res.total) rememberLibrary(res);
        await putLibraryCache({
          userId,
          subjects: res.subjects,
          rootPages: res.rootPages ?? [],
          cachedAt: Date.now(),
        });
      }
      return res;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const cache = await getLibraryCache(userId);
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
  if (!opts?.q && result.subjects.length >= result.total) rememberLibrary(result);
  return result;
}

export async function hasCachedLibrary(): Promise<boolean> {
  const userId = getStoredUserId();
  if (!userId) return false;
  const cache = await getLibraryCache(userId);
  return Boolean(cache && cache.subjects.length > 0);
}
