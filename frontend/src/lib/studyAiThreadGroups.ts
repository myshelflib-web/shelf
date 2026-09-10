import type { ChatThreadSummary } from "@/types";

export type ThreadGroup = { label: string; threads: ChatThreadSummary[] };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isThreadPinned(t: ChatThreadSummary): boolean {
  return Boolean(t.pinnedAt);
}

export function filterThreads(
  threads: ChatThreadSummary[],
  query: string
): ChatThreadSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return threads;
  return threads.filter((t) => t.title.toLowerCase().includes(q));
}

function sortByUpdatedDesc(a: ChatThreadSummary, b: ChatThreadSummary): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function sortPinnedFirst(a: ChatThreadSummary, b: ChatThreadSummary): number {
  const ap = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
  const bp = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
  if (ap !== bp) return bp - ap;
  return sortByUpdatedDesc(a, b);
}

export function groupThreadsByDate(
  threads: ChatThreadSummary[]
): ThreadGroup[] {
  const pinned = threads
    .filter(isThreadPinned)
    .sort(sortPinnedFirst);
  const unpinned = threads
    .filter((t) => !isThreadPinned(t))
    .sort(sortByUpdatedDesc);

  const groups: ThreadGroup[] = [];
  if (pinned.length > 0) {
    groups.push({ label: "Pinned", threads: pinned });
  }

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

  for (const t of unpinned) {
    const d = startOfDay(new Date(t.updatedAt));
    if (d >= today) buckets.Today.push(t);
    else if (d >= yesterday) buckets.Yesterday.push(t);
    else if (d >= weekAgo) buckets["Previous 7 days"].push(t);
    else buckets.Older.push(t);
  }

  for (const [label, items] of Object.entries(buckets)) {
    if (items.length > 0) groups.push({ label, threads: items });
  }
  return groups;
}
