export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export function parseRecurrence(value: unknown): Recurrence {
  if (value === "DAILY" || value === "WEEKLY" || value === "MONTHLY") {
    return value;
  }
  return "NONE";
}

export function addPeriod(d: Date, recurrence: Recurrence): Date {
  const x = new Date(d.getTime());
  if (recurrence === "DAILY") x.setDate(x.getDate() + 1);
  else if (recurrence === "WEEKLY") x.setDate(x.getDate() + 7);
  else if (recurrence === "MONTHLY") x.setMonth(x.getMonth() + 1);
  return x;
}

function ymd(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function masterId(id: string) {
  return id.split("::")[0];
}

type Expandable = {
  id: string;
  kind: string;
  dueAt: Date;
  endsAt: Date | null;
  recurrence?: string | null;
  recurUntil?: Date | null;
};

/** Expand recurring events into occurrences that overlap [from, to). */
export function expandInRange<T extends Expandable>(
  items: T[],
  from: Date,
  to: Date
): Array<T & { seriesId: string; seriesStart: Date }> {
  const out: Array<T & { seriesId: string; seriesStart: Date }> = [];

  for (const item of items) {
    const rec = parseRecurrence(item.recurrence);
    if (item.kind !== "EVENT" || rec === "NONE") {
      if (item.dueAt >= from && item.dueAt < to) {
        out.push({ ...item, seriesId: item.id, seriesStart: item.dueAt });
      }
      continue;
    }

    const duration =
      item.endsAt != null ? item.endsAt.getTime() - item.dueAt.getTime() : 0;
    const rangeEnd = to;
    const seriesEnd = item.recurUntil ?? rangeEnd;
    let start = new Date(item.dueAt.getTime());
    let guard = 0;

    while (start < from && start <= seriesEnd && guard++ < 800) {
      start = addPeriod(start, rec);
    }

    while (start < rangeEnd && start <= seriesEnd && guard++ < 1600) {
      const isOrigin = start.getTime() === item.dueAt.getTime();
      out.push({
        ...item,
        id: isOrigin ? item.id : `${item.id}::${ymd(start)}`,
        seriesId: item.id,
        dueAt: start,
        endsAt: duration ? new Date(start.getTime() + duration) : item.endsAt,
        seriesStart: item.dueAt,
      });
      start = addPeriod(start, rec);
    }
  }

  return out.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}
