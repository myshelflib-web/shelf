import type { DragEvent } from "react";

export type DropPlace = "before" | "after";

/** True when the drag started on a control that should click, not drag. */
export function isExplorerDragFromControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button, a, input, textarea, [role='checkbox']")
  );
}

export function dropPlaceFromY(e: DragEvent<HTMLElement>): DropPlace {
  const rect = e.currentTarget.getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

/** Insert-before id for a hover over `hoveredId` (null = append). */
export function beforeIdForPlace(
  ids: string[],
  hoveredId: string,
  place: DropPlace
): string | null {
  if (place === "before") return hoveredId;
  const idx = ids.indexOf(hoveredId);
  if (idx === -1 || idx >= ids.length - 1) return null;
  return ids[idx + 1];
}

export function relatedStillInside(
  current: EventTarget & HTMLElement,
  related: EventTarget | null
): boolean {
  return Boolean(related && current.contains(related as Node));
}
