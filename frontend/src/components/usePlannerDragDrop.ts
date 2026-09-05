"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateTask } from "@/lib/offline/tasks";
import { toUserFacingError } from "@/lib/userFacingError";
import type { StudyTask } from "@/types";
import {
  PLANNER_DND_MIME,
  canDragItem,
  moveDueToDay,
  moveEndsWithDue,
} from "@/lib/plannerBoard";

function masterId(id: string) {
  return id.split("::")[0];
}

const EXIT_MS = 180;
const ENTER_MS = 220;
const ERROR_MS = 4500;

export type PlannerCardMotion = "exit" | "enter" | null;

export function usePlannerDragDrop(
  tasks: StudyTask[],
  setTasks: React.Dispatch<React.SetStateAction<StudyTask[]>>
) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [motionTaskId, setMotionTaskId] = useState<string | null>(null);
  const [cardMotion, setCardMotion] = useState<PlannerCardMotion>(null);
  const depthRef = useRef<Map<string, number>>(new Map());
  const rollbackTimers = useRef<number[]>([]);
  const errorTimer = useRef<number | null>(null);

  const clearRollbackTimers = useCallback(() => {
    for (const id of rollbackTimers.current) window.clearTimeout(id);
    rollbackTimers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearRollbackTimers();
      if (errorTimer.current != null) window.clearTimeout(errorTimer.current);
    };
  }, [clearRollbackTimers]);

  const showDropError = useCallback((message: string) => {
    setDropError(message);
    if (errorTimer.current != null) window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => {
      setDropError(null);
      errorTimer.current = null;
    }, ERROR_MS);
  }, []);

  const clearDropError = useCallback(() => {
    setDropError(null);
    if (errorTimer.current != null) {
      window.clearTimeout(errorTimer.current);
      errorTimer.current = null;
    }
  }, []);

  const resetDragUi = useCallback(() => {
    depthRef.current.clear();
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const onDragStart = useCallback((task: StudyTask, e: React.DragEvent) => {
    if (!canDragItem(task)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(PLANNER_DND_MIME, task.id);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    depthRef.current.clear();
    setDraggingId(task.id);
  }, []);

  const onDragEnd = useCallback(() => {
    resetDragUi();
  }, [resetDragUi]);

  const enterDrop = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault();
    const next = (depthRef.current.get(key) ?? 0) + 1;
    depthRef.current.set(key, next);
    setDropTarget(key);
  }, []);

  const allowDrop = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((cur) => (cur === key ? cur : key));
  }, []);

  const leaveDrop = useCallback((key: string) => {
    const next = (depthRef.current.get(key) ?? 0) - 1;
    if (next <= 0) {
      depthRef.current.delete(key);
      setDropTarget((cur) => (cur === key ? null : cur));
      return;
    }
    depthRef.current.set(key, next);
  }, []);

  const rollbackMove = useCallback(
    (id: string, prevDue: string | null, prevEnd: string | null | undefined) => {
      clearRollbackTimers();
      setMotionTaskId(id);
      setCardMotion("exit");

      const t1 = window.setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            masterId(t.id) === id
              ? { ...t, dueAt: prevDue, endsAt: prevEnd ?? null }
              : t
          )
        );
        setCardMotion("enter");
        const t2 = window.setTimeout(() => {
          setMotionTaskId(null);
          setCardMotion(null);
        }, ENTER_MS);
        rollbackTimers.current.push(t2);
      }, EXIT_MS);
      rollbackTimers.current.push(t1);
    },
    [clearRollbackTimers, setTasks]
  );

  const applyDrop = useCallback(
    (target: Date | "backlog", rawId: string) => {
      const task = tasks.find((t) => t.id === rawId);
      if (!task || !canDragItem(task)) return;

      const id = masterId(task.id);
      const prevDue = task.dueAt;
      const prevEnd = task.endsAt;
      let nextDue: string | null = null;
      let nextEnd: string | null = null;

      if (target === "backlog") {
        nextDue = null;
        nextEnd = null;
      } else {
        nextDue = moveDueToDay(task.dueAt, target);
        nextEnd = moveEndsWithDue(task.dueAt, task.endsAt, nextDue);
      }

      setTasks((prev) =>
        prev.map((t) =>
          masterId(t.id) === id ? { ...t, dueAt: nextDue, endsAt: nextEnd } : t
        )
      );
      resetDragUi();

      void updateTask(id, { dueAt: nextDue, endsAt: nextEnd })
        .then(() => {
          window.dispatchEvent(new Event("shelf:tasks-changed"));
        })
        .catch((err) => {
          const fallback = "Couldn't move that item. It's back where it was.";
          const message =
            err instanceof Error
              ? toUserFacingError(err.message, fallback)
              : fallback;
          showDropError(message);
          rollbackMove(id, prevDue, prevEnd);
        });
    },
    [tasks, setTasks, resetDragUi, showDropError, rollbackMove]
  );

  const finishDrop = useCallback(
    (target: Date | "backlog", e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const id =
        e.dataTransfer.getData(PLANNER_DND_MIME) ||
        e.dataTransfer.getData("text/plain");
      resetDragUi();
      if (id) applyDrop(target, id);
    },
    [applyDrop, resetDragUi]
  );

  return {
    dropTarget,
    draggingId,
    dropError,
    clearDropError,
    motionTaskId,
    cardMotion,
    onDragStart,
    onDragEnd,
    enterDrop,
    allowDrop,
    leaveDrop,
    finishDrop,
  };
}
