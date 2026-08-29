import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import type { StudyItemKind, StudyTask } from "@/types";
import {
  type LocalTask,
  OFFLINE_STORES,
  outboxEntityId,
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
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  masterTaskId,
  mergeTaskLists,
  stripLocalMeta,
  taskInRange,
  toLocalTask,
} from "./taskMerge";

export type TaskWriteInput = {
  title: string;
  dueAt?: string | null;
  endsAt?: string | null;
  notes?: string;
  articleId?: string;
  href?: string | null;
  kind?: StudyItemKind;
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurUntil?: string | null;
  completed?: boolean;
};

function newLocalId(): string {
  return `local-${crypto.randomUUID()}`;
}

async function readAllLocalTasks(userId: string): Promise<LocalTask[]> {
  return withStore(OFFLINE_STORES.tasks, "readonly", async (store) => {
    const all = await new Promise<LocalTask[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as LocalTask[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error("IDB getAll failed"));
    });
    return all.filter((t) => (t as LocalTask & { userId?: string }).userId === userId);
  });
}

async function putLocalTask(userId: string, task: LocalTask): Promise<void> {
  await withStore(OFFLINE_STORES.tasks, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ ...task, userId });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB put failed"));
    });
  });
}

async function deleteLocalTask(taskId: string): Promise<void> {
  await withStore(OFFLINE_STORES.tasks, "readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(taskId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("IDB delete failed"));
    });
  });
}

async function replaceLocalTaskId(userId: string, fromId: string, serverTask: StudyTask): Promise<void> {
  await deleteLocalTask(fromId);
  await putLocalTask(userId, toLocalTask(serverTask));
}

async function upsertServerTasks(userId: string, tasks: StudyTask[]): Promise<void> {
  const local = await readAllLocalTasks(userId);
  const pendingByMaster = new Map(
    local
      .filter((t) => t.localOnly || t.syncStatus === "pending" || t.syncStatus === "pending-delete")
      .map((t) => [masterTaskId(t.id), t]),
  );

  for (const server of tasks) {
    const key = masterTaskId(server.id);
    if (pendingByMaster.has(key)) continue;
    await putLocalTask(userId, toLocalTask(server));
  }
}

export async function peekLocalTasks(
  from?: string,
  to?: string
): Promise<StudyTask[]> {
  const userId = getStoredUserId();
  if (!userId) return [];
  const local = await readAllLocalTasks(userId);
  return mergeTaskLists([], local).filter((t) => taskInRange(t, from, to));
}

