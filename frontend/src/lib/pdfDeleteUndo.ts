/** Session undo stack for PDF page deletes (IndexedDB, max 2 per document). */

import type { UserContentHighlight } from "@/types";

const DB_NAME = "shelf-pdf-delete-undo";
const DB_VERSION = 1;
const STORE = "undos";
const MAX_PER_PAGE = 2;
/** Drop snapshots older than this even if still in the stack. */
export const PDF_DELETE_UNDO_TTL_MS = 30 * 60 * 1000;

export type PdfDeleteUndoEntry = {
  id: string;
  pageId: string;
  createdAt: number;
  deletedPages: number[];
  viewPdfPage: number;
  pdfBytes: ArrayBuffer;
  highlights: UserContentHighlight[];
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
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("pageId", "pageId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
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

function isFresh(entry: PdfDeleteUndoEntry, now = Date.now()): boolean {
  return now - entry.createdAt <= PDF_DELETE_UNDO_TTL_MS;
}

export async function pushPdfDeleteUndo(
  entry: Omit<PdfDeleteUndoEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: number;
  }
): Promise<PdfDeleteUndoEntry | null> {
  try {
    const row: PdfDeleteUndoEntry = {
      id: entry.id ?? crypto.randomUUID(),
      createdAt: entry.createdAt ?? Date.now(),
      pageId: entry.pageId,
      deletedPages: entry.deletedPages,
      viewPdfPage: entry.viewPdfPage,
      pdfBytes: entry.pdfBytes,
      highlights: entry.highlights,
    };
    await withStore("readwrite", async (store) => {
      const idx = store.index("pageId");
      const existing = await idbReq<PdfDeleteUndoEntry[]>(
        idx.getAll(entry.pageId)
      );
      const now = Date.now();
      const keep = existing
        .filter((e) => isFresh(e, now))
        .sort((a, b) => a.createdAt - b.createdAt);
      while (keep.length >= MAX_PER_PAGE) {
        const evict = keep.shift()!;
        store.delete(evict.id);
      }
      for (const stale of existing) {
        if (!isFresh(stale, now)) store.delete(stale.id);
      }
      store.put(row);
    });
    return row;
  } catch {
    return null;
  }
}

export async function peekPdfDeleteUndo(
  pageId: string
): Promise<PdfDeleteUndoEntry | null> {
  try {
    return await withStore("readonly", async (store) => {
      const idx = store.index("pageId");
      const existing = await idbReq<PdfDeleteUndoEntry[]>(idx.getAll(pageId));
      const now = Date.now();
      const fresh = existing
        .filter((e) => isFresh(e, now))
        .sort((a, b) => b.createdAt - a.createdAt);
      return fresh[0] ?? null;
    });
  } catch {
    return null;
  }
}

export async function countPdfDeleteUndos(pageId: string): Promise<number> {
  try {
    return await withStore("readonly", async (store) => {
      const idx = store.index("pageId");
      const existing = await idbReq<PdfDeleteUndoEntry[]>(idx.getAll(pageId));
      const now = Date.now();
      return existing.filter((e) => isFresh(e, now)).length;
    });
  } catch {
    return 0;
  }
}

export async function popPdfDeleteUndo(
  pageId: string
): Promise<PdfDeleteUndoEntry | null> {
  try {
    return await withStore("readwrite", async (store) => {
      const idx = store.index("pageId");
      const existing = await idbReq<PdfDeleteUndoEntry[]>(idx.getAll(pageId));
      const now = Date.now();
      const fresh = existing
        .filter((e) => isFresh(e, now))
        .sort((a, b) => b.createdAt - a.createdAt);
      for (const stale of existing) {
        if (!isFresh(stale, now)) store.delete(stale.id);
      }
      const top = fresh[0];
      if (!top) return null;
      store.delete(top.id);
      return top;
    });
  } catch {
    return null;
  }
}

export async function clearPdfDeleteUndos(pageId?: string): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      if (!pageId) {
        store.clear();
        return;
      }
      const idx = store.index("pageId");
      const existing = await idbReq<PdfDeleteUndoEntry[]>(idx.getAll(pageId));
      for (const row of existing) store.delete(row.id);
    });
  } catch {
    /* ignore */
  }
}
