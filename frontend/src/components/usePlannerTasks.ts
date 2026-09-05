import { useCallback, useEffect, useState } from "react";
import {
  deleteTask,
  listTasks,
  peekLocalTasks,
  updateTask,
} from "@/lib/offline/tasks";
import { StudyTask } from "@/types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  runWithProgressUi,
  useDeleteProgressOptional,
} from "@/components/DeleteProgressProvider";
import { shortPlannerTitle } from "@/components/PlannerFlashToast";

function masterId(id: string) {
  return id.split("::")[0];
}

export function usePlannerTasks(from: Date, to: Date) {
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

  const remove = async (id: string) => {
    const master = masterId(id);
    const existing = tasks.find((t) => masterId(t.id) === master);
    const label = existing
      ? `Deleting “${shortPlannerTitle(existing.title)}”…`
      : "Deleting task…";
    let snapshot: StudyTask[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.filter((t) => masterId(t.id) !== master);
    });
    try {
      const work = () => deleteTask(master);
      if (progress) await runWithProgressUi(progress, label, work);
      else await work();
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
    window.dispatchEvent(new Event("shelf:tasks-changed"));
  };

  return { tasks, setTasks, tasksLoading, loadTasks, toggleDone, remove };
}
