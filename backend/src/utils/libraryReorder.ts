/** Merge a reordered subset back into the full ordered id list. */
export function mergeReorder(allIds: string[], reorderedIds: string[]): string[] {
  const reorderSet = new Set(reorderedIds);
  const without = allIds.filter((id) => !reorderSet.has(id));
  const firstOriginalIdx = allIds.findIndex((id) => reorderSet.has(id));
  const insertAt = allIds
    .slice(0, firstOriginalIdx)
    .filter((id) => !reorderSet.has(id)).length;
  return [...without.slice(0, insertAt), ...reorderedIds, ...without.slice(insertAt)];
}

export async function applyOrderUpdates(
  updates: { id: string; order: number }[],
  updateFn: (id: string, order: number) => Promise<unknown>
) {
  for (const { id, order } of updates) {
    await updateFn(id, order);
  }
}
