/** IndexedDB queue for library uploads that failed PUT/complete (e.g. R2 CORS). */

import type { UserContentType } from "@/types";
import {
  isSyncRetryExhausted,
  syncBackoffMs,
} from "@/lib/syncBackoff";

const DB_NAME = "shelf-pending-uploads";
const DB_VERSION = 1;
const STORE = "uploads";

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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "pageId" });
        store.createIndex("byUser", "userId", { unique: false });
        store.createIndex("byNext", "nextAttemptAt", { unique: false });
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

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = await fn(store);
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

export async function putPendingUpload(
  entry: PendingUploadEntry
): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      await idbReq(store.put(entry));
    });
  } catch {
    /* quota / private mode */
  }
}

export async function getPendingUpload(
  pageId: string
): Promise<PendingUploadEntry | null> {
  try {
    return await withStore("readonly", async (store) => {
      return (await idbReq(store.get(pageId))) ?? null;
    });
  } catch {
    return null;
  }
}

export async function removePendingUpload(pageId: string): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      await idbReq(store.delete(pageId));
    });
  } catch {
    /* ignore */
  }
}

export async function listPendingUploads(
  userId: string
): Promise<PendingUploadEntry[]> {
  try {
    return await withStore("readonly", async (store) => {
      const idx = store.index("byUser");
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
  const all = await listPendingUploads(userId);
  return all.filter((e) => {
    if (isSyncRetryExhausted(e.attempts)) return false;
    if (e.nextAttemptAt > now) return false;
    if (e.nextAttemptAt >= Number.MAX_SAFE_INTEGER) return false;
    // Already known CORS / unreachable — never auto-retry.
    if (
      e.lastError &&
      /CORS|Cannot reach storage/i.test(e.lastError)
    ) {
      return false;
    }
    return true;
  });
}

export async function collectPendingUploadPageIds(
  userId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const e of await listPendingUploads(userId)) {
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
