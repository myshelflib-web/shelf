import type { StudyTask, UserContentHighlight } from "@/types";

export const OFFLINE_DB_NAME = "shelf-offline";
export const OFFLINE_DB_VERSION = 4;

export const OFFLINE_STORES = {
  library: "library",
  tasks: "tasks",
  outbox: "outbox",
  highlights: "highlights",
  progressQueue: "progressQueue",
  meta: "meta",
} as const;

export type LibraryCache = {
  userId: string;
  subjects: import("@/types").UserSubject[];
  rootPages: import("@/types").UserPageSummary[];
  cachedAt: number;
};

export type LocalTask = StudyTask & {
  syncStatus: "synced" | "pending" | "pending-delete";
  localOnly: boolean;
  updatedAt: number;
};

export type LocalHighlight = UserContentHighlight & {
  syncStatus: "synced" | "pending" | "pending-delete";
  localOnly: boolean;
  updatedAt: number;
  userId: string;
  pageId: string;
};

export type OutboxKind = "task" | "highlight";

export type OutboxOp = "create" | "update" | "delete";

export type OutboxEntry = {
  id: string;
  userId: string;
  kind: OutboxKind;
  op: OutboxOp;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: number;
  /** Legacy task outbox rows (v1). */
  taskId?: string;
};

export type ProgressQueueEntry = {
  key: string;
  userId: string;
  pageId: string;
  payload: {
    readPercent?: number;
    completed?: boolean;
    view?: {
      pdfPage?: number;
      pageOffset?: number;
      scrollTop?: number;
      scale?: number;
    };
  };
  updatedAt: number;
};

export function outboxEntityId(entry: OutboxEntry): string {
  return entry.entityId || entry.taskId || "";
}

export function outboxKind(entry: OutboxEntry): OutboxKind {
  return entry.kind ?? "task";
}

export function progressQueueKey(userId: string, pageId: string): string {
  return `${userId}:${pageId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;

      if (!db.objectStoreNames.contains(OFFLINE_STORES.library)) {
        db.createObjectStore(OFFLINE_STORES.library, { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.tasks)) {
        db.createObjectStore(OFFLINE_STORES.tasks, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.outbox)) {
        db.createObjectStore(OFFLINE_STORES.outbox, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.highlights)) {
        const store = db.createObjectStore(OFFLINE_STORES.highlights, {
          keyPath: "id",
        });
        store.createIndex("byPage", "pageId", { unique: false });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.progressQueue)) {
        db.createObjectStore(OFFLINE_STORES.progressQueue, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.meta)) {
        db.createObjectStore(OFFLINE_STORES.meta, { keyPath: "key" });
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

export async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
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

export async function clearOfflineDb(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(OFFLINE_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    req.onblocked = () => resolve();
  });
}
