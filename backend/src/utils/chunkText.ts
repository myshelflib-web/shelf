function normalizeForChunk(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSections(text: string): string[] {
  const parts = text.split(/(?=\n#{1,3}\s)/);
  const sections: string[] = [];
  for (const part of parts) {
    const paras = part.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (paras.length === 0) continue;
    sections.push(paras.join("\n\n"));
  }
  return sections.length > 0 ? sections : [text];
}

function snapToSentence(slice: string, size: number): string {
  if (slice.length < size * 0.55) return slice.trim();
  const window = slice.slice(Math.floor(size * 0.55));
  const marks = [". ", "? ", "! ", ".\n"];
  let best = -1;
  for (const mark of marks) {
    const at = window.lastIndexOf(mark);
    if (at > best) best = at;
  }
  if (best < 0) return slice.trim();
  const cut = Math.floor(size * 0.55) + best + 1;
  const snapped = slice.slice(0, cut).trim();
  return snapped.length >= Math.floor(size * 0.4) ? snapped : slice.trim();
}

function chunkSection(text: string, size: number, overlap: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + size);
    const raw = clean.slice(i, end);
    const piece =
      end < clean.length ? snapToSentence(raw, size) : raw.trim();
    chunks.push(piece);
    if (end >= clean.length) break;
    const consumed = piece.length || size;
    i = Math.max(i + consumed - overlap, i + 1);
  }
  return chunks.filter(Boolean);
}

/** Heading- and sentence-aware chunks with overlap for embedding. */
export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = normalizeForChunk(text);
  if (!clean) return [];
  if (clean.replace(/\s+/g, " ").trim().length <= size) {
    return [clean.replace(/\s+/g, " ").trim()];
  }
  const out: string[] = [];
  for (const section of splitSections(clean)) {
    out.push(...chunkSection(section, size, overlap));
  }
  return out.filter(Boolean);
}
