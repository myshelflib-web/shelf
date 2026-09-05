import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  listTasks,
  peekLocalTasks,
  updateTask,
  type TaskWriteInput,
} from "@/lib/offline/tasks";
import { StudyItemKind, StudyTask } from "@/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  runWithProgressUi,
  useDeleteProgressOptional,
} from "@/components/DeleteProgressProvider";
import { shortPlannerTitle } from "@/components/PlannerFlashToast";
import type { usePlannerCardMotion } from "@/components/usePlannerCardMotion";

function masterId(id: string) {
  return id.split("::")[0];
}

type CardMotionApi = Pick<
  ReturnType<typeof usePlannerCardMotion>,
  "playEnter" | "playExitThen"
>;

export type PlannerCreateInput = {
  title: string;
  dueAt: string | null;
  endsAt: string | null;
  kind: StudyItemKind;
  href: string | null;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurUntil: string | null;
};

export function usePlannerTasks(
  from: Date,
  to: Date,
  motion: CardMotionApi
) {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const progress = useDeleteProgressOptional();

  const loadTasks = useCallback((opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setTasksLoading(true);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    let settled = false;
    void peekLocalTasks(fromIso, toIso).then((cached) => {
      if (settled || cached.length === 0) return;
      setTasks(cached);
      if (!silent) setTasksLoading(false);
    });
    listTasks(fromIso, toIso)
      .then((next) => {
        settled = true;
        setTasks(next);
      })
      .catch(() => {
        settled = true;
      })
      .finally(() => {
        if (!silent) setTasksLoading(false);
      });
  }, [from, to]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleDone = async (task: StudyTask) => {
    const next = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: next } : t))
    );
    try {
      await updateTask(masterId(task.id), { completed: next });
      if (next) {
        track(AnalyticsEvents.plannerTaskCompleted, {
          kind: task.kind ?? "TASK",
          hadHref: Boolean(task.href),
        });
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !next } : t))
      );
    }
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  };

  const createItem = async (payload: PlannerCreateInput) => {
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimistic: StudyTask = {
      id: tempId,
      title: payload.title,
      dueAt: payload.dueAt,
      endsAt: payload.endsAt,
      completed: false,
      kind: payload.kind,
      href: payload.href,
      recurrence: payload.recurrence,
      recurUntil: payload.recurUntil,
    };
    setTasks((prev) => [optimistic, ...prev]);
    motion.playEnter(tempId);

    const label = `Creating “${shortPlannerTitle(payload.title)}”…`;
    const work = async () => {
      const created = await createTask({
        title: payload.title,
        dueAt: payload.dueAt,
        endsAt: payload.endsAt ?? undefined,
        kind: payload.kind,
        href: payload.href ?? undefined,
        recurrence: payload.recurrence,
        recurUntil: payload.recurUntil,
      });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      window.dispatchEvent(new Event("shelf:tasks-changed"));
      return created;
    };

    try {
      if (progress) await runWithProgressUi(progress, label, work);
      else await work();
    } catch (err) {
      await motion.playExitThen(tempId, () => {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
      });
      throw err;
    }
  };

  const updateItem = async (id: string, payload: PlannerCreateInput) => {
    const master = masterId(id);
    let snapshot: StudyTask | undefined;
    setTasks((prev) => {
      snapshot = prev.find((t) => masterId(t.id) === master);
      return prev.map((t) =>
        masterId(t.id) === master
          ? {
              ...t,
              title: payload.title,
              dueAt: payload.dueAt,
              endsAt: payload.endsAt,
              kind: payload.kind,
              href: payload.href,
              recurrence: payload.recurrence,
              recurUntil: payload.recurUntil,
            }
          : t
      );
    });

    const label = `Saving “${shortPlannerTitle(payload.title)}”…`;
    const body: Partial<TaskWriteInput> = {
      title: payload.title,
      dueAt: payload.dueAt,
      endsAt: payload.endsAt,
      kind: payload.kind,
      href: payload.href,
      recurrence: payload.recurrence,
      recurUntil: payload.recurUntil,
    };
    const work = async () => {
      await updateTask(master, body);
      window.dispatchEvent(new Event("shelf:tasks-changed"));
    };

    try {
      if (progress) await runWithProgressUi(progress, label, work);
      else await work();
    } catch (err) {
      if (snapshot) {
        const snap = snapshot;
        setTasks((prev) =>
          prev.map((t) => (masterId(t.id) === master ? snap : t))
        );
      }
      throw err;
    }
  };

  const remove = async (id: string) => {
    const master = masterId(id);
    const existing = tasks.find((t) => masterId(t.id) === master);
    if (!existing) return;

    const label = `Deleting “${shortPlannerTitle(existing.title)}”…`;
    const snapshot = existing;

    const work = async () => {
      await motion.playExitThen(master, () => {
        setTasks((prev) => prev.filter((t) => masterId(t.id) !== master));
      });
      await deleteTask(master);
      window.dispatchEvent(new Event("shelf:tasks-changed"));
    };

    try {
      if (progress) await runWithProgressUi(progress, label, work);
      else await work();
    } catch (err) {
      setTasks((prev) => {
        if (prev.some((t) => masterId(t.id) === master)) return prev;
        return [snapshot, ...prev];
      });
      motion.playEnter(master);
      throw err;
    }
  };

  return {
    tasks,
    setTasks,
    tasksLoading,
    loadTasks,
    toggleDone,
    createItem,
    updateItem,
    remove,
  };
}
