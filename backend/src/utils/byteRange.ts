/** Parse a single HTTP Range bytes unit against a known object size. */
export function parseBytesRange(
  header: string | undefined,
  size: number
): { start: number; end: number } | "unsatisfiable" | null {
  if (!header || size <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!m) return null;

  const startRaw = m[1]!;
  const endRaw = m[2]!;

  let start: number;
  let end: number;

  if (startRaw === "" && endRaw !== "") {
    // suffix: bytes=-500
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else if (startRaw !== "") {
    start = Number(startRaw);
    end = endRaw === "" ? size - 1 : Number(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "unsatisfiable";
    end = Math.min(end, size - 1);
  } else {
    return "unsatisfiable";
  }

  if (start < 0 || start >= size || start > end) return "unsatisfiable";
  return { start, end };
}
