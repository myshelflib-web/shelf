import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import type { UserContentHighlight } from "@/types";
import {
  OFFLINE_STORES,
  type LocalHighlight,
  withStore,
} from "./db";
import {
  enqueueOutbox,
  putOutbox,
  readOutboxByKind,
  remapOutboxEntityId,
  removeOutbox,
} from "./outbox";
import { isOnline, dispatchOfflineSync } from "./network";
import { mergeHighlightLists, stripHighlightMeta, toLocalHighlight } from "./highlightMerge";

export type HighlightWriteInput = {
  userTopicId: string;
  text: string;
  startOffset?: number;
  endOffset?: number;
  color?: string;
  note?: string;
  kind?: "TEXT" | "REGION";
  pageNumber?: number;
  position?: UserContentHighlight["position"];
};

function newLocalId(): string {
  return `local-${crypto.randomUUID()}`;
}

async function readHighlightsForPage(userId: string, pageId: string): Promise<LocalHighlight[]> {
  return withStore(OFFLINE_STORES.highlights, "readonly", async (store) => {
    const all = await new Promise<LocalHighlight[]>((resolve, reject) => {
      const req = store.index("byPage").getAll(pageId);
      req.onsuccess = () => resolve((req.result as LocalHighlight[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IDB getAll failed"));
    });
    return all.filter((h) => h.userId === userId);
  });
}

async function readAllHighlights(userId: string): Promise<LocalHighlight[]> {
  return withStore(OFFLINE_STORES.highlights, "readonly", async (store) => {
    const all = await new Promise<LocalHighlight[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as LocalHighlight[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IDB getAll failed"));
    });
    return all.filter((h) => h.userId === userId);
  });
}

async function putHighlight(row: LocalHighlight): Promise<void> {
  await withStore(OFFLINE_STORES.highlights, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put(row);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
}

async function deleteHighlightRow(id: string): Promise<void> {
  await withStore(OFFLINE_STORES.highlights, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    });
  });
}

async function upsertServerHighlights(
  userId: string,
  pageId: string,
  highlights: UserContentHighlight[],
): Promise<void> {
  const local = await readHighlightsForPage(userId, pageId);
  const pending = new Set(
    local
      .filter((h) => h.localOnly || h.syncStatus === "pending" || h.syncStatus === "pending-delete")
      .map((h) => h.id),
  );
  for (const h of highlights) {
    if (pending.has(h.id)) continue;
    await putHighlight(toLocalHighlight(h, userId, pageId));
  }
}

export async function listHighlights(pageId: string): Promise<UserContentHighlight[]> {
  const userId = getStoredUserId();
  if (!userId) return [];

  let local: LocalHighlight[] = [];
  try {
    local = await readHighlightsForPage(userId, pageId);
  } catch {
    local = [];
  }

  if (isOnline()) {
    try {
      const { highlights } = await api.myContent.listHighlights(pageId);
      try {
        await upsertServerHighlights(userId, pageId, highlights);
        const fresh = await readHighlightsForPage(userId, pageId);
        return mergeHighlightLists(highlights, fresh, pageId);
      } catch {
        return mergeHighlightLists(highlights, local, pageId);
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        return mergeHighlightLists([], local, pageId);
      }
    }
  }

  return mergeHighlightLists([], local, pageId);
}

export async function createHighlight(data: HighlightWriteInput): Promise<UserContentHighlight> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to highlight.");

  if (isOnline()) {
    try {
      const { highlight } = await api.myContent.createHighlight({
        ...data,
        position: data.position ?? undefined,
      });
      await putHighlight(toLocalHighlight(highlight, userId, data.userTopicId));
      return highlight;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const id = newLocalId();
  const highlight = toLocalHighlight(
    {
      id,
      userTopicId: data.userTopicId,
      text: data.text,
      startOffset: data.startOffset ?? 0,
      endOffset: data.endOffset ?? 0,
      color: data.color ?? "yellow",
      note: data.note ?? null,
      kind: data.kind ?? "TEXT",
      pageNumber: data.pageNumber ?? null,
      position: data.position ?? null,
    },
    userId,
    data.userTopicId,
    { syncStatus: "pending", localOnly: true },
  );
  await putHighlight(highlight);
  await enqueueOutbox(userId, "highlight", "create", id, { ...data });
  dispatchOfflineSync();
  return stripHighlightMeta(highlight);
}

export async function updateHighlight(
  id: string,
  data: { note?: string | null },
  pageId: string,
): Promise<UserContentHighlight> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to update highlights.");

  const localRows = await readAllHighlights(userId);
  const existing = localRows.find((h) => h.id === id);

  if (isOnline() && existing && !existing.localOnly) {
    try {
      const { highlight } = await api.myContent.updateHighlight(id, data);
      await putHighlight(toLocalHighlight(highlight, userId, pageId));
      return highlight;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const base = existing
    ? stripHighlightMeta(existing)
    : ({
        id,
        userTopicId: pageId,
        text: "",
        startOffset: 0,
        endOffset: 0,
        color: "yellow",
        note: data.note ?? null,
      } as UserContentHighlight);

  const next = toLocalHighlight(
    { ...base, note: data.note === undefined ? base.note : data.note },
    userId,
    pageId,
    { syncStatus: "pending", localOnly: existing?.localOnly ?? false },
  );
  await putHighlight(next);

  if (existing?.localOnly) {
    const outbox = await readOutboxByKind(userId, "highlight");
    const createEntry = outbox.find((e) => e.entityId === id && e.op === "create");
    if (createEntry) {
      await putOutbox({
        ...createEntry,
        payload: { ...createEntry.payload, ...data },
      });
    } else {
      await enqueueOutbox(userId, "highlight", "update", id, { ...data, pageId });
    }
  } else {
    await enqueueOutbox(userId, "highlight", "update", id, { ...data, pageId });
  }

  dispatchOfflineSync();
  return stripHighlightMeta(next);
}

export async function deleteHighlight(id: string, pageId: string): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to delete highlights.");

  const localRows = await readAllHighlights(userId);
  const existing = localRows.find((h) => h.id === id);

  if (isOnline() && existing && !existing.localOnly) {
    try {
      await api.myContent.deleteHighlight(id);
      await deleteHighlightRow(id);
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  if (existing?.localOnly) {
    await deleteHighlightRow(id);
    const outbox = await readOutboxByKind(userId, "highlight");
    for (const entry of outbox.filter((e) => e.entityId === id)) {
      await removeOutbox(entry.id);
    }
  } else if (existing) {
    await putHighlight({
      ...existing,
      syncStatus: "pending-delete",
      updatedAt: Date.now(),
    });
    await enqueueOutbox(userId, "highlight", "delete", id, { pageId });
  }

  dispatchOfflineSync();
}

export async function flushOfflineHighlights(): Promise<number> {
  const userId = getStoredUserId();
  if (!userId || !isOnline()) return 0;

  const entries = (await readOutboxByKind(userId, "highlight")).sort(
    (a, b) => a.createdAt - b.createdAt,
  );
  let synced = 0;

  for (const entry of entries) {
    try {
      if (entry.op === "create") {
        const payload = entry.payload as HighlightWriteInput;
        const { highlight } = await api.myContent.createHighlight({
          ...payload,
          position: payload.position ?? undefined,
        });
        await deleteHighlightRow(entry.entityId);
        await putHighlight(toLocalHighlight(highlight, userId, payload.userTopicId));
        await remapOutboxEntityId(userId, "highlight", entry.entityId, highlight.id);
      } else if (entry.op === "update") {
        const { highlight } = await api.myContent.updateHighlight(entry.entityId, {
          note: entry.payload.note as string | null | undefined,
        });
        const pageId = String(entry.payload.pageId ?? highlight.userTopicId);
        await putHighlight(toLocalHighlight(highlight, userId, pageId));
      } else if (entry.op === "delete") {
        await api.myContent.deleteHighlight(entry.entityId);
        await deleteHighlightRow(entry.entityId);
      }
      await removeOutbox(entry.id);
      synced += 1;
    } catch (err) {
      if (isNetworkError(err)) break;
      throw err;
    }
  }

  return synced;
}
