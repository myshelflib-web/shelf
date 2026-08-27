"use client";

import clsx from "clsx";
import { GripVertical } from "lucide-react";
import type { DragEvent } from "react";

const MANUAL_ORDER_HINT = "Switch Sort by to Manual order to drag";

interface ExplorerDragGripProps {
  /** Manual order on — grip is draggable. */
  active: boolean;
  /** Show a muted grip when sort is not Manual order. */
  showHint?: boolean;
  label?: string;
  className?: string;
  iconClassName?: string;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}

export function ExplorerDragGrip({
  active,
  showHint = false,
  label = "Drag to move",
  className,
  iconClassName = "w-3.5 h-3.5",
  onDragStart,
  onDragEnd,
}: ExplorerDragGripProps) {
  if (!active && !showHint) return null;

  return (
    <span
      draggable={active}
      onDragStart={active ? onDragStart : undefined}
      onDragEnd={active ? onDragEnd : undefined}
      title={active ? label : MANUAL_ORDER_HINT}
      aria-label={active ? label : MANUAL_ORDER_HINT}
      className={clsx(
        "p-0.5 shrink-0 select-none opacity-0 group-hover:opacity-100 transition-opacity",
        active
          ? "text-[var(--text-secondary)] cursor-grab active:cursor-grabbing hover:text-[var(--text-primary)]"
          : "text-[var(--text-muted)]/50 cursor-default",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical className={iconClassName} strokeWidth={2.25} />
    </span>
  );
}

export { MANUAL_ORDER_HINT };
