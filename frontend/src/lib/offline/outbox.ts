import { getStoredUserId } from "@/lib/accountLocalState";
import {
  OFFLINE_STORES,
  type OutboxEntry,
  type OutboxKind,
  type OutboxOp,
  type ProgressQueueEntry,
  outboxEntityId,
  outboxKind,
  progressQueueKey,
  withStore,
} from "./db";

function newOutboxId(): string {
  return crypto.randomUUID();
}

export async function readOutbox(userId: string): Promise<OutboxEntry[]> {
  return withStore(OFFLINE_STORES.outbox, "readonly", async (store) => {
    const all = await new Promise<OutboxEntry[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as OutboxEntry[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IDB getAll failed"));
    });
    return all.filter((e) => e.userId === userId);
  });
}

export async function readOutboxByKind(userId: string, kind: OutboxKind): Promise<OutboxEntry[]> {
  return (await readOutbox(userId)).filter((e) => outboxKind(e) === kind);
}

export async function putOutbox(entry: OutboxEntry): Promise<void> {
  await withStore(OFFLINE_STORES.outbox, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
}

export async function removeOutbox(id: string): Promise<void> {
  await withStore(OFFLINE_STORES.outbox, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    });
  });
}

export async function enqueueOutbox(
  userId: string,
  kind: OutboxKind,
  op: OutboxOp,
  entityId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await putOutbox({
    id: newOutboxId(),
    userId,
    kind,
    op,
    entityId,
    payload,
    createdAt: Date.now(),
  });
}

export async function remapOutboxEntityId(
  userId: string,
  kind: OutboxKind,
  fromId: string,
  toId: string,
): Promise<void> {
  const entries = await readOutboxByKind(userId, kind);
  for (const entry of entries) {
    if (outboxEntityId(entry) === fromId) {
      await putOutbox({ ...entry, entityId: toId, taskId: undefined });
    }
  }
}

export async function readProgressQueue(userId: string): Promise<ProgressQueueEntry[]> {
  return withStore(OFFLINE_STORES.progressQueue, "readonly", async (store) => {
    const all = await new Promise<ProgressQueueEntry[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as ProgressQueueEntry[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IDB getAll failed"));
    });
    return all.filter((e) => e.userId === userId);
  });
}

export async function putProgressQueue(entry: ProgressQueueEntry): Promise<void> {
  await withStore(OFFLINE_STORES.progressQueue, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
}

export async function removeProgressQueue(key: string): Promise<void> {
  await withStore(OFFLINE_STORES.progressQueue, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    });
  });
}

export async function mergeProgressQueue(
  userId: string,
  pageId: string,
  patch: ProgressQueueEntry["payload"],
): Promise<void> {
  const key = progressQueueKey(userId, pageId);
  const existing = await withStore(OFFLINE_STORES.progressQueue, "readonly", async (store) => {
    return new Promise<ProgressQueueEntry | undefined>((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as ProgressQueueEntry | undefined);
      req.onerror = () => reject(req.error ?? new Error("IDB get failed"));
    });
  });
  await putProgressQueue({
    key,
    userId,
    pageId,
    payload: {
      ...(existing?.payload ?? {}),
      ...patch,
      view: { ...(existing?.payload.view ?? {}), ...(patch.view ?? {}) },
    },
    updatedAt: Date.now(),
  });
}

export async function countAllPending(userId?: string | null): Promise<number> {
  const uid = userId ?? getStoredUserId();
  if (!uid) return 0;
  const [outbox, progress] = await Promise.all([
    readOutbox(uid),
    readProgressQueue(uid),
  ]);
  return outbox.length + progress.length;
}
