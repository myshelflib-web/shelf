"use client";

import { useEffect, useRef, useState } from "react";
import type { LivelySurface } from "@/lib/livelyCopy";
import { useLivelySurfaceLine } from "@/hooks/useLivelyCopy";

/** Softly fading surface line — use under titles / empty states. */
export function LivelyLine({
  surface,
  salt = "",
  className = "text-sm text-[var(--text-muted)]",
  as: Tag = "p",
}: {
  surface: LivelySurface;
  salt?: string;
  className?: string;
  as?: "p" | "span";
}) {
  const line = useLivelySurfaceLine(surface, salt);
  const [visible, setVisible] = useState(true);
  const [shown, setShown] = useState(line);
  const allowFade = useRef(false);

  useEffect(() => {
    if (line === shown) {
      allowFade.current = true;
      return;
    }
    // Remount / first sync: snap quietly so route changes don’t pop.
    if (!allowFade.current) {
      setShown(line);
      setVisible(true);
      allowFade.current = true;
      return;
    }
    setVisible(false);
    const id = window.setTimeout(() => {
      setShown(line);
      setVisible(true);
    }, 180);
    return () => window.clearTimeout(id);
  }, [line, shown]);

  return (
    <Tag
      className={`lively-line ${visible ? "lively-line-in" : "lively-line-out"} ${className}`}
    >
      {shown}
    </Tag>
  );
}
