/** Last 7 calendar days ending today (local), oldest → newest. */
export function last7DayKeys(todayYmd: string): string[] {
  const [y, m, d] = todayYmd.split("-").map(Number);
  const end = new Date(y, m - 1, d, 12, 0, 0);
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(end);
    dt.setDate(end.getDate() - i);
    keys.push(
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
    );
  }
  return keys;
}

export function last7DayActivity(activeDates: string[], todayYmd: string) {
  const active = new Set(activeDates);
  return last7DayKeys(todayYmd).map((key) => active.has(key));
}

export const LAST7_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
