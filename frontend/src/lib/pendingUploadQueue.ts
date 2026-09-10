/** IndexedDB queue for library uploads that failed PUT/complete (e.g. R2 CORS). */

import type { UserContentType } from "@/types";
import {
  isSyncRetryExhausted,
  syncBackoffMs,
} from "@/lib/syncBackoff";

const DB_NAME = "shelf-pending-uploads";
/** v2: meta store so UI/count never getAll()s full file ArrayBuffers. */
const DB_VERSION = 2;
const STORE = "uploads";
const META_STORE = "uploadMeta";

/** Cap deferred upload copies so failed syncs cannot fill IndexedDB / RAM. */
export const MAX_PENDING_UPLOADS = 3;
export const MAX_PENDING_UPLOAD_BYTES = 40 * 1024 * 1024;

export type PendingUploadEntry = {
  pageId: string;
  userId: string;
  token: string;
  uploadUrl: string;
  contentTypeHeader: string;
  filename: string;
  title: string;
  contentType: UserContentType;
  pdfCacheVersion?: string;
  clientPacked: boolean;
  /** Bytes already landed in object storage — only retry complete. */
  putDone: boolean;
  data: ArrayBuffer;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

/** Lightweight row for badges / sync panel (no file bytes). */
export type PendingUploadSummary = Omit<PendingUploadEntry, "data"> & {
  byteLength: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "pageId" });
        store.createIndex("byUser", "userId", { unique: false });
        store.createIndex("byNext", "nextAttemptAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        const meta = db.createObjectStore(META_STORE, { keyPath: "pageId" });
        meta.createIndex("byUser", "userId", { unique: false });
        meta.createIndex("byNext", "nextAttemptAt", { unique: false });
        // Do NOT cursor-migrate blob store here — reading every ArrayBuffer on
        // upgrade freezes the tab. Meta is written on put; orphans are ignored.
        void event;
      }
    };
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB request failed"));
  });
}

function toSummary(entry: PendingUploadEntry): PendingUploadSummary {
  const { data, ...rest } = entry;
  return { ...rest, byteLength: data?.byteLength ?? 0 };
}

async function withStores<T>(
  mode: IDBTransactionMode,
  fn: (uploads: IDBObjectStore, meta: IDBObjectStore | null) => Promise<T>
): Promise<T> {
  const db = await openDb();
  try {
    const hasMeta = db.objectStoreNames.contains(META_STORE);
    const names = hasMeta ? [STORE, META_STORE] : [STORE];
    const tx = db.transaction(names, mode);
    const uploads = tx.objectStore(STORE);
    // Never alias meta → uploads: getAll on uploads pulls full file bytes.
    const meta = hasMeta ? tx.objectStore(META_STORE) : null;
    const result = await fn(uploads, meta);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB tx failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IDB tx aborted"));
    });
    return result;
  } finally {
    db.close();
  }
}

export function pendingUploadBackoffMs(attempts: number): number {
  return syncBackoffMs(attempts);
}

/** Persist a deferred upload. Returns false if quota blocked the write. */
export async function putPendingUpload(
  entry: PendingUploadEntry
): Promise<boolean> {
  try {
    await withStores("readwrite", async (uploads, meta) => {
      const summaries = meta
        ? ((await idbReq<PendingUploadSummary[]>(
            meta.index("byUser").getAll(entry.userId)
          )) ?? [])
        : [];
      const others = summaries
        .filter((r) => r.pageId !== entry.pageId)
        .map((r) => ({
          pageId: r.pageId,
          createdAt: r.createdAt,
          byteLength: r.byteLength || 0,
        }))
        .sort((a, b) => a.createdAt - b.createdAt);

      if (entry.data.byteLength > MAX_PENDING_UPLOAD_BYTES) {
        for (const r of others) {
          uploads.delete(r.pageId);
          meta?.delete(r.pageId);
        }
        await idbReq(uploads.put(entry));
        if (meta) await idbReq(meta.put(toSummary(entry)));
        return;
      }

      let total = entry.data.byteLength;
      for (const r of others) total += r.byteLength;

      while (
        (others.length >= MAX_PENDING_UPLOADS ||
          total > MAX_PENDING_UPLOAD_BYTES) &&
        others.length > 0
      ) {
        const evict = others.shift()!;
        total -= evict.byteLength;
        uploads.delete(evict.pageId);
        meta?.delete(evict.pageId);
      }

      await idbReq(uploads.put(entry));
      if (meta) await idbReq(meta.put(toSummary(entry)));
    });
    return true;
  } catch {
    /* quota / private mode */
    return false;
  }
}

export async function getPendingUpload(
  pageId: string
): Promise<PendingUploadEntry | null> {
  try {
    return await withStores("readonly", async (uploads) => {
      return (await idbReq(uploads.get(pageId))) ?? null;
    });
  } catch {
    return null;
  }
}

export async function removePendingUpload(pageId: string): Promise<void> {
  try {
    await withStores("readwrite", async (uploads, meta) => {
      await idbReq(uploads.delete(pageId));
      if (meta) await idbReq(meta.delete(pageId));
    });
  } catch {
    /* ignore */
  }
}

/** Metadata only — safe for badges / sync panel (no ArrayBuffer decode). */
export async function listPendingUploadSummaries(
  userId: string
): Promise<PendingUploadSummary[]> {
  try {
    return await withStores("readonly", async (_uploads, meta) => {
      if (!meta) return [];
      const idx = meta.index("byUser");
      const rows =
        (await idbReq<PendingUploadSummary[]>(idx.getAll(userId))) ?? [];
      return rows
        .map((r) => ({
          ...r,
          byteLength: typeof r.byteLength === "number" ? r.byteLength : 0,
        }))
        .filter((r) => r.pageId)
        .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);
    });
  } catch {
    return [];
  }
}

/** @deprecated Prefer listPendingUploadSummaries for UI; loads full blobs. */
export async function listPendingUploads(
  userId: string
): Promise<PendingUploadEntry[]> {
  try {
    return await withStores("readonly", async (uploads) => {
      const idx = uploads.index("byUser");
      const rows = await idbReq(idx.getAll(userId));
      return (rows ?? []).sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);
    });
  } catch {
    return [];
  }
}

export async function listDuePendingUploads(
  userId: string,
  now = Date.now()
): Promise<PendingUploadEntry[]> {
  const summaries = await listPendingUploadSummaries(userId);
  const dueIds = summaries
    .filter((e) => {
      if (isSyncRetryExhausted(e.attempts)) return false;
      if (e.nextAttemptAt > now) return false;
      if (e.nextAttemptAt >= Number.MAX_SAFE_INTEGER) return false;
      if (e.lastError && /CORS|Cannot reach storage/i.test(e.lastError)) {
        return false;
      }
      return true;
    })
    .map((e) => e.pageId);

  const out: PendingUploadEntry[] = [];
  for (const pageId of dueIds) {
    const full = await getPendingUpload(pageId);
    if (full) out.push(full);
  }
  return out;
}

export async function collectPendingUploadPageIds(
  userId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const e of await listPendingUploadSummaries(userId)) {
    ids.add(e.pageId);
  }
  return ids;
}

export async function clearPendingUploads(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    req.onblocked = () => resolve();
  });
}
