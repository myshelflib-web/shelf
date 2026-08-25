/** Local calendar-day difference: 0 = today, 1 = yesterday, etc. */
export function localDayDiff(timestamp: number, now = Date.now()): number {
  const startOf = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((startOf(now) - startOf(timestamp)) / 86_400_000);
}

/** Lowercase relative day: today, yesterday, Monday, 4 days ago. */
export function formatRelativeDayLabel(
  timestamp: number,
  now = Date.now()
): string {
  const days = localDayDiff(timestamp, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: "long",
    });
  }
  return `${days} days ago`;
}

export function formatOpenedAgo(timestamp: number, now = Date.now()): string {
  const label = formatRelativeDayLabel(timestamp, now);
  return label === "today" ? "Opened today" : `Opened ${label}`;
}

export function formatLastStudied(timestamp: number, now = Date.now()): string {
  const label = formatRelativeDayLabel(timestamp, now);
  return label === "today" ? "Last studied today" : `Last studied ${label}`;
}