export async function listTasks(from?: string, to?: string): Promise<StudyTask[]> {
  const userId = getStoredUserId();
  if (!userId) return [];

  const local = await readAllLocalTasks(userId);

  if (isOnline()) {
    try {
      const { tasks } = await api.tasks.list(from, to);
      await upsertServerTasks(userId, tasks);
      const freshLocal = await readAllLocalTasks(userId);
      const merged = mergeTaskLists(tasks, freshLocal);
      return merged.filter((t) => taskInRange(t, from, to));
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const merged = mergeTaskLists([], local);
  return merged.filter((t) => taskInRange(t, from, to));
}

export async function createTask(data: TaskWriteInput): Promise<StudyTask> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to create tasks.");

  if (isOnline()) {
    try {
      const { task } = await api.tasks.create({
        title: data.title,
        dueAt: data.dueAt ?? null,
        endsAt: data.endsAt ?? undefined,
        notes: data.notes,
        articleId: data.articleId,
        href: data.href ?? undefined,
        kind: data.kind,
        recurrence: data.recurrence,
        recurUntil: data.recurUntil,
      });
      await putLocalTask(userId, toLocalTask(task));
      track(AnalyticsEvents.plannerTaskCreated, {
        kind: task.kind ?? "TASK",
        hasDueAt: Boolean(task.dueAt),
        hasHref: Boolean(task.href),
      });
      return task;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const id = newLocalId();
  const task = toLocalTask(
    {
      id,
      title: data.title,
      dueAt: data.dueAt ?? null,
      endsAt: data.endsAt ?? null,
      notes: data.notes ?? null,
      kind: data.kind ?? "TASK",
      completed: false,
      href: data.href ?? null,
      articleId: data.articleId ?? null,
      recurrence: data.recurrence ?? "NONE",
      recurUntil: data.recurUntil ?? null,
    },
    { syncStatus: "pending", localOnly: true },
  );
  await putLocalTask(userId, task);
  await enqueueOutbox(userId, "task", "create", id, { ...data });
  dispatchOfflineSync();
  track(AnalyticsEvents.plannerTaskCreated, {
    kind: task.kind ?? "TASK",
    hasDueAt: Boolean(task.dueAt),
    hasHref: Boolean(task.href),
    offline: true,
  });
  return stripLocalMeta(task);
}

export async function updateTask(id: string, data: Partial<TaskWriteInput>): Promise<StudyTask> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to update tasks.");

  const master = masterTaskId(id);
  const localTasks = await readAllLocalTasks(userId);
  const existing =
    localTasks.find((t) => t.id === id) ??
    localTasks.find((t) => masterTaskId(t.id) === master);

  if (isOnline() && existing && !existing.localOnly) {
    try {
      const { task } = await api.tasks.update(master, data);
      await putLocalTask(userId, toLocalTask(task));
      return task;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  const base = existing
    ? stripLocalMeta(existing)
    : ({
        id: master,
        title: data.title ?? "Task",
        dueAt: data.dueAt ?? null,
        completed: data.completed ?? false,
        kind: data.kind ?? "TASK",
      } as StudyTask);

  const next = toLocalTask(
    {
      ...base,
      ...data,
      href: data.href === undefined ? base.href : data.href,
      endsAt: data.endsAt === undefined ? base.endsAt : data.endsAt,
    },
    {
      syncStatus: "pending",
      localOnly: existing?.localOnly ?? false,
    },
  );
  await putLocalTask(userId, next);

  if (existing?.localOnly) {
    const outbox = await readOutboxByKind(userId, "task");
    const createEntry = outbox.find((e) => outboxEntityId(e) === existing.id && e.op === "create");
    if (createEntry) {
      await putOutbox({
        ...createEntry,
        payload: { ...createEntry.payload, ...data },
      });
    } else {
      await enqueueOutbox(userId, "task", "update", master, { ...data });
    }
  } else {
    await enqueueOutbox(userId, "task", "update", master, { ...data });
  }

  dispatchOfflineSync();
  return stripLocalMeta(next);
}

export async function deleteTask(id: string): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("Sign in to delete tasks.");

  const master = masterTaskId(id);
  const localTasks = await readAllLocalTasks(userId);
  const existing = localTasks.find((t) => t.id === id || masterTaskId(t.id) === master);

  if (isOnline() && existing && !existing.localOnly) {
    try {
      await api.tasks.delete(master);
      await deleteLocalTask(existing.id);
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  if (existing?.localOnly) {
    await deleteLocalTask(existing.id);
    const outbox = await readOutboxByKind(userId, "task");
    for (const entry of outbox.filter((e) => outboxEntityId(e) === existing.id)) {
      await removeOutbox(entry.id);
    }
  } else if (existing) {
    await putLocalTask(userId, { ...existing, syncStatus: "pending-delete", updatedAt: Date.now() });
    await enqueueOutbox(userId, "task", "delete", master, {});
  }

  dispatchOfflineSync();
}

export async function flushOfflineTasks(): Promise<number> {
  const userId = getStoredUserId();
  if (!userId || !isOnline()) return 0;

  const entries = (await readOutboxByKind(userId, "task")).sort(
    (a, b) => a.createdAt - b.createdAt,
  );
  let synced = 0;

  for (const entry of entries) {
    const entityId = outboxEntityId(entry);
    try {
      if (entry.op === "create") {
        const payload = entry.payload as TaskWriteInput;
        const { task } = await api.tasks.create({
          title: String(payload.title),
          dueAt: payload.dueAt ?? null,
          endsAt: payload.endsAt ?? undefined,
          notes: payload.notes,
          articleId: payload.articleId,
          href: payload.href ?? undefined,
          kind: payload.kind,
          recurrence: payload.recurrence,
          recurUntil: payload.recurUntil,
        });
        await replaceLocalTaskId(userId, entityId, task);
        await remapOutboxEntityId(userId, "task", entityId, task.id);
      } else if (entry.op === "update") {
        const { task } = await api.tasks.update(entityId, entry.payload);
        await putLocalTask(userId, toLocalTask(task));
      } else if (entry.op === "delete") {
        await api.tasks.delete(masterTaskId(entityId));
        await deleteLocalTask(entityId);
        const local = await readAllLocalTasks(userId);
        for (const t of local.filter((x) => masterTaskId(x.id) === masterTaskId(entityId))) {
          await deleteLocalTask(t.id);
        }
      }
      await removeOutbox(entry.id);
      synced += 1;
    } catch (err) {
      if (isNetworkError(err)) break;
      throw err;
    }
  }

  if (synced > 0) {
    dispatchOfflineSync();
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  }
  return synced;
}
