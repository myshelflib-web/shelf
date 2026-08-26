/** Which messages to remove for a single delete (user turns drop the next assistant). */
export function messageIdsToDelete(
  messages: Array<{ id: string; role: string }>,
  messageId: string
): string[] | null {
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return null;
  const ids = [messages[idx].id];
  if (messages[idx].role === "user") {
    const next = messages[idx + 1];
    if (next?.role === "assistant") ids.push(next.id);
  }
  return ids;
}

/**
 * Cursor-style edit: remove this message and everything after it.
 * Only valid for user turns (editing an assistant reply is not supported).
 */
export function messageIdsFromInclusive(
  messages: Array<{ id: string; role: string }>,
  messageId: string
): string[] | null {
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return null;
  if (messages[idx].role !== "user") return null;
  return messages.slice(idx).map((m) => m.id);
}

/** Drop every message at or after `fromIndex` (0-based, ascending createdAt). */
export function messageIdsFromIndex(
  messages: Array<{ id: string }>,
  fromIndex: number
): string[] | null {
  if (!Number.isInteger(fromIndex) || fromIndex < 0) return null;
  if (fromIndex >= messages.length) return [];
  return messages.slice(fromIndex).map((m) => m.id);
}
