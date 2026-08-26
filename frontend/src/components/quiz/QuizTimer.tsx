"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/quiz/href";

export function QuizTimer({
  remainingSec,
  onExpire,
}: {
  remainingSec: number | null;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(remainingSec);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setLeft(remainingSec);
    setExpired(false);
  }, [remainingSec]);

  useEffect(() => {
    if (left == null) return;
    if (left <= 0) {
      if (!expired) {
        setExpired(true);
        onExpire();
      }
      return;
    }
    const id = window.setInterval(() => {
      setLeft((n) => (n == null ? n : Math.max(0, n - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [left, expired, onExpire]);

  if (left == null) return null;
  const urgent = left <= 60;
  return (
    <span
      className={`tabular-nums text-[13px] font-semibold ${
        urgent ? "text-red-400" : "text-[var(--text-secondary)]"
      }`}
    >
      {formatClock(left)}
    </span>
  );
}
