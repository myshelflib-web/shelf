import type { StudyTask } from "@/types";
import type { LocalTask } from "./db";

export function masterTaskId(id: string): string {
  return id.split("::")[0];
}

export function taskInRange(task: StudyTask, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  if (!task.dueAt) return true;
  const due = new Date(task.dueAt).getTime();
  if (!Number.isFinite(due)) return true;
  if (to && due >= new Date(to).getTime()) return false;
  if (from && due < new Date(from).getTime()) {
    return task.kind !== "EVENT" && !task.completed;
  }
  return true;
}

/** Merge server tasks with local pending edits and offline-only creates. */
export function mergeTaskLists(serverTasks: StudyTask[], localTasks: LocalTask[]): StudyTask[] {
  const byMaster = new Map<string, LocalTask>();

  const deletedMasters = new Set(
    localTasks
      .filter((t) => t.syncStatus === "pending-delete")
      .map((t) => masterTaskId(t.id)),
  );

  for (const local of localTasks) {
    if (local.syncStatus === "pending-delete") continue;
    byMaster.set(masterTaskId(local.id), local);
  }

  const merged: StudyTask[] = [];
  const seen = new Set<string>();

  for (const server of serverTasks) {
    const key = masterTaskId(server.id);
    if (deletedMasters.has(key)) continue;
    seen.add(key);
    const local = byMaster.get(key);
    if (local && (local.localOnly || local.syncStatus === "pending")) {
      merged.push(stripLocalMeta(local));
    } else {
      merged.push(server);
    }
  }

  for (const local of localTasks) {
    if (local.syncStatus === "pending-delete") continue;
    if (local.localOnly && !seen.has(masterTaskId(local.id))) {
      merged.push(stripLocalMeta(local));
    }
  }

  return merged.sort((a, b) => {
    const at = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bt = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const aKey = Number.isFinite(at) ? at : Number.POSITIVE_INFINITY;
    const bKey = Number.isFinite(bt) ? bt : Number.POSITIVE_INFINITY;
    return aKey - bKey;
  });
}

export function stripLocalMeta(task: LocalTask): StudyTask {
  const { syncStatus: _s, localOnly: _l, updatedAt: _u, ...rest } = task;
  return rest;
}

export function toLocalTask(task: StudyTask, partial?: Partial<LocalTask>): LocalTask {
  return {
    ...task,
    syncStatus: "synced",
    localOnly: false,
    updatedAt: Date.now(),
    ...partial,
  };
}
