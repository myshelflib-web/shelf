import type { OpenTab } from "./types";

/** Move `fromKey` to `toIndex` (0-based). Returns null if unchanged. */
export function reorderOpenTabs(
  tabs: OpenTab[],
  fromKey: string,
  toIndex: number
): OpenTab[] | null {
  const from = tabs.findIndex((t) => t.key === fromKey);
  if (from < 0) return null;
  const clamped = Math.max(0, Math.min(tabs.length - 1, toIndex));
  if (from === clamped) return null;

  const next = tabs.slice();
  const [item] = next.splice(from, 1);
  if (!item) return null;
  next.splice(clamped, 0, item);
  return next;
}

/**
 * Stable insert index for a dragged tab from pointer X (skips the dragged
 * tab’s own box so live reorder doesn’t oscillate).
 */
export function tabIndexFromPointerX(
  clientX: number,
  tabRects: ReadonlyArray<{ key: string; left: number; width: number }>,
  fromKey: string
): number {
  const others = tabRects.filter((t) => t.key !== fromKey);
  if (others.length === 0) return 0;

  let amongOthers = others.length;
  for (let i = 0; i < others.length; i += 1) {
    const r = others[i]!;
    if (clientX < r.left + r.width / 2) {
      amongOthers = i;
      break;
    }
  }
  // Result order: others[0..amongOthers) + fromKey + others[amongOthers..)
  return amongOthers;
}
