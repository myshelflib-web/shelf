/** Heuristic standalone search query from a follow-up turn (no extra LLM call). */

const FOLLOW_UP =
  /^(what|why|how|explain|and |also |more|continue|yes|no|ok\b|please|go on|expand|clarify)\b/i;
const NEEDS_CONTEXT =
  /\b(it|this|that|these|those|they|them|the (first|second|third|above|previous|latter|former)|that one)\b/i;

function oneLine(text: string, max: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export function rewriteSearchQuery(
  query: string,
  history?: Array<{ role: string; content: string }>
): string {
  const q = oneLine(query, 800);
  if (!q) return q;
  const lastUser = [...(history ?? [])]
    .reverse()
    .find((m) => m.role === "user")
    ?.content;
  if (!lastUser?.trim()) return q;
  const prior = oneLine(lastUser, 180);
  if (!prior || prior.toLowerCase() === q.toLowerCase()) return q;
  const needsContext =
    q.length < 56 || FOLLOW_UP.test(q) || NEEDS_CONTEXT.test(q);
  if (!needsContext) return q;
  return `${prior}\n${q}`;
}
