import { isCacheFresh } from "@/lib/cacheTtl";
import { OFFLINE_STORES, withStore } from "./db";

export type OfflineMetaRow = {
  key: string;
  cachedAt: number;
};

export function offlineMetaKey(kind: "tasks" | "highlights", userId: string): string {
  return `${kind}:${userId}`;
}

async function readMeta(key: string): Promise<OfflineMetaRow | null> {
  return withStore(OFFLINE_STORES.meta, "readonly", async (store) => {
    const row = await new Promise<OfflineMetaRow | undefined>((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as OfflineMetaRow | undefined);
      req.onerror = () => reject(req.error ?? new Error("IDB meta get failed"));
    });
    return row ?? null;
  });
}

export async function touchOfflineMeta(key: string): Promise<void> {
  await withStore(OFFLINE_STORES.meta, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ key, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB meta put failed"));
    });
  });
}

export async function isOfflineMetaFresh(key: string): Promise<boolean> {
  try {
    const row = await readMeta(key);
    return isCacheFresh(row?.cachedAt);
  } catch {
    return false;
  }
}
