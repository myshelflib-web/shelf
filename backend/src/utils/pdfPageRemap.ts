/** Remap 1-based PDF page numbers after deleting some pages. */
export function remapPageNumberAfterDeletes(
  pageNumber: number,
  deletedPages: ReadonlyArray<number>
): number | null {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) return null;
  const deleted = new Set(
    deletedPages.filter((n) => Number.isInteger(n) && n >= 1)
  );
  if (deleted.has(pageNumber)) return null;
  let shift = 0;
  for (const d of deleted) {
    if (d < pageNumber) shift += 1;
  }
  return pageNumber - shift;
}

export function normalizeDeletedPages(
  raw: unknown,
  numPagesBefore: number
): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const pages = [
    ...new Set(
      raw
        .map((n) => (typeof n === "number" ? n : Number(n)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= numPagesBefore)
    ),
  ].sort((a, b) => a - b);
  if (pages.length === 0) return null;
  if (pages.length >= numPagesBefore) return null;
  return pages;
}
