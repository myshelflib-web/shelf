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
