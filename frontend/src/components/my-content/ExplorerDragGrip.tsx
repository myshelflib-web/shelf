"use client";

import clsx from "clsx";
import { GripVertical } from "lucide-react";
import type { DragEvent } from "react";

interface ExplorerDragGripProps {
  /** Move drag on — grip is draggable. */
  active: boolean;
  label?: string;
  className?: string;
  iconClassName?: string;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}

export function ExplorerDragGrip({
  active,
  label = "Drag to move",
  className,
  iconClassName = "w-3.5 h-3.5",
  onDragStart,
  onDragEnd,
}: ExplorerDragGripProps) {
  if (!active) return null;

  return (
    <span
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={label}
      aria-label={label}
      className={clsx(
        "p-0.5 shrink-0 select-none opacity-0 group-hover:opacity-100 transition-opacity",
        "text-[var(--text-secondary)] cursor-grab active:cursor-grabbing hover:text-[var(--text-primary)]",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className={iconClassName} strokeWidth={2.25} />
    </span>
  );
}
