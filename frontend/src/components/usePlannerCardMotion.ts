"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PlannerCardMotion = "exit" | "enter" | null;

export const PLANNER_EXIT_MS = 180;
export const PLANNER_ENTER_MS = 220;

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function usePlannerCardMotion() {
  const [motionTaskId, setMotionTaskId] = useState<string | null>(null);
  const [cardMotion, setCardMotion] = useState<PlannerCardMotion>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const clearMotion = useCallback(() => {
    setMotionTaskId(null);
    setCardMotion(null);
  }, []);

  const playEnter = useCallback(
    (id: string) => {
      clearTimers();
      setMotionTaskId(id);
      setCardMotion("enter");
      const t = window.setTimeout(() => {
        clearMotion();
      }, PLANNER_ENTER_MS);
      timersRef.current.push(t);
    },
    [clearTimers, clearMotion]
  );

  /** Exit animation, then run `after`, then clear motion. */
  const playExitThen = useCallback(
    async (id: string, after: () => void) => {
      clearTimers();
      setMotionTaskId(id);
      setCardMotion("exit");
      await sleep(PLANNER_EXIT_MS);
      after();
      clearMotion();
    },
    [clearTimers, clearMotion]
  );

  /**
   * Exit at current spot, apply state change (e.g. move columns), then enter.
   * Used for drag-drop rollback.
   */
  const playExitSwapEnter = useCallback(
    (id: string, swap: () => void) => {
      clearTimers();
      setMotionTaskId(id);
      setCardMotion("exit");
      const t1 = window.setTimeout(() => {
        swap();
        setCardMotion("enter");
        const t2 = window.setTimeout(() => {
          clearMotion();
        }, PLANNER_ENTER_MS);
        timersRef.current.push(t2);
      }, PLANNER_EXIT_MS);
      timersRef.current.push(t1);
    },
    [clearTimers, clearMotion]
  );

  return {
    motionTaskId,
    cardMotion,
    playEnter,
    playExitThen,
    playExitSwapEnter,
    clearMotion,
  };
}
