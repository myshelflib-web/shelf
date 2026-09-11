/** Durable queue for failed library/task/highlight mutations (PATCH/PUT/DELETE). */

import {
  isSyncRetryExhausted,
  syncBackoffMs,
} from "@/lib/syncBackoff";
import { randomId } from "@/lib/randomId";

const DB_NAME = "shelf-pending-mutations";
const DB_VERSION = 1;
const STORE = "mutations";

export type PendingMutationEntry = {
  id: string;
  userId: string;
  path: string;
  method: string;
  body: string | null;
  entityKeys: string[];
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
        const store = db.createObjectStore(STORE, { keyPath: "id" });
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

function mutationDedupeKey(
  path: string,
  method: string,
  body: string | null
): string {
  return `${method.toUpperCase()}:${path}:${body ?? ""}`;
}

export async function putPendingMutation(
  entry: PendingMutationEntry
): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      await idbReq(store.put(entry));
    });
  } catch {
    /* quota */
  }
}

export async function removePendingMutation(id: string): Promise<void> {
  try {
    await withStore("readwrite", async (store) => {
      await idbReq(store.delete(id));
    });
  } catch {
    /* ignore */
  }
}

export async function listPendingMutations(
  userId: string
): Promise<PendingMutationEntry[]> {
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

export async function listDuePendingMutations(
  userId: string,
  now = Date.now()
): Promise<PendingMutationEntry[]> {
  return (await listPendingMutations(userId)).filter(
    (e) =>
      e.nextAttemptAt <= now &&
      e.nextAttemptAt < Number.MAX_SAFE_INTEGER &&
      !isSyncRetryExhausted(e.attempts)
  );
}

/** Enqueue or refresh an existing same-path mutation. */
export async function enqueuePendingMutation(input: {
  userId: string;
  path: string;
  method: string;
  body: string | null;
  entityKeys: string[];
  lastError?: string;
}): Promise<void> {
  const method = input.method.toUpperCase();
  const existing = await listPendingMutations(input.userId);
  const dedupe = mutationDedupeKey(input.path, method, input.body);
  const prior = existing.find(
    (e) => mutationDedupeKey(e.path, e.method, e.body) === dedupe
  );
  const attempts =
    prior && !isSyncRetryExhausted(prior.attempts) ? prior.attempts : 0;
  await putPendingMutation({
    id: prior?.id ?? randomId(),
    userId: input.userId,
    path: input.path,
    method,
    body: input.body,
    entityKeys: input.entityKeys,
    createdAt: prior?.createdAt ?? Date.now(),
    attempts,
    nextAttemptAt: Date.now() + syncBackoffMs(Math.max(0, attempts)),
    lastError: input.lastError,
  });
}

export async function collectPendingMutationPageIds(
  userId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const e of await listPendingMutations(userId)) {
    for (const key of e.entityKeys) {
      if (key.startsWith("page:")) ids.add(key.slice(5));
    }
  }
  return ids;
}

export async function collectPendingMutationEntityKeys(
  userId: string
): Promise<Set<string>> {
  const keys = new Set<string>();
  for (const e of await listPendingMutations(userId)) {
    for (const k of e.entityKeys) keys.add(k);
  }
  return keys;
}

export async function clearPendingMutations(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    req.onblocked = () => resolve();
  });
}

export { syncBackoffMs };
