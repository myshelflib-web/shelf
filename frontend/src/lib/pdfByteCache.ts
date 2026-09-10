/** IndexedDB cache for whole PDF bytes — smooth reopen without re-download. */

import { isCacheFresh } from "@/lib/cacheTtl";

const DB_NAME = "shelf-pdf-cache";
/** v2: separate meta store so eviction never getAll()s full PDF blobs. */
const DB_VERSION = 2;
const STORE = "pdfs";
const META_STORE = "pdfMeta";
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
  return version.split(":").slice(0, 2).join(":") || version;
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
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "pageId" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "pageId" });
        // No cursor migration of PDF blobs — that freezes open on large caches.
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

async function withStores<T>(
  mode: IDBTransactionMode,
  fn: (pdfs: IDBObjectStore, meta: IDBObjectStore | null) => Promise<T>
): Promise<T> {
  const db = await openDb();
  try {
    const hasMeta = db.objectStoreNames.contains(META_STORE);
    const names = hasMeta ? [STORE, META_STORE] : [STORE];
    const tx = db.transaction(names, mode);
    const pdfs = tx.objectStore(STORE);
    // Never alias meta → pdfs: getAll would decode every cached PDF.
    const meta = hasMeta ? tx.objectStore(META_STORE) : null;
    const result = await fn(pdfs, meta);
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

async function listMeta(meta: IDBObjectStore | null): Promise<PdfCacheMeta[]> {
  if (!meta) return [];
  const rows = await idbReq<PdfCacheMeta[]>(meta.getAll());
  return rows ?? [];
}

/** Return cached bytes + version without requiring a presign round-trip. */
export async function peekCachedPdf(
  pageId: string
): Promise<{ version: string; data: ArrayBuffer } | null> {
  try {
    return await withStores("readonly", async (pdfs) => {
      const row = await idbReq<PdfCacheRecord | undefined>(pdfs.get(pageId));
      if (!row?.data?.byteLength) return null;
      if (!isCacheFresh(row.lastAccess)) {
        void removeCachedPdf(pageId);
        return null;
      }
      void touchCachedPdf(pageId);
      return { version: row.version, data: row.data };
    });
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
    return await withStores("readonly", async (pdfs) => {
      const row = await idbReq<PdfCacheRecord | undefined>(pdfs.get(pageId));
      if (!row || row.version !== version) return null;
      if (!isCacheFresh(row.lastAccess)) {
        void removeCachedPdf(pageId);
        return null;
      }
      void touchCachedPdf(pageId);
      return row.data;
    });
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
    await withStores("readwrite", async (pdfs, meta) => {
      const row = await idbReq<PdfCacheRecord | undefined>(pdfs.get(pageId));
      if (!row) return;
      const local = pdfContentFingerprint(row.version);
      const remote = pdfContentFingerprint(serverVersion);
      if (local !== remote) {
        pdfs.delete(pageId);
        meta?.delete(pageId);
        return;
      }
      if (row.version !== serverVersion) {
        row.version = serverVersion;
        pdfs.put(row);
        meta?.put({
          pageId: row.pageId,
          version: row.version,
          byteLength: row.byteLength,
          lastAccess: row.lastAccess,
        } satisfies PdfCacheMeta);
      }
    });
  } catch {
    /* ignore */
  }
}

export async function touchCachedPdf(pageId: string): Promise<void> {
  try {
    await withStores("readwrite", async (pdfs, meta) => {
      const row = await idbReq<PdfCacheRecord | undefined>(pdfs.get(pageId));
      if (!row) return;
      row.lastAccess = Date.now();
      pdfs.put(row);
      meta?.put({
        pageId: row.pageId,
        version: row.version,
        byteLength: row.byteLength,
        lastAccess: row.lastAccess,
      } satisfies PdfCacheMeta);
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
    await withStores("readwrite", async (pdfs, meta) => {
      const others = (await listMeta(meta)).filter((r) => r.pageId !== pageId);
      others.sort((a, b) => a.lastAccess - b.lastAccess);

      let total = data.byteLength;
      for (const r of others) total += r.byteLength;

      while (
        (others.length >= MAX_DOCS || total > MAX_BYTES) &&
        others.length > 0
      ) {
        const evict = others.shift()!;
        total -= evict.byteLength;
        pdfs.delete(evict.pageId);
        meta?.delete(evict.pageId);
      }

      const lastAccess = Date.now();
      const record: PdfCacheRecord = {
        pageId,
        version,
        byteLength: data.byteLength,
        lastAccess,
        data,
      };
      pdfs.put(record);
      meta?.put({
        pageId,
        version,
        byteLength: data.byteLength,
        lastAccess,
      } satisfies PdfCacheMeta);
    });
  } catch {
    /* quota / private mode — ignore */
  }
}

export async function clearPdfByteCache(): Promise<void> {
  try {
    const db = await openDb();
    try {
      const names = [STORE];
      if (db.objectStoreNames.contains(META_STORE)) names.push(META_STORE);
      const tx = db.transaction(names, "readwrite");
      tx.objectStore(STORE).clear();
      if (db.objectStoreNames.contains(META_STORE)) {
        tx.objectStore(META_STORE).clear();
      }
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
    await withStores("readwrite", async (pdfs, meta) => {
      await idbReq(pdfs.delete(pageId));
      if (meta) await idbReq(meta.delete(pageId));
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
 * Fill IndexedDB in the background after first-page Ranges settle so the
 * full GET does not contend with pdf.js Range traffic on open.
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
  let delayId: ReturnType<typeof setTimeout> | undefined;

  const startIdle = () => {
    if (cancelled) return;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 20_000 });
    } else {
      timeoutId = setTimeout(run, 4_000);
    }
  };

  // Let the first visible page(s) finish Range-fetching before a full GET.
  delayId = setTimeout(startIdle, 12_000);

  return () => {
    cancelled = true;
    if (delayId != null) clearTimeout(delayId);
    if (idleId != null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId != null) clearTimeout(timeoutId);
  };
}
