/** IndexedDB cache for whole PDF bytes — smooth reopen without re-download. */

import { isCacheFresh } from "@/lib/cacheTtl";

const DB_NAME = "shelf-pdf-cache";
const DB_VERSION = 1;
const STORE = "pdfs";
const MAX_DOCS = 5;
const MAX_BYTES = 80 * 1024 * 1024;

export type PdfCacheMeta = {
  pageId: string;
  /** Invalidation token — pdfKey (+ file size for library pages). */
  version: string;
  byteLength: number;
  lastAccess: number;
};

type PdfCacheRecord = PdfCacheMeta & {
  data: ArrayBuffer;
};

/** Stable content id — ignores legacy timestamp suffixes on cache versions. */
export function pdfContentFingerprint(version: string): string {
  const parts = version.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return parts[0] ?? version;
}

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
        db.createObjectStore(STORE, { keyPath: "pageId" });
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

/** Return cached bytes + version without requiring a presign round-trip. */
export async function peekCachedPdf(
  pageId: string
): Promise<{ version: string; data: ArrayBuffer } | null> {
  try {
    const row = await withStore("readonly", (store) =>
      idbReq<PdfCacheRecord | undefined>(store.get(pageId))
    );
    if (!row?.data?.byteLength) return null;
    if (!isCacheFresh(row.lastAccess)) {
      void removeCachedPdf(pageId);
      return null;
    }
    void touchCachedPdf(pageId);
    return { version: row.version, data: row.data };
  } catch {
    return null;
  }
}

/** Return cached PDF bytes if version matches. */
export async function getCachedPdf(
  pageId: string,
  version: string
): Promise<ArrayBuffer | null> {
  try {
    const row = await withStore("readonly", (store) =>
      idbReq<PdfCacheRecord | undefined>(store.get(pageId))
    );
    if (!row || row.version !== version) return null;
    if (!isCacheFresh(row.lastAccess)) {
      void removeCachedPdf(pageId);
      return null;
    }
    void touchCachedPdf(pageId);
    return row.data;
  } catch {
    return null;
  }
}

/** Align stored version with the server or drop bytes when the PDF was replaced. */
export async function reconcileCachedPdfVersion(
  pageId: string,
  serverVersion: string
): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      const row = await idbReq<PdfCacheRecord | undefined>(store.get(pageId));
      if (!row) return;
      const local = pdfContentFingerprint(row.version);
      const remote = pdfContentFingerprint(serverVersion);
      if (local !== remote) {
        store.delete(pageId);
        return;
      }
      if (row.version !== serverVersion) {
        row.version = serverVersion;
        store.put(row);
      }
    });
  } catch {
    /* ignore */
  }
}

export async function touchCachedPdf(pageId: string): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      const row = await idbReq<PdfCacheRecord | undefined>(store.get(pageId));
      if (!row) return;
      row.lastAccess = Date.now();
      store.put(row);
    });
  } catch {
    /* ignore */
  }
}

export async function putCachedPdf(
  pageId: string,
  version: string,
  data: ArrayBuffer
): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      const all = await idbReq<PdfCacheRecord[]>(store.getAll());
      const others = all.filter((r) => r.pageId !== pageId);
      others.sort((a, b) => a.lastAccess - b.lastAccess);

      let total = data.byteLength;
      for (const r of others) total += r.byteLength;

      while (
        (others.length >= MAX_DOCS || total > MAX_BYTES) &&
        others.length > 0
      ) {
        const evict = others.shift()!;
        total -= evict.byteLength;
        store.delete(evict.pageId);
      }

      const record: PdfCacheRecord = {
        pageId,
        version,
        byteLength: data.byteLength,
        lastAccess: Date.now(),
        data,
      };
      store.put(record);
    });
  } catch {
    /* quota / private mode — ignore */
  }
}

export async function clearPdfByteCache(): Promise<void> {
  try {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("clear failed"));
      });
    } finally {
      db.close();
    }
  } catch {
    /* ignore */
  }
}

export async function removeCachedPdf(pageId: string): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      await idbReq(store.delete(pageId));
    });
  } catch {
    /* ignore */
  }
}

async function downloadAndCachePdf(
  pageId: string,
  version: string,
  url: string
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) return;
  const buf = await res.arrayBuffer();
  await putCachedPdf(pageId, version, buf);
}

/**
 * Fill IndexedDB in the background (deferred until idle) so revisits and
 * in-session page turns avoid extra S3 range requests.
 */
export function scheduleFullPdfCache(
  pageId: string,
  version: string,
  url: string
): () => void {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    void downloadAndCachePdf(pageId, version, url).catch(() => undefined);
  };

  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    idleId = window.requestIdleCallback(run, { timeout: 8_000 });
  } else {
    timeoutId = setTimeout(run, 3_000);
  }

  return () => {
    cancelled = true;
    if (idleId != null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId != null) clearTimeout(timeoutId);
  };
}
