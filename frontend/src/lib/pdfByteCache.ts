/** IndexedDB cache for whole PDF bytes — smooth reopen without re-download. */

const DB_NAME = "shelf-pdf-cache";
const DB_VERSION = 1;
const STORE = "pdfs";
const MAX_DOCS = 5;
const MAX_BYTES = 80 * 1024 * 1024;

export type PdfCacheMeta = {
  pageId: string;
  /** Invalidation token — typically Content-Length or ETag */
  version: string;
  byteLength: number;
  lastAccess: number;
};

type PdfCacheRecord = PdfCacheMeta & {
  data: ArrayBuffer;
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
    // Touch lastAccess in background
    void touchCachedPdf(pageId);
    return row.data;
  } catch {
    return null;
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

const VISITED_KEY_PREFIX = "shelf:pdf-seen:";

function hasOpenedPdfBefore(pageId: string): boolean {
  try {
    return localStorage.getItem(`${VISITED_KEY_PREFIX}${pageId}`) === "1";
  } catch {
    return false;
  }
}

function markPdfOpened(pageId: string): void {
  try {
    localStorage.setItem(`${VISITED_KEY_PREFIX}${pageId}`, "1");
  }
  catch {
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
 * Fill IndexedDB only on revisits, deferred until the browser is idle.
 * First open skips the background full download to save bandwidth.
 */
export function scheduleFullPdfCache(
  pageId: string,
  version: string,
  url: string
): () => void {
  const revisit = hasOpenedPdfBefore(pageId);
  markPdfOpened(pageId);
  if (!revisit) return () => undefined;

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
