import type { ChatThreadSummary } from "@/types";

export type ThreadGroup = { label: string; threads: ChatThreadSummary[] };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function filterThreads(
  threads: ChatThreadSummary[],
  query: string
): ChatThreadSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return threads;
  return threads.filter((t) => t.title.toLowerCase().includes(q));
}

export function groupThreadsByDate(
  threads: ChatThreadSummary[]
): ThreadGroup[] {
  const sorted = [...threads].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets: Record<string, ChatThreadSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const t of sorted) {
    const d = startOfDay(new Date(t.updatedAt));
    if (d >= today) buckets.Today.push(t);
    else if (d >= yesterday) buckets.Yesterday.push(t);
    else if (d >= weekAgo) buckets["Previous 7 days"].push(t);
    else buckets.Older.push(t);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, threads: items }));
}
