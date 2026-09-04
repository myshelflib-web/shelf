import type { OpenTab } from "./types";

/** Move `fromKey` next to `toKey` (before or after). Returns null if unchanged. */
export function reorderOpenTabs(
  tabs: OpenTab[],
  fromKey: string,
  toKey: string,
  place: "before" | "after"
): OpenTab[] | null {
  if (fromKey === toKey) return null;
  const from = tabs.findIndex((t) => t.key === fromKey);
  const to = tabs.findIndex((t) => t.key === toKey);
  if (from < 0 || to < 0) return null;

  const next = tabs.slice();
  const [item] = next.splice(from, 1);
  if (!item) return null;

  let insertAt = next.findIndex((t) => t.key === toKey);
  if (insertAt < 0) return null;
  if (place === "after") insertAt += 1;

  next.splice(insertAt, 0, item);
  const same =
    next.length === tabs.length &&
    next.every((t, i) => t.key === tabs[i]?.key);
  return same ? null : next;
}
